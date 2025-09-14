use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount, Token, mint_to, burn, MintTo, Burn};
use anchor_lang::solana_program::keccak::hash;
use anchor_lang::solana_program::clock::Clock;
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::solana_program::ed25519_program::ID as ED25519_ID;
use anchor_lang::solana_program::instruction::Instruction;

declare_id!("J26bKBS2G41XUAKXFc8JXQSR1op2qwkhYojjvBNsSTeC");

const MAX_REWARD_AMOUNT: u64 = 1000;
const MAX_DAILY_REWARDS: u64 = 5000;
const MAX_DATA_AGE: i64 = 300;

#[program]
pub mod solana_platform {
    use super::*;
    
    pub fn initialize_program(
        ctx: Context<InitializeProgram>,
        authority: Pubkey,
    ) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        state.authority = authority;
        state.total_rewards_distributed = 0;
        state.total_tokens_burned = 0;
        state.signer_pubkey = authority;
        Ok(())
    }
    
    pub fn claim_reward(
        ctx: Context<ClaimReward>, 
        amount: u64,
        kpi_type: u8,
        timestamp: i64,
        signature: [u8; 64],
    ) -> Result<()> {
        // Generate expected message hash
        let generated_hash = generate_kpi_hash(
            ctx.accounts.founder.key(),
            amount,
            kpi_type,
            timestamp,
        );
        
        // Verify off-chain signature (Ed25519)
        let mut ix = Instruction::new_with_bytes(
            ED25519_ID,
            &[
                &signature[..],
                &[0u8; 32],
                &ctx.accounts.program_state.signer_pubkey.to_bytes(),
                generated_hash.as_ref(),
                &generated_hash.len().to_le_bytes(),
            ].concat(),
            vec![],
        );
        anchor_lang::solana_program::program::invoke(&ix, &[])?;
        
        // Check for stale data
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time - timestamp <= MAX_DATA_AGE,
            ErrorCode::StaleData
        );
        
        // Check reward limits
        require!(amount <= MAX_REWARD_AMOUNT, ErrorCode::ExcessiveReward);
        
        // Enforce daily limits
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
        
        // Mint tokens to founder
        let mint_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.aux_mint.to_account_info(),
                to: ctx.accounts.founder_token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
        );
        mint_to(mint_ctx, amount)?;
        
        // Calculate and execute burn (1%)
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
        
        // Update program state
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
    
    #[account(mut)]
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