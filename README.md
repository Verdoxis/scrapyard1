# SCRAPYARD

Rust skin gambling demo: case openings, roulette, coinflip, inventory, and a Steam trade bot for deposits/withdrawals.

## Run locally

```bash
npm install
npm run dev -- -p 43127
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

You start with **$25** demo balance and two starter skins. Use **+$25** in the header to top up.

## Features

- **Cases** — weighted crate openings with reel animation
- **Roulette** — red / black / green (14×)
- **Coinflip** — CT vs T vs house
- **Inventory** — sell at 95% or withdraw via bot
- **Steam bot** — deposit/withdraw trade offers (mock by default)

Rolls use a server seed + client seed + nonce (SHA-256). History stores seeds for verification.

## Steam trade bot

### Mock mode (default)

`STEAM_BOT_MODE` unset or `mock`. Trades auto-progress: pending → sent → accepted in a few seconds. No real Steam items move. Use the **demo trade URL** button on the Steam Bot page.

### Live mode

Set:

```bash
STEAM_BOT_MODE=live
STEAM_ACCOUNT_NAME=...
STEAM_PASSWORD=...
STEAM_SHARED_SECRET=...
STEAM_IDENTITY_SECRET=...
STEAM_BOT_STEAM_ID=...
STEAM_BOT_NAME=Scrapyard Bot
```

Then implement `sendLiveTrade()` in `src/lib/steam-bot.ts` with `steam-user`, `steam-totp`, and `steam-tradeoffer-manager`. Live mode refuses trades until that wiring is done so credentials alone cannot accidentally partial-send.

**Notes**

- Operating a real skin gambling site may require gambling licenses and must follow Steam / Facepunch ToS.
- This repo ships fictional skin names and SVG glyphs — not official Rust asset art.
- In-memory state resets when the server restarts.

## Scripts

| Command        | Description        |
|----------------|--------------------|
| `npm run dev`  | Dev server         |
| `npm run build`| Production build   |
| `npm run start`| Start production   |
| `npm run lint` | ESLint             |
