import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonSelect, IonSelectOption, IonSpinner } from '@ionic/angular/standalone';
import { shellContext } from '../shell-context';
import { loader } from '../ui/load';
import { PAGE_STYLES } from '../ui/styles';
import { LoyaltyApi } from './loyalty-api';
import { formatDate, progress } from './rules';
import type { LoyaltyCard } from './types';

/** Staff: the barbershop's cards, last updated first; the ones that can redeem stand out. */
@Component({
  selector: 'lo-cards-page',
  imports: [RouterLink, IonButton, IonSelect, IonSelectOption, IonSpinner],
  template: `
    <section class="page">
      <div class="head">
        <h1>Fidelización</h1>
        @if (isOwner) { <ion-button fill="outline" routerLink="/loyalty/config">Programa</ion-button> }
      </div>
      <p class="sub">Las tarjetas de sellos de tus clientes.</p>
      <div class="field">
        <ion-select label="Mostrar" labelPlacement="stacked" interface="popover" [value]="onlyRedeem()"
                    (ionChange)="filter($event.detail.value)">
          <ion-select-option [value]="false">Todas</ion-select-option>
          <ion-select-option [value]="true">Pueden reclamar premio</ion-select-option>
        </ion-select>
      </div>
      @switch (list.state().kind) {
        @case ('loading') { <div class="center"><ion-spinner aria-label="Cargando" /></div> }
        @case ('error') {
          <div class="center"><p class="error">{{ errorText() }}</p><ion-button (click)="list.run()">Intentar de nuevo</ion-button></div>
        }
        @case ('empty') { <p class="center">{{ onlyRedeem() ? 'Nadie puede reclamar todavía.' : 'Aún no hay tarjetas: se crean con el primer sello.' }}</p> }
        @case ('data') {
          @for (c of cards(); track c.id) {
            <a class="card" [routerLink]="['/loyalty/cards', c.id]">
              <div class="row">
                <div><h2>{{ progressOf(c).text }}</h2><p class="muted">Cliente {{ c.clientId.slice(0, 8) }} · {{ date(c.lastUpdated) }}</p></div>
                @if (c.canRedeem) { <span class="badge ACTIVE">Premio listo</span> }
              </div>
            </a>
          }
        }
      }
    </section>
  `,
  styles: PAGE_STYLES,
})
export class CardsPageComponent {
  private readonly api = inject(LoyaltyApi);
  readonly isOwner = shellContext(inject(ActivatedRoute).snapshot)?.session.user()?.role === 'ADMIN_BARBERSHOP';
  readonly progressOf = progress;
  readonly date = formatDate;
  readonly onlyRedeem = signal(false);
  readonly list = loader(() => this.api.listCards(this.onlyRedeem() || null), (p) => p.data.length === 0);

  constructor() {
    void this.list.run();
  }

  filter(value: boolean): void {
    this.onlyRedeem.set(value === true);
    void this.list.run();
  }

  cards(): LoyaltyCard[] {
    const s = this.list.state();
    return s.kind === 'data' ? s.value.data : [];
  }

  errorText(): string {
    const s = this.list.state();
    return s.kind === 'error' ? s.message : '';
  }
}
