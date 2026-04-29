// types/referral.ts

export type Platform = 'YOUTUBE' | 'INSTAGRAM' | 'TELEGRAM' | 'DISCORD' | 'OTHER';

export type CommissionModel = 'PER_FIRST_MATCH' | 'PERCENT_REVENUE' | 'HYBRID';

export type PayoutMethod = 'UPI' | 'BANK' | 'CASH';

export interface ReferralCode {
  _id: string;
  code: string;
  creatorName: string;
  channelName: string | null;
  platform: Platform;
  channelUrl: string | null;
  createdBy: string | null;
  isActive: boolean;
  commissionModel: CommissionModel;
  commissionPerUser: number;
  commissionPercent: number;
  rewardCoinsToUser: number;
  rewardCashToUser: number;
  totalClicks: number;
  totalSignups: number;
  totalVerifiedUsers: number;
  totalFirstMatches: number;
  totalMatchesPlayed: number;
  totalRevenue: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  pendingCommission: number;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // enriched fields from API
  ctr?: string;
  signupRate?: string;
  avgRevenuePerUser?: string;
}

export interface ReferralSummary {
  totalCodes: number;
  activeCodes: number;
  totalClicks: number;
  totalSignups: number;
  totalRevenue: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  totalPendingCommission: number;
  conversionRate: string;
}

export interface ReferralListResponse {
  message: string;
  summary: ReferralSummary;
  codes: ReferralCode[];
  pagination: {
    page: number;
    limit: number;
    totalCodes: number;
    totalPages: number;
  };
}

export interface ReferredUser {
  _id: string;
  username: string;
  email: string;
  upiId?: string;
  referredAt?: string;
  firstMatchPlayedAt?: string;
  isReferralRewardGiven?: boolean;
  fraudFlags?: string[];
  createdAt: string;
}

export interface ClickTrendItem {
  _id: string; // date string YYYY-MM-DD
  clicks: number;
}

export interface CreatorPayout {
  _id: string;
  referralCodeId: string;
  code: string;
  creatorName: string;
  amount: number;
  method: PayoutMethod;
  transactionRef: string | null;
  notes: string | null;
  paidBy: string;
  paidAt: string;
  createdAt: string;
}

export interface ReferralDetailAnalytics {
  clickToSignupRate: string;
  signupToFirstMatchRate: string;
  avgRevenuePerUser: string;
  avgCommissionPerUser: string;
}

export interface ReferralDetailResponse {
  message: string;
  referral: ReferralCode;
  referredUsers: ReferredUser[];
  payouts: CreatorPayout[];
  clickTrend: ClickTrendItem[];
  analytics: ReferralDetailAnalytics;
}

export interface QrResponse {
  message: string;
  link: string;
  qrCode: string; // base64 data URI
}

export interface CreateReferralPayload {
  code: string;
  creatorName: string;
  channelName?: string;
  platform: Platform;
  channelUrl?: string;
  commissionModel: CommissionModel;
  commissionPerUser?: number;
  commissionPercent?: number;
  rewardCoinsToUser?: number;
  rewardCashToUser?: number;
  expiresAt?: string | null;
  notes?: string;
}

export interface UpdateReferralPayload {
  creatorName?: string;
  channelName?: string;
  platform?: Platform;
  channelUrl?: string;
  commissionModel?: CommissionModel;
  commissionPerUser?: number;
  commissionPercent?: number;
  rewardCoinsToUser?: number;
  rewardCashToUser?: number;
  expiresAt?: string | null;
  notes?: string;
}

export interface MarkPaidPayload {
  amount: number;
  method: PayoutMethod;
  transactionRef?: string;
  notes?: string;
}

export type ReferralFilterStatus = 'all' | 'active' | 'inactive';
export type ReferralFilterPlatform = 'all' | Platform;
export type ReferralSortBy = 'revenue' | 'signups' | 'commission' | 'newest' | 'conversion';
