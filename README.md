# SCRAPYARD

Rust-themed skin coinflip & jackpot. Connect Steam, stake skins, verify every roll on **Fair & Terms**. House cut is a small item when one fits (~5%); tiny pots often have no cut.

Discord support: https://discord.gg/YwMWKvHt6Y

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

## Put it into action (beginner · Squarespace domain)

Scrapyard is a **Next.js app**. It cannot run inside Squarespace’s website builder. Keep the **domain on Squarespace**, host the app on **Vercel** (free tier is fine to start), then point DNS.

### Step A — Save the code to a real GitHub repo

1. In Cursor, use **Create repo** for this project (if you have not already).
2. Connect that repo to your GitHub account so Vercel can import it.

### Step B — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → sign up with GitHub.
2. **Add New Project** → import the Scrapyard repo.
3. Leave build settings default (`next build`).
4. Under **Environment Variables**, add:
   - `STEAM_BOT_MODE` = `mock`
5. Click **Deploy**. You’ll get a temporary URL like `scrapyard-xxxx.vercel.app`. Open it and confirm the age gate loads.

### Step C — Attach your Squarespace domain

1. In Vercel: Project → **Settings** → **Domains** → add `yourdomain.com` and `www.yourdomain.com`.
2. Vercel shows the exact DNS records to create. Keep that tab open.
3. In Squarespace: **Domains** → your domain → **DNS settings** (sometimes under “Advanced settings”).
4. Add / edit records to match Vercel (typical pattern):

| Host | Type | Data (use Vercel’s values if they differ) |
|------|------|-------------------------------------------|
| `@` | **A** | `76.76.21.21` |
| `www` | **CNAME** | `cname.vercel-dns.com` |

5. Remove any old Squarespace **Website** A/CNAME records that conflict (parking page, built-in site, etc.).
6. Wait 5–60 minutes. In Vercel, the domain should turn valid and get a free HTTPS certificate.

### Step D — Smoke test

- `https://yourdomain.com` → welcome / 18+ gate  
- `https://yourdomain.com/api/health` → `"ok": true`  
- Account → connect (mock) → Coinflip  

**Note:** On Vercel’s free serverless hosting, game state may reset between cold starts (the `.data` file is not durable there). Fine for a public demo; for lasting lobbies later, use a VPS or add a real database.

### Later

| Step | What to do |
|------|------------|
| Live Steam bot | Set `STEAM_BOT_MODE=live` + secrets; wire `src/lib/steam-bot.ts`. |
| Legal | Confirm skin gambling is allowed for you/players. Keep 18+ / self-ban / Fair & Terms. |

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
