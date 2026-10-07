import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { type Http, LoyaltyCalls } from './loyalty-calls';
import { missing, progress, validateConfig } from './rules';

function fakeHttp() {
  const http = { get: vi.fn(() => of({})), post: vi.fn(() => of({})), put: vi.fn(() => of({})) };
  return { http, calls: new LoyaltyCalls(http as unknown as Http) };
}

const options = (call: unknown[], i = 1) => call[i] as { params?: Record<string, unknown>; headers?: Record<string, string> };

describe('loyalty calls', () => {
  it('reads the rule, my card and my coupons through the relative /api path the shell completes', async () => {
    const { http, calls } = fakeHttp();
    await calls.config();
    await calls.myCard();
    await calls.coupons('ACTIVE');
    expect(http.get.mock.calls.map((c) => c[0])).toEqual(['/api/v1/loyalty/config', '/api/v1/loyalty/cards/me',
      '/api/v1/loyalty/coupons']);
    expect(options(http.get.mock.calls[2]!).params).toEqual({ limit: 50, status: 'ACTIVE' });
  });

  it('grants and redeems with the Idempotency-Key and only the client in the body', async () => {
    const { http, calls } = fakeHttp();
    await calls.grantSticker('c1', 'key-1');
    await calls.redeem('c1', 'key-2');
    expect(http.post.mock.calls[0]![0]).toBe('/api/v1/loyalty/stickers');
    expect(http.post.mock.calls[0]![1]).toEqual({ clientId: 'c1' });
    expect(options(http.post.mock.calls[0]!, 2).headers).toEqual({ 'Idempotency-Key': 'key-1' });
    expect(http.post.mock.calls[1]![0]).toBe('/api/v1/loyalty/redemptions');
  });

  it('lists the cards that can redeem only when asked and a card history', async () => {
    const { http, calls } = fakeHttp();
    await calls.listCards(null);
    await calls.listCards(true);
    await calls.transactions('card/1');
    await calls.setConfig({ stickersRequired: 8, rewardDescription: 'Corte gratis', isActive: true });
    expect(options(http.get.mock.calls[0]!).params).toEqual({ page: 1, limit: 50 });
    expect(options(http.get.mock.calls[1]!).params).toEqual({ page: 1, limit: 50, canRedeem: true });
    expect(http.get.mock.calls[2]![0]).toBe('/api/v1/loyalty/cards/card%2F1/transactions');
    expect(http.put).toHaveBeenCalledWith('/api/v1/loyalty/config', { stickersRequired: 8, rewardDescription: 'Corte gratis', isActive: true });
  });
});

describe('loyalty rules', () => {
  it('says how full the card is and what is left', () => {
    expect(progress({ stickersCount: 6, stickersRequired: 8 })).toEqual({ text: '6 de 8 sellos', percent: 75 });
    expect(progress({ stickersCount: 9, stickersRequired: 8 }).percent).toBe(100);
    expect(progress({ stickersCount: 1, stickersRequired: null })).toEqual({ text: '1 sello', percent: 0 });
    expect(missing({ stickersCount: 7, stickersRequired: 8, canRedeem: false })).toBe('Te falta 1 sello para el premio.');
    expect(missing({ stickersCount: 8, stickersRequired: 8, canRedeem: true })).toContain('reclamar');
    expect(missing({ stickersCount: 2, stickersRequired: null, canRedeem: false })).toContain('no tiene el programa');
  });

  it('validates the program form', () => {
    expect(validateConfig({ stickers: '8', reward: ' Corte gratis ', active: true }).request)
      .toEqual({ stickersRequired: 8, rewardDescription: 'Corte gratis', isActive: true });
    expect(Object.keys(validateConfig({ stickers: '0', reward: '', active: true }).errors).sort()).toEqual(['reward', 'stickers']);
  });
});
