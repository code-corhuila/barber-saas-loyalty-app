/** Types of `loyalty-service.yaml` 1.3.0 (`barber-saas-docs`). */

export interface Page<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface RewardsConfig {
  id: string;
  stickersRequired: number;
  rewardDescription: string;
  isActive: boolean;
}

export interface RewardsConfigRequest {
  stickersRequired: number;
  rewardDescription: string;
  isActive: boolean;
}

/** stickersRequired and rewardDescription are null, and canRedeem false, without an active program. */
export interface LoyaltyCard {
  id: string;
  clientId: string;
  stickersCount: number;
  totalRewardsRedeemed: number;
  lastUpdated: string;
  stickersRequired: number | null;
  canRedeem: boolean;
  rewardDescription: string | null;
}

export type TransactionType = 'STICKER_EARNED' | 'REWARD_REDEEMED';

export interface LoyaltyTransaction {
  id: string;
  loyaltyCardId: string;
  appointmentId: string | null;
  type: TransactionType;
  grantedByUserId: string;
  createdAt: string;
}

export type CouponStatus = 'ACTIVE' | 'USED';

export interface RewardCoupon {
  id: string;
  clientId: string;
  status: CouponStatus;
  appointmentId: string | null;
  createdAt: string;
  usedAt: string | null;
}

export interface StickerResult {
  transaction: LoyaltyTransaction;
  card: LoyaltyCard;
}

export interface RedemptionResult {
  transaction: LoyaltyTransaction;
  card: LoyaltyCard;
  coupon: RewardCoupon;
}
