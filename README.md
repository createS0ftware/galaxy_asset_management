# Stellar Asset Trail — Ops Portal

Web portal (spec §5.1 / §6.1) for the backend in `../galaxy_asset_management_backend`.

Stack: Vite + React 19 + TypeScript, **SWR** for data fetching (auto-refresh), **Tailwind CSS v4** + shadcn-style UI components (`src/components/ui`), pnpm, react-router. Portal look: light warm-gray canvas, near-black sidebar, burnt-orange primary — matching the design mockups; the route map is a schematic SVG with solid = ledger-verified, dashed = GPS estimate.

## Run

```bash
pnpm install
pnpm dev            # http://localhost:5173 (proxies /v1 → backend on :3000)
```

Backend (if not already running):

```bash
cd ../galaxy_asset_management_backend/backend
npm run dev         # .env already configured; seeds admin + serves API on :3000
```

Login: `ops@example.com` / `demo1234` (from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`).

## Screens

| Route | Screen |
|---|---|
| `/` | Trips board — schematic route map, needs-attention queue, escrow, tx links |
| `/routes/new` | Route planner — waypoints, geofences, pay, live preview map, fund escrow (BR-02 gate) |
| `/trips/:id` | Trip detail — verified vs live route, advances, custody events, ops overrides |
| `/assets` | Asset list + registration (T1) |
| `/assets/:id` | Asset detail — on-chain identity, activate, custody trail, proof links |
| `/drivers` | Drivers + wallet status |
| `/payments` | Treasury, escrow by trip, fee-account alert, advance approvals, payouts |

## Demo scripts (backend folder)

`scripts/seed-demo.ts` (asset + driver wallet via OTP from the log) and `scripts/seed-trip.ts` (funded trip). Database is in-memory (`pglite://memory`), so re-seed after backend restarts.
