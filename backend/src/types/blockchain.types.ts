/**
 * Blockchain Type Definitions
 * Comprehensive types for Solana, Ethereum, and Chainlink integrations
 */

// Base blockchain types
export type BlockchainNetwork = 'solana' | 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'bsc' | 'avalanche';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

export type TokenStandard = 'SPL' | 'ERC20' | 'ERC721' | 'ERC1155' | 'native';

// Wallet types
export interface BaseWallet {
  userId: string;
  network: BlockchainNetwork;
  address: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed: Date;
}

export interface SolanaWallet extends BaseWallet {
  network: 'solana';
  publicKey: string;
  balance: number; // SOL balance
  tokenAccounts: SolanaTokenAccount[];
  stakingAccounts: SolanaStakingAccount[];
  nftAccounts: SolanaNFTAccount[];
}

export interface EthereumWallet extends BaseWallet {
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism';
  address: string;
  balance: string; // ETH balance in wei
  nonce: number;
  tokenBalances: EthereumTokenBalance[];
  nftBalances: EthereumNFTBalance[];
  stakingPositions: EthereumStakingPosition[];
}

// Token account types
export interface SolanaTokenAccount {
  mint: string;
  address: string;
  balance: number;
  decimals: number;
  symbol: string;
  name: string;
  logoUri?: string;
  isNative: boolean;
  usdValue?: number;
}

export interface EthereumTokenBalance {
  contractAddress: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  logoUri?: string;
  usdValue?: number;
  allowances: Array<{
    spender: string;
    amount: string;
  }>;
}

// NFT types
export interface SolanaNFTAccount {
  mint: string;
  address: string;
  name: string;
  symbol: string;
  uri: string;
  metadata: SolanaNFTMetadata;
  collection?: string;
  verified: boolean;
}

export interface EthereumNFTBalance {
  contractAddress: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  animationUrl?: string;
  externalUrl?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  collection: {
    name: string;
    description: string;
    imageUrl: string;
    verified: boolean;
  };
  rarity?: {
    rank: number;
    score: number;
    total: number;
  };
}

export interface SolanaNFTMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    files: Array<{
      uri: string;
      type: string;
    }>;
    category: string;
    creators: Array<{
      address: string;
      verified: boolean;
      share: number;
    }>;
  };
}

// Staking types
export interface SolanaStakingAccount {
  address: string;
  stakedAmount: number;
  rewardAmount: number;
  validator: string;
  activationEpoch: number;
  deactivationEpoch?: number;
  status: 'active' | 'inactive' | 'deactivating';
}

export interface EthereumStakingPosition {
  positionId: string;
  contractAddress: string;
  stakedAmount: string;
  rewardAmount: string;
  stakingDuration: number;
  apy: number;
  lockupPeriod: number;
  canUnstake: boolean;
  nextRewardDate: Date;
  multiplier: number;
  validator?: string;
}

// Transaction types
export interface BaseTransaction {
  id: string;
  network: BlockchainNetwork;
  hash: string;
  from: string;
  to: string;
  amount: string;
  token?: string;
  status: TransactionStatus;
  blockNumber: number;
  blockHash: string;
  gasUsed: string;
  gasPrice: string;
  fee: string;
  timestamp: Date;
  confirmations: number;
  metadata: Record<string, any>;
}

export interface SolanaTransaction extends BaseTransaction {
  network: 'solana';
  signature: string;
  slot: number;
  instructions: Array<{
    programId: string;
    accounts: string[];
    data: string;
  }>;
  logs: string[];
  computeUnitsConsumed?: number;
}

export interface EthereumTransaction extends BaseTransaction {
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism';
  hash: string;
  nonce: number;
  gasLimit: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  logs: Array<{
    address: string;
    topics: string[];
    data: string;
    blockNumber: number;
    transactionHash: string;
    logIndex: number;
  }>;
  input: string;
}

// Smart contract types
export interface SmartContract {
  contractId: string;
  network: BlockchainNetwork;
  address: string;
  name: string;
  description: string;
  abi: any[];
  bytecode?: string;
  sourceCode?: string;
  compiler: string;
  version: string;
  isVerified: boolean;
  deployedAt: Date;
  deployedBy: string;
  deploymentTransaction: string;
}

export interface ContractFunction {
  name: string;
  type: 'function' | 'constructor' | 'receive' | 'fallback';
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  inputs: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
  documentation?: string;
}

export interface ContractEvent {
  name: string;
  inputs: Array<{
    name: string;
    type: string;
    indexed: boolean;
  }>;
  anonymous: boolean;
  documentation?: string;
}

// Governance types
export interface GovernanceProposal {
  proposalId: string;
  network: BlockchainNetwork;
  title: string;
  description: string;
  proposer: string;
  status: 'draft' | 'active' | 'succeeded' | 'defeated' | 'queued' | 'executed' | 'cancelled';
  category: 'parameter_change' | 'treasury' | 'upgrade' | 'partnership' | 'other';
  votingPower: {
    total: string;
    for: string;
    against: string;
    abstain: string;
  };
  quorum: {
    required: string;
    current: string;
    percentage: number;
  };
  timeline: {
    created: Date;
    votingStart: Date;
    votingEnd: Date;
    executionETA?: Date;
    executed?: Date;
  };
  actions: Array<{
    target: string;
    value: string;
    signature: string;
    calldata: string;
  }>;
  metadata: {
    ipfsHash?: string;
    tags: string[];
    discussionUrl?: string;
  };
}

export interface GovernanceVote {
  voteId: string;
  proposalId: string;
  voter: string;
  support: 'for' | 'against' | 'abstain';
  votingPower: string;
  reason?: string;
  timestamp: Date;
  transactionHash: string;
}

// Missing type definitions for compilation fixes
export type UnifiedWallet = SolanaWallet | EthereumWallet;

export type StakingPosition = SolanaStakingAccount;

export interface TokenPrice {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated: Date;
}

export type TokenBalance = SolanaTokenAccount | EthereumTokenBalance;

export interface GovernanceDelegate {
  delegator: string;
  delegate: string;
  votingPower: string;
  delegatedAt: Date;
  isActive: boolean;
  network: BlockchainNetwork;
}

// Oracle types
export interface OracleDataFeed {
  feedId: string;
  name: string;
  description: string;
  dataType: 'price' | 'weather' | 'sports' | 'market' | 'social' | 'custom';
  source: 'chainlink' | 'band' | 'api3' | 'custom';
  network: BlockchainNetwork;
  contractAddress: string;
  decimals: number;
  heartbeat: number; // Update frequency in seconds
  deviation: number; // Price deviation threshold
  isActive: boolean;
  lastUpdated: Date;
}

export interface OraclePrice {
  feedId: string;
  pair: string;
  price: string;
  decimals: number;
  confidence: number;
  roundId: string;
  updatedAt: Date;
  source: string;
  metadata: {
    previousPrice?: string;
    priceChange?: number;
    priceChangePercent?: number;
    volume24h?: string;
  };
}

export interface VRFRequest {
  requestId: string;
  requester: string;
  network: BlockchainNetwork;
  numWords: number;
  randomWords: string[];
  status: 'pending' | 'fulfilled' | 'failed';
  requestedAt: Date;
  fulfilledAt?: Date;
  gasUsed?: string;
  callbackGasLimit: number;
  metadata: Record<string, any>;
}

export interface ChainlinkFunctionRequest {
  requestId: string;
  requester: string;
  network: BlockchainNetwork;
  source: string;
  args: string[];
  secrets?: Record<string, string>;
  result?: string;
  error?: string;
  status: 'pending' | 'fulfilled' | 'failed';
  requestedAt: Date;
  fulfilledAt?: Date;
  gasUsed?: string;
  subscriptionId: string;
  donId: string;
}

// Cross-chain types
export interface CrossChainBridge {
  bridgeId: string;
  name: string;
  sourceChains: BlockchainNetwork[];
  destinationChains: BlockchainNetwork[];
  supportedTokens: string[];
  fees: {
    fixed: string;
    percentage: number;
  };
  limits: {
    min: string;
    max: string;
    daily: string;
  };
  estimatedTime: number; // in seconds
  isActive: boolean;
  securityScore: number;
}

export interface CrossChainTransaction {
  transactionId: string;
  userId: string;
  bridgeId: string;
  sourceChain: BlockchainNetwork;
  destinationChain: BlockchainNetwork;
  sourceTransaction: string;
  destinationTransaction?: string;
  amount: string;
  token: string;
  sourceAddress: string;
  destinationAddress: string;
  status: 'pending' | 'bridging' | 'completed' | 'failed' | 'refunded';
  estimatedTime: number;
  actualTime?: number;
  fees: {
    sourceFee: string;
    bridgeFee: string;
    destinationFee: string;
    totalFee: string;
  };
  progress: {
    sourceConfirmed: boolean;
    bridgeProcessed: boolean;
    destinationConfirmed: boolean;
    currentStep: string;
    estimatedCompletion: Date;
  };
  createdAt: Date;
  completedAt?: Date;
  refundedAt?: Date;
}

// DeFi types
export interface LiquidityPool {
  poolId: string;
  network: BlockchainNetwork;
  protocol: string;
  token0: {
    address: string;
    symbol: string;
    reserve: string;
  };
  token1: {
    address: string;
    symbol: string;
    reserve: string;
  };
  totalLiquidity: string;
  volume24h: string;
  fees24h: string;
  apy: number;
  lpTokenAddress: string;
  lpTokenSupply: string;
}

export interface LiquidityPosition {
  positionId: string;
  userId: string;
  poolId: string;
  lpTokens: string;
  token0Amount: string;
  token1Amount: string;
  shareOfPool: number;
  unclaimedFees: {
    token0: string;
    token1: string;
  };
  impermanentLoss: {
    current: number;
    percentage: number;
  };
  createdAt: Date;
  lastUpdated: Date;
}

export interface YieldFarmingPosition {
  positionId: string;
  userId: string;
  farmId: string;
  stakedAmount: string;
  rewardTokens: Array<{
    token: string;
    amount: string;
    usdValue: number;
  }>;
  apy: number;
  lockupPeriod?: number;
  canUnstake: boolean;
  nextRewardDate: Date;
  totalEarned: string;
  createdAt: Date;
}

// Token types
export interface Token {
  address: string;
  network: BlockchainNetwork;
  standard: TokenStandard;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: string;
  circulatingSupply: string;
  logoUri?: string;
  description?: string;
  website?: string;
  socialMedia?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  isVerified: boolean;
  tags: string[];
  createdAt: Date;
}

export interface TokenMetrics {
  address: string;
  network: BlockchainNetwork;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  fullyDilutedValuation: number;
  holders: number;
  transfers24h: number;
  liquidityUSD: number;
  lastUpdated: Date;
}

export interface TokenAllocation {
  category: 'team' | 'investors' | 'treasury' | 'community' | 'ecosystem' | 'advisors' | 'public';
  percentage: number;
  amount: string;
  vestingSchedule?: {
    cliff: number; // in months
    duration: number; // in months
    tge: number; // Token Generation Event percentage
  };
  isLocked: boolean;
  unlockDate?: Date;
}

// Staking types
export interface StakingPool {
  poolId: string;
  network: BlockchainNetwork;
  contractAddress: string;
  name: string;
  description: string;
  stakingToken: string;
  rewardTokens: string[];
  apy: number;
  totalStaked: string;
  totalRewards: string;
  stakingCap?: string;
  lockupPeriods: number[]; // in seconds
  minimumStake: string;
  fees: {
    deposit: number;
    withdrawal: number;
    performance: number;
  };
  isActive: boolean;
  createdAt: Date;
}

export interface StakingReward {
  rewardId: string;
  userId: string;
  positionId: string;
  token: string;
  amount: string;
  usdValue: number;
  earnedAt: Date;
  claimedAt?: Date;
  transactionHash?: string;
  rewardType: 'staking' | 'liquidity' | 'governance' | 'referral';
}

// Governance types extended
export interface GovernanceConfig {
  network: BlockchainNetwork;
  contractAddress: string;
  votingToken: string;
  proposalThreshold: string;
  quorum: string;
  votingDelay: number; // in blocks
  votingPeriod: number; // in blocks
  executionDelay: number; // in seconds
  gracePeriod: number; // in seconds
  proposalMaxOperations: number;
}

export interface GovernanceParticipant {
  address: string;
  network: BlockchainNetwork;
  votingPower: string;
  delegatedPower: string;
  proposalsCreated: number;
  votesCase: number;
  participationRate: number;
  reputation: number;
  isDelegate: boolean;
  delegators: string[];
  joinedAt: Date;
}

// Oracle types extended
export interface OracleJob {
  jobId: string;
  name: string;
  description: string;
  network: BlockchainNetwork;
  oracleType: 'chainlink' | 'band' | 'api3' | 'pyth' | 'custom';
  dataSource: string;
  updateFrequency: number;
  lastUpdate: Date;
  nextUpdate: Date;
  isActive: boolean;
  configuration: Record<string, any>;
  metrics: {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    lastError?: string;
  };
}

export interface ExternalDataValidation {
  validationId: string;
  dataType: 'company' | 'website' | 'social' | 'financial' | 'market' | 'regulatory';
  source: string;
  query: Record<string, any>;
  result: {
    score: number;
    confidence: number;
    data: Record<string, any>;
    riskFactors: string[];
    recommendations: string[];
  };
  cost: {
    amount: string;
    currency: string;
  };
  requestedAt: Date;
  completedAt: Date;
  requestedBy: string;
}

// Analytics types
export interface BlockchainMetrics {
  network: BlockchainNetwork;
  period: '1h' | '24h' | '7d' | '30d' | '1y';
  transactions: {
    total: number;
    successful: number;
    failed: number;
    averageGas: string;
    totalFees: string;
  };
  tokens: {
    transfers: number;
    uniqueTokens: number;
    totalVolume: string;
  };
  defi: {
    totalValueLocked: string;
    liquidityPools: number;
    yieldFarms: number;
    averageAPY: number;
  };
  nfts: {
    mints: number;
    transfers: number;
    collections: number;
    totalVolume: string;
  };
  governance: {
    proposals: number;
    votes: number;
    participation: number;
  };
}

export interface UserBlockchainActivity {
  userId: string;
  network: BlockchainNetwork;
  period: '24h' | '7d' | '30d';
  transactions: {
    sent: number;
    received: number;
    totalValue: string;
    averageValue: string;
  };
  tokens: {
    held: number;
    traded: number;
    earned: string;
  };
  defi: {
    poolsParticipated: number;
    liquidityProvided: string;
    yieldEarned: string;
    stakingRewards: string;
  };
  governance: {
    proposalsVoted: number;
    votingPower: string;
    proposalsCreated: number;
  };
  nfts: {
    owned: number;
    traded: number;
    created: number;
  };
}

// Security types
export interface SecurityAlert {
  alertId: string;
  type: 'suspicious_transaction' | 'unusual_activity' | 'smart_contract_risk' | 'phishing_attempt' | 'rug_pull_warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  network: BlockchainNetwork;
  affectedAddress: string;
  description: string;
  indicators: string[];
  recommendations: string[];
  autoBlocked: boolean;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface RiskAssessment {
  address: string;
  network: BlockchainNetwork;
  riskScore: number; // 0-100
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  factors: Array<{
    factor: string;
    weight: number;
    score: number;
    description: string;
  }>;
  recommendations: string[];
  lastAssessed: Date;
  assessmentVersion: string;
}

// Integration types
export interface BlockchainIntegration {
  integrationId: string;
  name: string;
  description: string;
  networks: BlockchainNetwork[];
  services: Array<{
    service: string;
    endpoint: string;
    apiKey?: string;
    isActive: boolean;
  }>;
  webhooks: Array<{
    url: string;
    events: string[];
    isActive: boolean;
  }>;
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  configuration: Record<string, any>;
  createdAt: Date;
  lastUsed: Date;
}

// Event types
export interface BlockchainEvent {
  eventId: string;
  network: BlockchainNetwork;
  eventType: string;
  contractAddress?: string;
  transactionHash: string;
  blockNumber: number;
  logIndex?: number;
  topics: string[];
  data: string;
  decodedData?: Record<string, any>;
  timestamp: Date;
  processed: boolean;
  processedAt?: Date;
}

export interface EventSubscription {
  subscriptionId: string;
  userId: string;
  network: BlockchainNetwork;
  eventType: string;
  contractAddress?: string;
  filters: Record<string, any>;
  webhook?: string;
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

// Utility types
export interface GasEstimate {
  network: BlockchainNetwork;
  operation: string;
  gasLimit: string;
  gasPrice: {
    slow: string;
    standard: string;
    fast: string;
    instant: string;
  };
  estimatedCost: {
    slow: string;
    standard: string;
    fast: string;
    instant: string;
  };
  estimatedTime: {
    slow: number;
    standard: number;
    fast: number;
    instant: number;
  };
}

export interface NetworkStatus {
  network: BlockchainNetwork;
  status: 'healthy' | 'degraded' | 'down';
  blockHeight: number;
  blockTime: number;
  gasPrice: string;
  tps: number; // Transactions per second
  congestion: 'low' | 'medium' | 'high';
  lastUpdated: Date;
  issues?: string[];
}

// API response types
export interface BlockchainApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata: {
    network?: BlockchainNetwork;
    timestamp: Date;
    requestId: string;
    executionTime: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters?: Record<string, any>;
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

// Webhook types
export interface BlockchainWebhook {
  webhookId: string;
  url: string;
  events: string[];
  networks: BlockchainNetwork[];
  filters: Record<string, any>;
  headers: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffTime: number;
  };
  security: {
    secretKey: string;
    signatureHeader: string;
    ipWhitelist?: string[];
  };
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  successRate: number;
  totalDeliveries: number;
}

export interface WebhookDelivery {
  deliveryId: string;
  webhookId: string;
  eventId: string;
  payload: Record<string, any>;
  response?: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  };
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  deliveredAt?: Date;
  nextRetryAt?: Date;
  createdAt: Date;
}

// Configuration types
export interface BlockchainServiceConfig {
  networks: {
    solana: {
      enabled: boolean;
      rpcEndpoint: string;
      wsEndpoint: string;
      commitment: 'processed' | 'confirmed' | 'finalized';
    };
    ethereum: {
      enabled: boolean;
      rpcEndpoint: string;
      wsEndpoint: string;
      chainId: number;
    };
    polygon: {
      enabled: boolean;
      rpcEndpoint: string;
      chainId: number;
    };
    arbitrum: {
      enabled: boolean;
      rpcEndpoint: string;
      chainId: number;
    };
    optimism: {
      enabled: boolean;
      rpcEndpoint: string;
      chainId: number;
    };
  };
  oracles: {
    chainlink: {
      enabled: boolean;
      networks: BlockchainNetwork[];
      priceFeeds: Record<string, string>;
      vrfEnabled: boolean;
      functionsEnabled: boolean;
    };
    pyth: {
      enabled: boolean;
      networks: BlockchainNetwork[];
      priceFeeds: Record<string, string>;
    };
  };
  crossChain: {
    enabled: boolean;
    bridges: string[];
    defaultBridge: string;
    maxSlippage: number;
  };
  security: {
    riskAssessmentEnabled: boolean;
    transactionMonitoring: boolean;
    suspiciousActivityThreshold: number;
    autoBlockSuspiciousTransactions: boolean;
  };
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  monitoring: {
    healthCheckInterval: number;
    alertThresholds: {
    latency: number;
      errorRate: number;
      gasPrice: number;
    };
  };
}

// Error types
export interface BlockchainError {
  code: string;
  message: string;
  network?: BlockchainNetwork;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export type BlockchainErrorCode =
  | 'NETWORK_ERROR'
  | 'INSUFFICIENT_FUNDS'
  | 'GAS_LIMIT_EXCEEDED'
  | 'TRANSACTION_FAILED'
  | 'CONTRACT_ERROR'
  | 'INVALID_ADDRESS'
  | 'TOKEN_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'ORACLE_ERROR'
  | 'CROSS_CHAIN_ERROR'
  | 'VALIDATION_ERROR';

// Request/Response types for API endpoints
export interface CreateWalletRequest {
  userId: string;
  network: BlockchainNetwork;
  walletType: 'custodial' | 'non_custodial';
}

export interface TransferTokenRequest {
  fromUserId: string;
  toAddress: string;
  token: string;
  amount: string;
  network: BlockchainNetwork;
  memo?: string;
}

export interface StakeTokensRequest {
  userId: string;
  poolId: string;
  amount: string;
  lockupPeriod?: number;
  network: BlockchainNetwork;
}

export interface CreateProposalRequest {
  userId: string;
  title: string;
  description: string;
  category: GovernanceProposal['category'];
  actions: Array<{
    target: string;
    value: string;
    signature: string;
    calldata: string;
  }>;
  network: BlockchainNetwork;
}

export interface VoteOnProposalRequest {
  userId: string;
  proposalId: string;
  support: 'for' | 'against' | 'abstain';
  reason?: string;
  network: BlockchainNetwork;
}

export interface GetPriceRequest {
  symbols: string[];
  currency?: string;
  includeChange?: boolean;
  includeVolume?: boolean;
}

export interface ValidateDataRequest {
  dataType: 'company' | 'website' | 'social' | 'financial' | 'market';
  parameters: Record<string, any>;
  sources?: string[];
  confidenceThreshold?: number;
}

// Response types
export interface WalletResponse {
  wallet: UnifiedWallet;
  networks: BlockchainNetwork[];
  totalUSDValue: number;
  lastSynced: Date;
}

export interface TransactionResponse {
  transaction: BaseTransaction;
  network: BlockchainNetwork;
  estimatedConfirmationTime: number;
  explorerUrl: string;
}

export interface StakingResponse {
  position: StakingPosition | EthereumStakingPosition;
  estimatedRewards: {
    daily: string;
    monthly: string;
    yearly: string;
  };
  apy: number;
  network: BlockchainNetwork;
}

export interface GovernanceResponse {
  proposal: GovernanceProposal;
  userVotingPower: string;
  hasVoted: boolean;
  userVote?: GovernanceVote;
  network: BlockchainNetwork;
}

export interface PriceResponse {
  prices: TokenPrice[];
  lastUpdated: Date;
  sources: string[];
}

export interface ValidationResponse {
  validationId: string;
  score: number;
  confidence: number;
  results: Record<string, any>;
  riskFactors: string[];
  recommendations: string[];
  cost: string;
  completedAt: Date;
}

// Batch operation types
export interface BatchTransferRequest {
  fromUserId: string;
  transfers: Array<{
    toAddress: string;
    token: string;
    amount: string;
    memo?: string;
  }>;
  network: BlockchainNetwork;
}

export interface BatchStakeRequest {
  userId: string;
  stakes: Array<{
    poolId: string;
    amount: string;
    lockupPeriod?: number;
  }>;
  network: BlockchainNetwork;
}

export interface BatchOperationResponse<T> {
  batchId: string;
  operations: Array<{
    operationId: string;
    status: 'pending' | 'success' | 'failed';
    result?: T;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
  };
  estimatedCompletion: Date;
  createdAt: Date;
}

// Multi-signature types
export interface MultiSigWallet {
  walletId: string;
  network: BlockchainNetwork;
  address: string;
  owners: string[];
  threshold: number;
  nonce: number;
  balance: string;
  tokenBalances: TokenBalance[];
  pendingTransactions: MultiSigTransaction[];
  createdAt: Date;
}

export interface MultiSigTransaction {
  transactionId: string;
  walletId: string;
  to: string;
  value: string;
  data: string;
  operation: 'call' | 'delegatecall';
  safeTxGas: string;
  baseGas: string;
  gasPrice: string;
  gasToken: string;
  refundReceiver: string;
  nonce: number;
  signatures: Array<{
    signer: string;
    signature: string;
    signedAt: Date;
  }>;
  status: 'pending' | 'executed' | 'cancelled';
  confirmationsRequired: number;
  confirmationsReceived: number;
  createdBy: string;
  createdAt: Date;
  executedAt?: Date;
  transactionHash?: string;
}

// Export all types
export type {
  // Re-export imported types for convenience
  SolanaWallet as SolanaWalletDetailed,
  EthereumWallet as EthereumWalletDetailed,
  SolanaTransaction as SolanaTransactionDetailed,
  EthereumTransaction as EthereumTransactionDetailed,
  StakingInfo,
  GovernanceProposalEth,
  PriceFeedData,
  VRFRequest as ChainlinkVRFRequest,
  ChainlinkFunctionRequest,
  ExternalDataFeed
} from '../blockchain/solana-integration';

// Default configurations
export const defaultBlockchainServiceConfig: BlockchainServiceConfig = {
  networks: {
    solana: {
      enabled: true,
      rpcEndpoint: process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
      wsEndpoint: process.env.SOLANA_WS_ENDPOINT || 'wss://api.mainnet-beta.solana.com',
      commitment: 'confirmed'
    },
    ethereum: {
      enabled: true,
      rpcEndpoint: process.env.ETHEREUM_RPC_ENDPOINT || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
      wsEndpoint: process.env.ETHEREUM_WS_ENDPOINT || 'wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID',
      chainId: 1
    },
    polygon: {
      enabled: false,
      rpcEndpoint: process.env.POLYGON_RPC_ENDPOINT || 'https://polygon-rpc.com',
      chainId: 137
    },
    arbitrum: {
      enabled: false,
      rpcEndpoint: process.env.ARBITRUM_RPC_ENDPOINT || 'https://arb1.arbitrum.io/rpc',
      chainId: 42161
    },
    optimism: {
      enabled: false,
      rpcEndpoint: process.env.OPTIMISM_RPC_ENDPOINT || 'https://mainnet.optimism.io',
      chainId: 10
    }
  },
  oracles: {
    chainlink: {
      enabled: true,
      networks: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
      priceFeeds: {
        'ETH/USD': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
        'BTC/USD': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
        'USDC/USD': '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6'
      },
      vrfEnabled: true,
      functionsEnabled: true
    },
    pyth: {
      enabled: false,
      networks: ['solana'],
      priceFeeds: {}
    }
  },
  crossChain: {
    enabled: true,
    bridges: ['wormhole', 'allbridge', 'portal'],
    defaultBridge: 'wormhole',
    maxSlippage: 0.5
  },
  security: {
    riskAssessmentEnabled: true,
    transactionMonitoring: true,
    suspiciousActivityThreshold: 0.8,
    autoBlockSuspiciousTransactions: false
  },
  caching: {
    enabled: true,
    ttl: 300, // 5 minutes
    maxSize: 1000
  },
  monitoring: {
    healthCheckInterval: 60, // 1 minute
    alertThresholds: {
      latency: 5000, // 5 seconds
      errorRate: 0.05, // 5%
      gasPrice: 100 // 100 gwei
    }
  }
};