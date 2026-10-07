import { Routes } from '@angular/router';

/**
 * What this domain app exposes as './routes' (ADR-013). The shell mounts them under /loyalty for
 * clients (their card and coupons) and staff (the program, the cards, stickers and redemptions); every
 * screen is lazy, so the shell downloads only what is opened.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./loyalty/home.component').then((m) => m.HomeComponent) },
  { path: 'me', title: 'Mi tarjeta', loadComponent: () =>
      import('./loyalty/my-card-page.component').then((m) => m.MyCardPageComponent) },
  { path: 'cards', title: 'Fidelización', loadComponent: () =>
      import('./loyalty/cards-page.component').then((m) => m.CardsPageComponent) },
  { path: 'cards/:id', title: 'Tarjeta', loadComponent: () =>
      import('./loyalty/card-detail-page.component').then((m) => m.CardDetailPageComponent) },
  { path: 'config', title: 'Programa', loadComponent: () =>
      import('./loyalty/config-page.component').then((m) => m.ConfigPageComponent) },
];
