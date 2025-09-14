/**
 * Gamification & Rewards System Type Definitions
 * Comprehensive types for the behavioral gamification and AUX token economy
 */

export interface UserProfile {
  id: string;
  userId: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  totalExperience: number;
  auxTokenBalance: number;
  auxTokensEarned: number;
  auxTokensSpent: number;
  streak: UserStreak;
  achievements: Achievement[];
  badges: Badge[];
  rank: UserRank;
  stats: UserStats;
  preferences: GamificationPreferences;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserStreak {
  current: number;
  longest: number;
  lastActivityDate: Date;
  streakType: StreakType;
  multiplier: number;
  isActive: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  type: AchievementType;
  criteria: AchievementCriteria;
  rewards: AchievementReward;
  rarity: AchievementRarity;
  iconUrl?: string;
  isActive: boolean;
  isSecret: boolean;
  unlockedAt?: Date;
  progress?: AchievementProgress;
}

export interface AchievementCriteria {
  type: 'count' | 'threshold' | 'streak' | 'percentage' | 'time_based' | 'composite';
  target: number;
  metric: string;
  timeframe?: string; // e.g., 'daily', 'weekly', 'monthly', 'all_time'
  conditions?: {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
  }[];
  dependencies?: string[]; // Other achievement IDs that must be completed first
}

export interface AchievementReward {
  experience: number;
  auxTokens: number;
  badge?: string;
  title?: string;
  specialPerks?: string[];
  partnershipBenefits?: string[];
}

export interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
  lastUpdated: Date;
  milestones?: {
    value: number;
    reached: boolean;
    reachedAt?: Date;
  }[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  iconUrl?: string;
  color: string;
  rarity: BadgeRarity;
  earnedAt: Date;
  displayOrder: number;
  isVisible: boolean;
}

export interface UserRank {
  current: RankTier;
  points: number;
  pointsToNextRank: number;
  percentileRank: number;
  globalRank: number;
  categoryRanks: {
    category: string;
    rank: number;
    percentile: number;
  }[];
  seasonalRank?: {
    season: string;
    rank: number;
    points: number;
  };
}

export interface UserStats {
  totalLogins: number;
  consecutiveLogins: number;
  sseScoreImprovements: number;
  partnershipApplications: number;
  partnershipApprovals: number;
  benefitsRedeemed: number;
  mentorshipSessions: number;
  documentsGenerated: number;
  reportsCreated: number;
  networkConnections: number;
  referralsSuccessful: number;
  communityContributions: number;
  lastActivityAt: Date;
  weeklyActivity: number[];
  monthlyActivity: number[];
}

export interface GamificationPreferences {
  enableNotifications: boolean;
  enableLeaderboards: boolean;
  enableAchievementAlerts: boolean;
  enableStreakReminders: boolean;
  enableTokenEarningAlerts: boolean;
  preferredChallenges: ChallengeType[];
  privacyLevel: 'public' | 'friends' | 'private';
  displayBadges: boolean;
  displayRank: boolean;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  duration: ChallengeDuration;
  startDate: Date;
  endDate: Date;
  criteria: ChallengeCriteria;
  rewards: ChallengeReward;
  participants: ChallengeParticipant[];
  maxParticipants?: number;
  isActive: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface ChallengeCriteria {
  objectives: ChallengeObjective[];
  minimumRequirements?: {
    sseScore?: number;
    level?: number;
    tier?: string;
  };
  exclusions?: string[];
}

export interface ChallengeObjective {
  id: string;
  description: string;
  metric: string;
  target: number;
  weight: number; // For scoring
  isRequired: boolean;
}

export interface ChallengeReward {
  experience: number;
  auxTokens: number;
  badges?: string[];
  specialPerks?: string[];
  leaderboardPositions?: {
    position: number;
    reward: {
      experience: number;
      auxTokens: number;
      specialRewards?: string[];
    };
  }[];
}

export interface ChallengeParticipant {
  userId: string;
  joinedAt: Date;
  progress: ChallengeProgress;
  rank?: number;
  isCompleted: boolean;
  completedAt?: Date;
  rewards?: ChallengeReward;
}

export interface ChallengeProgress {
  objectives: {
    objectiveId: string;
    current: number;
    target: number;
    completed: boolean;
  }[];
  overallProgress: number;
  score: number;
  lastUpdated: Date;
}

export interface AUXToken {
  id: string;
  userId: string;
  transactionType: TokenTransactionType;
  amount: number;
  balance: number;
  source: TokenSource;
  sourceId?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface TokenEarningRule {
  id: string;
  name: string;
  description: string;
  action: TokenAction;
  baseAmount: number;
  multipliers: TokenMultiplier[];
  conditions?: TokenCondition[];
  cooldown?: number; // in minutes
  dailyLimit?: number;
  weeklyLimit?: number;
  monthlyLimit?: number;
  isActive: boolean;
  validFrom: Date;
  validUntil?: Date;
}

export interface TokenMultiplier {
  type: MultiplierType;
  condition: string;
  multiplier: number;
  description: string;
}

export interface TokenCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: any;
  description: string;
}

export interface TokenRedemption {
  id: string;
  userId: string;
  rewardId: string;
  tokensSpent: number;
  status: RedemptionStatus;
  redemptionCode?: string;
  redeemedAt: Date;
  processedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface TokenReward {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  cost: number;
  type: RewardType;
  value: RewardValue;
  availability: RewardAvailability;
  requirements?: RewardRequirement[];
  imageUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RewardValue {
  type: 'discount' | 'credit' | 'service' | 'physical' | 'digital' | 'experience';
  amount?: number;
  currency?: string;
  description: string;
  estimatedValue?: number;
}

export interface RewardAvailability {
  totalQuantity?: number;
  remainingQuantity?: number;
  userLimit?: number;
  validFrom: Date;
  validUntil?: Date;
  regions?: string[];
  tiers?: string[];
}

export interface RewardRequirement {
  type: 'level' | 'achievement' | 'badge' | 'sse_score' | 'tier' | 'custom';
  value: any;
  description: string;
}

export interface Leaderboard {
  id: string;
  name: string;
  description: string;
  type: LeaderboardType;
  category: LeaderboardCategory;
  timeframe: LeaderboardTimeframe;
  metric: string;
  entries: LeaderboardEntry[];
  lastUpdated: Date;
  isActive: boolean;
  rewards?: LeaderboardReward[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  change: number; // Change from previous period
  badges?: string[];
  tier?: string;
}

export interface LeaderboardReward {
  rankRange: {
    from: number;
    to: number;
  };
  reward: {
    experience: number;
    auxTokens: number;
    badges?: string[];
    specialPerks?: string[];
  };
}

export interface GamificationEvent {
  id: string;
  userId: string;
  eventType: GamificationEventType;
  action: string;
  points: number;
  auxTokens: number;
  metadata?: Record<string, any>;
  triggeredBy?: string;
  processedAt: Date;
  createdAt: Date;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  theme: string;
  startDate: Date;
  endDate: Date;
  bonusMultiplier: number;
  specialChallenges: string[];
  exclusiveRewards: string[];
  leaderboardId?: string;
  isActive: boolean;
  imageUrl?: string;
}

export interface UserEngagementMetrics {
  userId: string;
  period: string; // YYYY-MM format
  loginDays: number;
  totalSessions: number;
  averageSessionDuration: number;
  actionsCompleted: number;
  experienceGained: number;
  auxTokensEarned: number;
  achievementsUnlocked: number;
  challengesCompleted: number;
  socialInteractions: number;
  engagementScore: number;
  retentionRisk: 'low' | 'medium' | 'high';
}

// Enums and Union Types
export type StreakType =
  | 'login'
  | 'sse_improvement'
  | 'partnership_activity'
  | 'mentorship_engagement'
  | 'community_participation';

export type AchievementCategory =
  | 'onboarding'
  | 'sse_performance'
  | 'partnerships'
  | 'mentorship'
  | 'community'
  | 'learning'
  | 'networking'
  | 'milestones'
  | 'special_events';

export type AchievementType =
  | 'progress'
  | 'milestone'
  | 'streak'
  | 'social'
  | 'rare'
  | 'seasonal';

export type AchievementRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

export type BadgeCategory =
  | 'achievement'
  | 'milestone'
  | 'special_event'
  | 'community'
  | 'partnership'
  | 'leadership';

export type BadgeRarity =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond';

export type RankTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master'
  | 'grandmaster';

export type ChallengeType =
  | 'individual'
  | 'team'
  | 'community'
  | 'seasonal';

export type ChallengeCategory =
  | 'sse_improvement'
  | 'partnership_engagement'
  | 'mentorship_activity'
  | 'community_building'
  | 'learning_goals'
  | 'networking';

export type ChallengeDifficulty =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'expert';

export type ChallengeDuration =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'custom';

export type TokenTransactionType =
  | 'earned'
  | 'spent'
  | 'bonus'
  | 'refund'
  | 'expired'
  | 'transferred';

export type TokenSource =
  | 'achievement'
  | 'challenge'
  | 'daily_login'
  | 'sse_improvement'
  | 'partnership_activity'
  | 'mentorship_session'
  | 'referral'
  | 'community_contribution'
  | 'special_event'
  | 'admin_grant';

export type TokenAction =
  | 'login'
  | 'sse_score_update'
  | 'partnership_application'
  | 'partnership_approval'
  | 'benefit_redemption'
  | 'mentorship_session'
  | 'document_generation'
  | 'report_creation'
  | 'referral_success'
  | 'community_post'
  | 'achievement_unlock'
  | 'challenge_completion';

export type MultiplierType =
  | 'streak'
  | 'tier'
  | 'sse_score'
  | 'seasonal'
  | 'special_event'
  | 'first_time';

export type RedemptionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled';

export type RewardCategory =
  | 'platform_benefits'
  | 'partner_discounts'
  | 'exclusive_access'
  | 'physical_goods'
  | 'digital_content'
  | 'experiences'
  | 'consultations';

export type RewardType =
  | 'instant'
  | 'scheduled'
  | 'manual_fulfillment'
  | 'partner_integration';

export type LeaderboardType =
  | 'global'
  | 'regional'
  | 'industry'
  | 'tier'
  | 'challenge_specific';

export type LeaderboardCategory =
  | 'overall_score'
  | 'sse_performance'
  | 'partnership_success'
  | 'mentorship_engagement'
  | 'community_contribution'
  | 'token_earnings';

export type LeaderboardTimeframe =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'all_time';

export type GamificationEventType =
  | 'experience_gained'
  | 'level_up'
  | 'achievement_unlocked'
  | 'badge_earned'
  | 'tokens_earned'
  | 'tokens_spent'
  | 'streak_milestone'
  | 'challenge_joined'
  | 'challenge_completed'
  | 'rank_changed';

// Request/Response Interfaces
export interface GetUserProfileRequest {
  includeAchievements?: boolean;
  includeBadges?: boolean;
  includeStats?: boolean;
  includeLeaderboardRank?: boolean;
}

export interface UpdateUserPreferencesRequest {
  enableNotifications?: boolean;
  enableLeaderboards?: boolean;
  enableAchievementAlerts?: boolean;
  enableStreakReminders?: boolean;
  enableTokenEarningAlerts?: boolean;
  preferredChallenges?: ChallengeType[];
  privacyLevel?: 'public' | 'friends' | 'private';
  displayBadges?: boolean;
  displayRank?: boolean;
}

export interface CreateChallengeRequest {
  name: string;
  description: string;
  type: ChallengeType;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  duration: ChallengeDuration;
  startDate: Date;
  endDate: Date;
  criteria: ChallengeCriteria;
  rewards: ChallengeReward;
  maxParticipants?: number;
  isPublic: boolean;
}

export interface JoinChallengeRequest {
  challengeId: string;
}

export interface RedeemTokensRequest {
  rewardId: string;
  quantity?: number;
}

export interface GetLeaderboardRequest {
  type?: LeaderboardType;
  category?: LeaderboardCategory;
  timeframe?: LeaderboardTimeframe;
  limit?: number;
  offset?: number;
}

export interface GetChallengesRequest {
  type?: ChallengeType;
  category?: ChallengeCategory;
  difficulty?: ChallengeDifficulty;
  status?: 'active' | 'upcoming' | 'completed';
  limit?: number;
  offset?: number;
}

export interface GetTokenHistoryRequest {
  transactionType?: TokenTransactionType;
  source?: TokenSource;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface UserProfileResponse {
  profile: UserProfile;
  recentAchievements: Achievement[];
  availableChallenges: Challenge[];
  leaderboardRank?: LeaderboardEntry;
  tokenEarningOpportunities: TokenEarningRule[];
}

export interface GamificationDashboardResponse {
  profile: UserProfile;
  recentActivity: GamificationEvent[];
  activeChallenges: Challenge[];
  availableRewards: TokenReward[];
  leaderboards: Leaderboard[];
  seasonalEvent?: SeasonalEvent;
}

// Database Schema Interfaces
export interface UserProfileDB {
  id: string;
  user_id: string;
  level: number;
  experience: number;
  total_experience: number;
  aux_token_balance: number;
  aux_tokens_earned: number;
  aux_tokens_spent: number;
  streak_data: string; // JSON string
  rank_data: string; // JSON string
  stats_data: string; // JSON string
  preferences: string; // JSON string
  created_at: Date;
  updated_at?: Date;
}

export interface AchievementDB {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  type: AchievementType;
  criteria: string; // JSON string
  rewards: string; // JSON string
  rarity: AchievementRarity;
  icon_url?: string;
  is_active: boolean;
  is_secret: boolean;
  created_at: Date;
}

export interface UserAchievementDB {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: Date;
  progress_data?: string; // JSON string
}

export interface ChallengeDB {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  duration: ChallengeDuration;
  start_date: Date;
  end_date: Date;
  criteria: string; // JSON string
  rewards: string; // JSON string
  max_participants?: number;
  is_active: boolean;
  is_public: boolean;
  created_by: string;
  created_at: Date;
}

export interface AUXTokenDB {
  id: string;
  user_id: string;
  transaction_type: TokenTransactionType;
  amount: number;
  balance: number;
  source: TokenSource;
  source_id?: string;
  description: string;
  metadata?: string; // JSON string
  created_at: Date;
  expires_at?: Date;
}
