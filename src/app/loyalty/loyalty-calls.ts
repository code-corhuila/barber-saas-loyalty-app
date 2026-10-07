import { Observable, firstValueFrom } from 'rxjs';
import type {
  CouponStatus, LoyaltyCard, LoyaltyTransaction, Page, RedemptionResult, RewardCoupon, RewardsConfig,
  RewardsConfigRequest, StickerResult,
} from './types';

/** The part of HttpClient this app uses: plain params and headers, so the calls test without Angular. */
export interface Http {
  get<T>(url: string, options?: { params?: Record<string, string | number | boolean> }): Observable<T>;
  post<T>(url: string, body: unknown, options?: { headers?: Record<string, string> }): Observable<T>;
  put<T>(url: string, body: unknown): Observable<T>;
}

const BASE = '/api/v1/loyalty';
const id = (value: string) => encodeURIComponent(value);

/**
 * The calls of `loyalty-service.yaml`. Relative '/api/...' URLs: the shell's interceptor adds the
 * gateway, the token and X-Correlation-Id. The barbershop is the token's: a client enters it first.
 */
export class LoyaltyCalls {
  constructor(private readonly http: Http) {}

  /** 404 while the barbershop has not configured its program. */
  config(): Promise<RewardsConfig> {
    return firstValueFrom(this.http.get<RewardsConfig>(`${BASE}/config`));
  }

  setConfig(request: RewardsConfigRequest): Promise<RewardsConfig> {
    return firstValueFrom(this.http.put<RewardsConfig>(`${BASE}/config`, request));
  }

  /** A client's card at the barbershop entered; 404 before the first sticker. */
  myCard(): Promise<LoyaltyCard> {
    return firstValueFrom(this.http.get<LoyaltyCard>(`${BASE}/cards/me`));
  }

  /** Staff: the barbershop's cards, last updated first; only those that can redeem when asked. */
  listCards(canRedeem: boolean | null, page = 1): Promise<Page<LoyaltyCard>> {
    const params: Record<string, string | number | boolean> = { page, limit: 50, ...(canRedeem ? { canRedeem } : {}) };
    return firstValueFrom(this.http.get<Page<LoyaltyCard>>(`${BASE}/cards`, { params }));
  }

  getCard(cardId: string): Promise<LoyaltyCard> {
    return firstValueFrom(this.http.get<LoyaltyCard>(`${BASE}/cards/${id(cardId)}`));
  }

  transactions(cardId: string): Promise<Page<LoyaltyTransaction>> {
    return firstValueFrom(this.http.get<Page<LoyaltyTransaction>>(`${BASE}/cards/${id(cardId)}/transactions`, {
      params: { limit: 50 },
    }));
  }

  /** A retried grant with the same key does not credit twice (DEC-LOY-01). */
  grantSticker(clientId: string, idempotencyKey: string): Promise<StickerResult> {
    return firstValueFrom(this.http.post<StickerResult>(`${BASE}/stickers`, { clientId }, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }));
  }

  /** 422 without enough stickers or without an active program; the shell's message says which. */
  redeem(clientId: string, idempotencyKey: string): Promise<RedemptionResult> {
    return firstValueFrom(this.http.post<RedemptionResult>(`${BASE}/redemptions`, { clientId }, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }));
  }

  /** A client gets only theirs; staff may narrow to one client. */
  coupons(status: CouponStatus | null, clientId: string | null = null): Promise<Page<RewardCoupon>> {
    const params: Record<string, string | number> = { limit: 50, ...(status ? { status } : {}),
      ...(clientId ? { clientId } : {}) };
    return firstValueFrom(this.http.get<Page<RewardCoupon>>(`${BASE}/coupons`, { params }));
  }
}
