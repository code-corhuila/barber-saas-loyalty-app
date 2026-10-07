# barber-saas-loyalty-app

> loyalty bounded context: mobile UI (remote)

Part of the **Barber Saas** distributed system — team `barber-saas`, Grupo 2.
Governance and documentation live in [`barber-saas-docs`](https://github.com/code-corhuila/barber-saas-docs).

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `barber-saas-docs`.

---

## BarberSaaS — what this repository is

The loyalty screens of BarberSaaS: an **Ionic Angular** domain app (ADR-013), copied from the
reference app `barber-saas-platform-admin-app`, loaded by the Angular shell (`barber-saas-front`) at
`/loyalty` for clients and staff. `/loyalty` sends a `CLIENT` to their card and staff to the cards.

| Screen | Who | Calls (`loyalty-service.yaml` 1.3.0) |
|---|---|---|
| Mi tarjeta: stickers, progress to the reward, coupons | `CLIENT`, at the barbershop they chose | `session.enterBarbershop(id)`, then `GET /api/v1/loyalty/cards/me`, `/config`, `/coupons` |
| Fidelización: the barbershop's cards, those ready to redeem | `ADMIN_BARBERSHOP`, `BARBER` | `GET /api/v1/loyalty/cards?canRedeem` |
| Tarjeta: history, give a sticker, redeem the reward | `ADMIN_BARBERSHOP`, `BARBER` | `GET …/cards/{id}`, `…/transactions`, `POST …/stickers`, `POST …/redemptions` (`Idempotency-Key`) |
| Programa: stickers for the reward, the reward, active | `ADMIN_BARBERSHOP` | `GET`/`PUT /api/v1/loyalty/config` |

```
federation.config.js       exposes './routes' only; Angular and Ionic shared as singletons
src/app/loyalty.routes.ts  the routes the shell mounts under /loyalty (every screen lazy)
src/app/shell-context.ts   the contract with the shell (copied, never imported)
src/app/loyalty/           calls, rules, types and the screens
src/app/ui/                the four states of every view and the shared styles
```

Requests go through the shell's `HttpClient` to relative `/api/...` URLs; this app never provides an
`HttpClient` and never stores a token (norm 5.4.1). Every sticker and redemption carries its own
`Idempotency-Key`, renewed after each success, so a repeated tap never credits twice.

### How to start it

```bash
npm ci
npm start      # ng serve: builds the remote and serves it at http://localhost:4306
```

Then start the shell and the platform and open `/loyalty`. **Pending in the shell (Daniel):** the
`/loyalty` entry in `app.routes.ts` and `loyalty` in `public/federation.manifest.json`.

### How it is tested

`npm test` (Vitest): the calls against the contract, the card's progress and the program form. CI
also builds the remote.

### What is missing

- A manual sticker is given from a card that already exists: the first one needs the client's id,
  and the contract has no way to look a client up. The usual first sticker arrives by itself when an
  appointment is completed (loyalty-api's `AppointmentCompleted`, pending barber-saas-docs#88).
- Using a coupon belongs to the booking (appointment-app); this app only shows them.
