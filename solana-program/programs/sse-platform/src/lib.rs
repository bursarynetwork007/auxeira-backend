use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount, Token, mint_to, burn, MintTo, Burn};
use anchor_lang::solana_program::keccak::hash;
use anchor_lang::soluse anchor_lang::soluse anchor_lang::soluse anchor_lang::soluse ey::Pubkey;
use anchor_lang::solana_program::ed25519_program::ID as ED25519_ID;
use anchor_lang::solana_program::instruction::Instruction;

declare_id!("AUdeclare_id!("AUdeclare_id!("AUdeclare_id!("AUdect MAX_REWARD_AMOUNT: u64 = 1000;
const MAX_DAILY_REWARDS: u64 = 5000;
const MAX_DATA_AGE: i64 = 3[package]
name = "sse-platform"
version = "0.1 sname = "
 version = "0.1.0"
dealdescription = "C  edition = "2021"

[lializeProgram>,

[lib]
crate-tyty:cratkename = "sse_platform"

[featu
[features]
no-entrytx.no-entrypprno-idl = []
no-lo  no-log-ix-thcpi = ["no-entrypo
 default = []

[dependear
[dependenctedanchor-lang = sanchor-spl = "0.31.1"neEOF

# STEP 3: Fix t.signer# STEP 3: Fix t.signer# STEP 3: Fix t.signer#
    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        amount: u64,
        kpi_type: u8,
        timestamp: i64,
        signature: [u8; 64],
    ) -> Result<()> {
        let generated_hash = generate_kpi_hash(
            ctx.accounts.founder.key(),
            amount,
            kpi_type,
            timestamp,
        );

        let mut ix_data = Vec::new();
        ix_data.extend_from_slice(&signature);
        ix_data.extend_from_slice(&[0u8; 32]);
        ix_data.extend_from_slice(&ctx.accounts.program_state.signer_pubkey.to_bytes());
        ix_data.extend_from_slice(generated_hash.as_ref());
        ix_data.extend_from_slice(&(generated_hash.len() as u32).to_le_bytes());

        let ix = Instruction::new_with_bytes(
            ED25519_ID,
            &ix_data,
            vec![],
        );
        anchor_lang::solana_program::program::invoke(&ix, &[])?;

        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time - timestamp <= MAX_DATA_AGE,
            ErrorCode::StaleData
        );

        require!(amount <= MAX_REWARD_AMOUNT, ErrorCode::ExcessiveReward);

        let reward_state = &mut ctx.accounts.reward_state;
        if reward_state.last_claim / 86400 == current_time / 86400 {
            require!(
                reward_state.daily_claimed + amount <= MAX_DAILY_REWARDS,
                ErrorCode::DailyLimitExceeded
            );
        } else {
            reward_state.daily_claimed = 0;
        }
        reward_state.daily_claimed += amount;
        reward_state.last_claim = current_time;

        let mint_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.aux_mint.to_account_info(),
                to: ctx.accounts.founder_token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
        );
        mint_to(mint_ctx, amount)?;

        let burn_amount = amount / 100;
        if burn_amount > 0 {
            let burn_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.aux_mint.to_account_info(),
                    from: ctx.accounts.founder_token_account.to_account_info(),
                    authority: ctx.accounts.founder.to_account_info(),
                },
            );
            burn(burn_ctx, burn_amount)?;
        }

        let state = &mut ctx.accounts.program_state;
        state.total_rewards_distributed += amount - burn_amount;
        state.total_tokens_burned += burn_amount;

        emit!(RewardClaimed {
            founder: ctx.accounts.founder.key(),
            amount: amount - burn_amount,
            kpi_type,
            timestamp: current_time,
        });

        Ok(())
    }

    pub fn update_authority(
        ctx: Context<UpdateAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        state.authority = new_authority;
        Ok(())
    }

    pub fn update_signer_key(
        ctx: Context<UpdateAuthority>,
        new_signer: Pubkey,
    ) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        state.signer_pubkey = new_signer;
        Ok(())
    }
}

pub fn generate_kpi_hash(
    founder: Pubkey,
    amount: u64,
    kpi_type: u8,
    timestamp: i64,
) -> [u8; 32] {
    let mut data = Vec::new();
    data.extend_from_slice(&founder.to_bytes());
    data.extend_from_slice(&amount.to_le_bytes());
    data.push(kpi_type);
    data.extend_from_slice(&timestamp.to_le_bytes());
    hash(&data).0
}

#[derive(Accounts)]
pub struct InitializeProgram<'info> {
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
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,

    #[account(mut)]
    pub aux_mint: Account<'info, Mint>,

    #[account(mut)]
    pub founder_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = founder,
        space = 8 + 8 + 8,
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
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAuthority<'info> {
    #[account(
        mut,
        has_one = authority
    )]
    pub program_state: Account<'info, ProgramState>,

    pub authority: Signer<'info>,
}

#[account]
pub struct ProgramState {
    pub authority: Pubkey,
    pub total_rewards_distributed: u64,
    pub total_tokens_burned: u64,
    pub signer_pubkey: Pubkey,
}

#[account]
#[derive(Default)]
pub struct RewardState {
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










