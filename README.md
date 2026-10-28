# SCRAPYARD

Rust-themed skin coinflip & jackpot. Connect Steam, stake skins, verify every roll on **Fair & Terms**. House cut is a small item when one fits (~5%); tiny pots often have no cut.

Discord support: https://discord.gg/YU99W9nF5G

## Quick start (works today)

```bash
npm install
cp .env.example .env   # leave STEAM_BOT_MODE=mock
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

1. Age gate → **Account** → paste a Steam trade URL (demo URL on the page works in mock).
2. Inventory fills with catalog skins.
3. **Coinflip** / **Jackpot** — pick skins, accept mock trades, play.

Production-style local run:

```bash
npm run build
npm start
```

Game state persists under `.data/scrapyard.json` across restarts.

## Put it into action

| Step | What to do |
|------|------------|
| 1. Repo | Create your real GitHub/Origin repo from this project (Create repo in Cursor if you have not yet). |
| 2. Host | Deploy the Next.js app (Vercel, a VPS, Docker, etc.) with Node 20+. |
| 3. Env | Copy `.env.example` → `.env` on the host. Start with `STEAM_BOT_MODE=mock` until the bot is wired. |
| 4. Domain | Point DNS at the host; use HTTPS. |
| 5. Live bot | Set `STEAM_BOT_MODE=live` and fill Steam bot secrets (see below). Implement real offer send/accept in `src/lib/steam-bot.ts`. |
| 6. Legal | Confirm skin gambling is legal for you and your players. Keep 18+ / self-ban / Fair & Terms linked. |

### Live Steam bot checklist

Required env when `STEAM_BOT_MODE=live`:

- `STEAM_ACCOUNT_NAME`
- `STEAM_PASSWORD`
- `STEAM_SHARED_SECRET` (Steam Guard mobile)
- `STEAM_IDENTITY_SECRET` (confirm trades)
- `STEAM_BOT_STEAM_ID`
- `STEAM_BOT_NAME` (optional display)

Until `sendLiveTrade()` and offer polling are implemented against those credentials, keep mock mode for demos. Live mode currently refuses to pretend it is ready unless all vars are set.

### Ops notes

- Persist file: `.data/scrapyard.json` (gitignored). Back it up if you care about history.
- In-memory Maps hydrate from that file on boot.
- Mock inventory is still synthetic catalog art — live mode must pull real asset IDs from Steam inventory APIs.
- Not affiliated with Facepunch or Valve. Follow Steam / site ToS.

## Games

| Game | Flow |
|------|------|
| **Coinflip** | Create or join with skins → trade into escrow → flip → winner claims payout trade. |
| **Jackpot** | Deposit into the timed pot → chance ∝ value → spin → payout trade. |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server on `127.0.0.1:43127` |
| `npm run build` | Production build |
| `npm start` | Serve production build on `43127` |
