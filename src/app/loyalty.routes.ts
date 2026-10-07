import { Routes } from '@angular/router';

/**
 * What this domain app exposes as './routes' (ADR-013). The shell mounts them under /loyalty for
 * clients (their card and coupons) and staff (the program, the cards, stickers and redemptions); every
 * screen is lazy, so the shell downloads only what is opened.
 */
export const routes: Routes = [];
