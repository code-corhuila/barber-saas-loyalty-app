import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { userMessage } from '../shell-context';
import { PAGE_STYLES } from '../ui/styles';
import { LoyaltyApi } from './loyalty-api';
import { formatDate, progress } from './rules';
import type { LoyaltyCard, LoyaltyTransaction } from './types';

/**
 * Staff: one card, its history, a manual sticker (FR-013) and the redemption (FR-014/015). The API
 * refuses a redemption without enough stickers (422) and the screen shows its message.
 */
@Component({
  selector: 'lo-card-detail-page',
  imports: [RouterLink, IonButton, IonSpinner],
  template: `
    <section class="page">
      <a class="back" routerLink="/loyalty/cards">‹ Tarjetas</a>
      @if (card(); as c) {
        <h1>{{ progressOf(c).text }}</h1>
        <p class="sub">Cliente {{ c.clientId }}</p>
        <div class="card">
          @if (c.rewardDescription) { <p>Premio: {{ c.rewardDescription }}</p> }
          <p class="muted">Premios reclamados: {{ c.totalRewardsRedeemed }}</p>
          <div class="actions">
            <ion-button [disabled]="busy()" (click)="sticker(c)">Dar sello</ion-button>
            <ion-button fill="outline" [disabled]="busy() || !c.canRedeem" (click)="redeem(c)">Canjear premio</ion-button>
          </div>
          @if (notice()) { <p class="gold" role="status">{{ notice() }}</p> }
          @if (actionError()) { <p class="error" role="alert">{{ actionError() }}</p> }
        </div>
        <h2>Historial</h2>
        @for (t of history(); track t.id) {
          <div class="card">
            <div class="row">
              <p>{{ t.type === 'STICKER_EARNED' ? 'Sello' : 'Premio canjeado' }}{{ t.appointmentId ? ' · por una cita' : '' }}</p>
              <p class="muted">{{ date(t.createdAt) }}</p>
            </div>
          </div>
        } @empty { <p class="center">Sin movimientos.</p> }
      } @else if (loadError()) {
        <div class="center"><p class="error">{{ loadError() }}</p><ion-button (click)="load()">Intentar de nuevo</ion-button></div>
      } @else {
        <div class="center"><ion-spinner aria-label="Cargando" /></div>
      }
    </section>
  `,
  styles: PAGE_STYLES,
})
export class CardDetailPageComponent implements OnInit {
  private readonly api = inject(LoyaltyApi);
  readonly id = input.required<string>();
  readonly progressOf = progress;
  readonly date = formatDate;
  readonly card = signal<LoyaltyCard | null>(null);
  readonly history = signal<LoyaltyTransaction[]>([]);
  readonly loadError = signal('');
  readonly busy = signal(false);
  readonly notice = signal('');
  readonly actionError = signal('');
  /** One key per action: a retried tap never credits or redeems twice (DEC-LOY-01). */
  private stickerKey = crypto.randomUUID();
  private redeemKey = crypto.randomUUID();

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loadError.set('');
    try {
      const [card, page] = await Promise.all([this.api.getCard(this.id()), this.api.transactions(this.id())]);
      this.card.set(card);
      this.history.set(page.data);
    } catch (err) {
      this.loadError.set(userMessage(err));
    }
  }

  async sticker(c: LoyaltyCard): Promise<void> {
    await this.act(async () => {
      const result = await this.api.grantSticker(c.clientId, this.stickerKey);
      this.stickerKey = crypto.randomUUID();
      this.card.set(result.card);
      this.history.update((h) => [result.transaction, ...h]);
      this.notice.set('Sello agregado.');
    });
  }

  async redeem(c: LoyaltyCard): Promise<void> {
    await this.act(async () => {
      const result = await this.api.redeem(c.clientId, this.redeemKey);
      this.redeemKey = crypto.randomUUID();
      this.card.set(result.card);
      this.history.update((h) => [result.transaction, ...h]);
      this.notice.set('Premio canjeado: el cliente tiene un cupón disponible.');
    });
  }

  private async act(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.notice.set('');
    this.actionError.set('');
    try {
      await action();
    } catch (err) {
      this.actionError.set(userMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}
