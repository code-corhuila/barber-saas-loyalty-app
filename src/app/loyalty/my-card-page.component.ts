import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { type ApiError, shellContext } from '../shell-context';
import { loader } from '../ui/load';
import { PAGE_STYLES } from '../ui/styles';
import { LoyaltyApi } from './loyalty-api';
import { formatDate, missing, progress } from './rules';
import type { LoyaltyCard, RewardCoupon, RewardsConfig } from './types';

interface MyLoyalty {
  card: LoyaltyCard | null;
  config: RewardsConfig | null;
  coupons: RewardCoupon[];
}

/**
 * A client's card at the barbershop they chose (HU-LOY-001): stickers, progress to the reward and their
 * coupons. Every request is scoped to that barbershop, so the session enters it first (DEC-AUTH-06).
 */
@Component({
  selector: 'lo-my-card-page',
  imports: [IonButton, IonSpinner],
  template: `
    <section class="page">
      <h1>Mi tarjeta</h1>
      @if (!shopId) {
        <div class="center">
          <p>Elige una barbería para ver tu tarjeta de sellos.</p>
          <ion-button (click)="toCatalog()">Ver barberías</ion-button>
        </div>
      } @else {
        @switch (view.state().kind) {
          @case ('loading') { <div class="center"><ion-spinner aria-label="Cargando" /></div> }
          @case ('error') {
            <div class="center"><p class="error">{{ errorText() }}</p><ion-button (click)="view.run()">Intentar de nuevo</ion-button></div>
          }
          @case ('data') {
            @if (data(); as d) {
              @if (d.card; as c) {
                <div class="card">
                  <p class="gold" style="font-size: 1.4rem; margin: 0">{{ progressOf(c).text }}</p>
                  <div class="bar"><div class="fill" [style.width.%]="progressOf(c).percent"></div></div>
                  @if (c.rewardDescription) { <p class="muted">Premio: {{ c.rewardDescription }}</p> }
                  <p>{{ missingOf(c) }}</p>
                  <p class="muted">Premios reclamados: {{ c.totalRewardsRedeemed }}</p>
                </div>
              } @else {
                <div class="card">
                  <p>Aún no tienes sellos en esta barbería.</p>
                  @if (d.config?.isActive) {
                    <p class="muted">Junta {{ d.config!.stickersRequired }} sellos y gana: {{ d.config!.rewardDescription }}.</p>
                  } @else { <p class="muted">La barbería todavía no tiene programa de fidelización.</p> }
                </div>
              }
              <h2>Mis cupones</h2>
              @for (k of d.coupons; track k.id) {
                <div class="card">
                  <div class="row">
                    <p>Cupón del {{ date(k.createdAt) }}</p>
                    <span class="badge" [class.ACTIVE]="k.status === 'ACTIVE'" [class.off]="k.status === 'USED'">{{ k.status === 'ACTIVE' ? 'Disponible' : 'Usado' }}</span>
                  </div>
                  @if (k.usedAt) { <p class="muted">Usado el {{ date(k.usedAt) }}</p> }
                </div>
              } @empty { <p class="center">Todavía no tienes cupones.</p> }
            }
          }
        }
      }
    </section>
  `,
  styles: PAGE_STYLES + `
    .bar { background: #2a2a2a; border-radius: 999px; height: .6rem; margin: .5rem 0; overflow: hidden; }
    .fill { background: #d4af37; height: 100%; }
  `,
})
export class MyCardPageComponent {
  private readonly api = inject(LoyaltyApi);
  private readonly shell = shellContext(inject(ActivatedRoute).snapshot);
  readonly shopId = this.shell?.session.barbershopId() ?? null;
  readonly progressOf = progress;
  readonly missingOf = missing;
  readonly date = formatDate;
  readonly view = loader(async (): Promise<MyLoyalty> => {
    await this.shell!.session.enterBarbershop(this.shopId!);
    const [card, config, coupons] = await Promise.all([notFoundAsNull(this.api.myCard()),
      notFoundAsNull(this.api.config()), this.api.coupons(null)]);
    return { card, config, coupons: coupons.data };
  });

  constructor() {
    if (this.shopId) void this.view.run();
  }

  toCatalog(): void {
    this.shell?.navigate('/barbershops');
  }

  data(): MyLoyalty | null {
    const s = this.view.state();
    return s.kind === 'data' ? s.value : null;
  }

  errorText(): string {
    const s = this.view.state();
    return s.kind === 'error' ? s.message : '';
  }
}

/** No card before the first sticker, no rule before the owner sets it: both are 404 and both are normal. */
async function notFoundAsNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (err) {
    if ((err as Partial<ApiError>)?.status === 404) return null;
    throw err;
  }
}
