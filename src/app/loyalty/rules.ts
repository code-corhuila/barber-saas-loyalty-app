import type { LoyaltyCard, RewardsConfigRequest } from './types';

/** "6 de 8 sellos" and how full the card is, 0 to 100; without an active program only the count. */
export function progress(card: Pick<LoyaltyCard, 'stickersCount' | 'stickersRequired'>): { text: string; percent: number } {
  const n = card.stickersCount;
  const unit = n === 1 ? 'sello' : 'sellos';
  if (!card.stickersRequired) return { text: `${n} ${unit}`, percent: 0 };
  return { text: `${n} de ${card.stickersRequired} sellos`,
    percent: Math.min(100, Math.round((n / card.stickersRequired) * 100)) };
}

/** What is left to the reward, said to a person. */
export function missing(card: Pick<LoyaltyCard, 'stickersCount' | 'stickersRequired' | 'canRedeem'>): string {
  if (!card.stickersRequired) return 'La barbería no tiene el programa activo.';
  if (card.canRedeem) return '¡Ya puedes reclamar tu premio! Pídelo en la barbería.';
  const left = card.stickersRequired - card.stickersCount;
  return left === 1 ? 'Te falta 1 sello para el premio.' : `Te faltan ${left} sellos para el premio.`;
}

/** "2026-10-07T14:00:00Z" → "7 oct 2026", in the phone's time zone. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export interface ConfigForm {
  stickers: string;
  reward: string;
  active: boolean;
}

/** The program form against the contract's limits; an error per field, or the request to send. */
export function validateConfig(form: ConfigForm):
    { errors: Partial<Record<'stickers' | 'reward', string>>; request: RewardsConfigRequest | null } {
  const errors: Partial<Record<'stickers' | 'reward', string>> = {};
  const stickersRequired = Number(form.stickers.trim());
  if (!/^\d{1,4}$/.test(form.stickers.trim()) || stickersRequired < 1) errors.stickers = 'Mínimo 1 sello.';
  const rewardDescription = form.reward.trim();
  if (!rewardDescription) errors.reward = 'Escribe el premio.';
  else if (rewardDescription.length > 255) errors.reward = 'Máximo 255 caracteres.';
  const ok = Object.keys(errors).length === 0;
  return { errors, request: ok ? { stickersRequired, rewardDescription, isActive: form.active } : null };
}
