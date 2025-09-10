use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Burn};
use ed25519_dalek::{PublicKey, Signature, Verifier};


declare_id!("76nVkXzaCc9XWh4hv2hMFjQQxc4QfsxJS3foo9Ad3tQc"); // Replace with your actual program ID

#[program]
pub mod sse_platform {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, signer_pubkey: Pubkey) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        state.authority = *ctx.accounts.authority.key;
        state.signer_pubkey = signer_pubkey;
        state.total_rewards_distributed = 0;
        state.total_tokens_burned = 0;
        Ok(())
    }

    pub fn initialize_reward_state(ctx: Context<InitializeRewardState>) -> Result<()> {
        let reward_state = &mut ctx.accounts.reward_state;
        reward_state.founder = *ctx.accounts.founder.key;
        reward_state.last_claim = 0;
        reward_state.daily_claimed = 0;
        Ok(())
    }

    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        amount: u64,
        kpi_type: u8,
        timestamp: i64,
        signature: [u8; 64],
    ) -> Result<()> {
        // Verify signature
        let message = {
            let mut msg = Vec::new();
            msg.extend_from_slice(&amount.to_le_bytes());
            msg.extend_from_slice(&kpi_type.to_le_bytes());
            msg.extend_from_slice(&timestamp.to_le_bytes());
            msg.extend_from_slice(ctx.accounts.founder.key.as_ref());
            msg
        };

        let public_key = PublicKey::from_bytes(&ctx.accounts.program_state.signer_pubkey.to_bytes())
            .map_err(|_| ErrorCode::InvalidSignature)?;
        let signature = Signature::from_bytes(&signature);
        public_key.verify(&message, &signature)
            .map_err(|_| ErrorCode::InvalidSignature)?;

        // Check data freshness
        let clock = Clock::get()?;
        require!(clock.unix_timestamp - timestamp < 300, ErrorCode::StaleData);

        // Check limits
        require!(amount <= 1000, ErrorCode::ExcessiveReward);

        // Update daily limits
        let reward_state = &mut ctx.accounts.reward_state;
        let current_day = clock.unix_timestamp / 86400;
        let last_claim_day = reward_state.last_claim / 86400;

        if current_day == last_claim_day {
            require!(
                reward_state.daily_claimed + amount <= 5000,
                ErrorCode::DailyLimitExceeded
            );
            reward_state.daily_claimed += amount;
        } else {
            reward_state.daily_claimed = amount;
        }
        reward_state.last_claim = clock.unix_timestamp;

        // Mint tokens (99% to founder, 1% burn)
        let mint_amount = amount * 99 / 100;
        let burn_amount = amount / 100;

        // Mint to founder
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.aux_mint.to_account_info(),
                    to: ctx.accounts.founder_token_account.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
                &[&[b"mint_authority", &[*ctx.bumps.get("mint_authority").unwrap()]]],
            ),
            mint_amount,
        )?;

        // Burn 1%
        if burn_amount > 0 {
            token::burn(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Burn {
                        mint: ctx.accounts.aux_mint.to_account_info(),
                        from: ctx.accounts.founder_token_account.to_account_info(),
                        authority: ctx.accounts.founder.to_account_info(),
                    },
                ),
                burn_amount,
            )?;
        }

        // Update state
        let state = &mut ctx.accounts.program_state;
        state.total_rewards_distributed += mint_amount;
        state.total_tokens_burned += burn_amount;

        emit!(RewardClaimed {
            founder: *ctx.accounts.founder.key,
            amount: mint_amount,
            kpi_type,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 32
    )]
    pub program_state: Account<'info, ProgramState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeRewardState<'info> {
    #[account(
        init,
        payer = founder,
        space = 8 + 32 + 8 + 8,
        seeds = [b"reward_state", founder.key().as_ref()],
        bump
    )]
    pub reward_state: Account<'info, RewardState>,
    #[account(mut)]
    pub founder: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,
    #[account(mut)]
    pub aux_mint: Account<'info, Mint>,
    #[account(mut)]
    pub founder_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"reward_state", founder.key().as_ref()],
        bump
    )]
    pub reward_state: Account<'info, RewardState>,
    #[account(mut)]
    pub founder: Signer<'info>,
    /// CHECK: Mint authority PDA
    #[account(
        seeds = [b"mint_authority"],
        bump,
    )]
    pub mint_authority: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct ProgramState {
    pub authority: Pubkey,
    pub total_rewards_distributed: u64,
    pub total_tokens_burned: u64,
    pub signer_pubkey: Pubkey,
}

#[account]
pub struct RewardState {
    pub founder: Pubkey,
    pub last_claim: i64,
    pub daily_claimed: u64,
}

#[event]
pub struct RewardClaimed {
    pub founder: Pubkey,
    pub amount: u64,
    pub kpi_type: u8,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid signature provided")]
    InvalidSignature,
    #[msg("Reward amount exceeds maximum allowed")]
    ExcessiveReward,
    #[msg("Daily reward limit exceeded")]
    DailyLimitExceeded,
    #[msg("Data is stale")]
    StaleData,
    #[msg("Insufficient mint authority")]
    InvalidMintAuthority,
}