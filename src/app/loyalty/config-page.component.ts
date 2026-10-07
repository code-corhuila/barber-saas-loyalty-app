import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonInput, IonSpinner, IonToggle } from '@ionic/angular/standalone';
import { type ApiError, userMessage } from '../shell-context';
import { PAGE_STYLES } from '../ui/styles';
import { LoyaltyApi } from './loyalty-api';
import { type ConfigForm, validateConfig } from './rules';

/**
 * The owner's program: how many stickers earn the reward and what it is. A new threshold applies from
 * the next redemption; stickers already earned are not touched (`setLoyaltyConfig`).
 */
@Component({
  selector: 'lo-config-page',
  imports: [RouterLink, IonButton, IonInput, IonSpinner, IonToggle],
  template: `
    <section class="page">
      <a class="back" routerLink="/loyalty/cards">‹ Tarjetas</a>
      <h1>Programa de fidelización</h1>
      @if (loading()) { <div class="center"><ion-spinner aria-label="Cargando" /></div> }
      @else {
        <div class="field">
          <ion-input label="Sellos para el premio" labelPlacement="stacked" inputmode="numeric" placeholder="10"
                     [value]="form().stickers" (ionInput)="set('stickers', $event.detail.value)" />
          @if (errors().stickers) { <p class="field-error">{{ errors().stickers }}</p> }
        </div>
        <div class="field">
          <ion-input label="Premio" labelPlacement="stacked" placeholder="Corte clásico gratis" [maxlength]="255"
                     [value]="form().reward" (ionInput)="set('reward', $event.detail.value)" />
          @if (errors().reward) { <p class="field-error">{{ errors().reward }}</p> }
        </div>
        <div class="field">
          <ion-toggle [checked]="form().active" (ionChange)="form.update((f) => ({ ...f, active: $event.detail.checked }))">
            Programa activo
          </ion-toggle>
          <p class="hint">Cambiar los sellos aplica desde el próximo canje; los sellos ganados no cambian.</p>
        </div>
        @if (notice()) { <p class="gold" role="status">{{ notice() }}</p> }
        @if (saveError()) { <p class="error" role="alert">{{ saveError() }}</p> }
        <ion-button expand="block" [disabled]="saving()" (click)="save()">Guardar</ion-button>
      }
    </section>
  `,
  styles: PAGE_STYLES,
})
export class ConfigPageComponent implements OnInit {
  private readonly api = inject(LoyaltyApi);
  readonly form = signal<ConfigForm>({ stickers: '10', reward: '', active: true });
  readonly errors = signal<Partial<Record<'stickers' | 'reward', string>>>({});
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly notice = signal('');
  readonly saveError = signal('');

  ngOnInit(): void {
    void this.load();
  }

  set(field: 'stickers' | 'reward', value: string | null | undefined): void {
    this.form.update((f) => ({ ...f, [field]: value ?? '' }));
  }

  private async load(): Promise<void> {
    try {
      const c = await this.api.config();
      this.form.set({ stickers: String(c.stickersRequired), reward: c.rewardDescription, active: c.isActive });
    } catch (err) {
      if ((err as Partial<ApiError>)?.status !== 404) this.saveError.set(userMessage(err));   // 404: not set yet
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    const { errors, request } = validateConfig(this.form());
    this.errors.set(errors);
    if (!request) return;
    this.saving.set(true);
    this.notice.set('');
    this.saveError.set('');
    try {
      await this.api.setConfig(request);
      this.notice.set('Programa guardado.');
    } catch (err) {
      this.saveError.set(userMessage(err));
    } finally {
      this.saving.set(false);
    }
  }
}
