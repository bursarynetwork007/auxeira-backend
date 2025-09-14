// User management type definitions for Auxeira SSE Platform

export type UserRole = 'student' | 'founder' | 'investor' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  subscriptionTier: SubscriptionTier;

  // Profile information
  profilePicture?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  location?: {
    country: string;
    city: string;
    timezone: string;
  };

  // Organization association
  organizationId?: string;
  organizationRole?: string;

  // Account settings
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  language: string;
  timezone: string;

  // Preferences
  preferences: UserPreferences;

  // Security
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  loginAttempts: number;
  lockedUntil?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UserPreferences {
  // Notification preferences
  notifications: {
    email: {
      scoreUpdates: boolean;
      mentorshipMessages: boolean;
      partnershipRequests: boolean;
      systemUpdates: boolean;
      marketing: boolean;
    };
    push: {
      scoreUpdates: boolean;
      mentorshipMessages: boolean;
      partnershipRequests: boolean;
      realTimeAlerts: boolean;
    };
    sms: {
      securityAlerts: boolean;
      criticalUpdates: boolean;
    };
  };

  // Dashboard preferences
  dashboard: {
    defaultView: 'overview' | 'detailed' | 'analytics';
    chartType: 'line' | 'bar' | 'pie';
    timeRange: '7d' | '30d' | '90d' | '1y';
    showBenchmarks: boolean;
    showPredictions: boolean;
  };

  // Privacy settings
  privacy: {
    profileVisibility: 'public' | 'organization' | 'private';
    scoreVisibility: 'public' | 'organization' | 'private';
    allowPartnershipRequests: boolean;
    allowMentorshipRequests: boolean;
    dataProcessingConsent: boolean;
    analyticsConsent: boolean;
  };

  // AI preferences
  ai: {
    mentorshipEnabled: boolean;
    mentorshipFrequency: 'daily' | 'weekly' | 'monthly';
    mentorshipStyle: 'supportive' | 'challenging' | 'analytical';
    autoSuggestions: boolean;
    personalizedInsights: boolean;
  };
}

export interface UserProfile {
  // Basic information
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;

  // Professional information
  title?: string;
  company?: string;
  industry?: string;
  experience?: string;
  skills?: string[];
  interests?: string[];

  // Social links
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    github?: string;
  };

  // Bio and description
  bio?: string;
  description?: string;

  // Goals and objectives
  goals?: string[];
  objectives?: string[];
  focusAreas?: string[];
}

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  refreshToken: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    device: string;
    os: string;
    browser: string;
    location?: string;
  };
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface UserPermission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: UserPermission[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  preferences?: Partial<UserPreferences>;
  profile?: Partial<UserProfile>;
}

export interface UserSearchFilters {
  role?: UserRole[];
  status?: UserStatus[];
  subscriptionTier?: SubscriptionTier[];
  organizationId?: string;
  emailVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastActiveAfter?: Date;
  lastActiveBefore?: Date;
  search?: string; // Search in name, email
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
