# SCRAPYARD

Rust skin coinflip & jackpot. Connect Steam, see your inventory listed, select skins to gamble — the trade bot sends you an offer for those items. The site takes a **5% house rake** from every settled pot.

## Run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

## Flow

1. **Connect Steam** — follow on-page directions, paste your trade URL (demo URL works in mock mode).
2. **Inventory loads** on screen (mock Steam inventory in demo).
3. **Coinflip** or **Jackpot** — pick skins → bot sends trade → accept → skins enter the game.
4. Settled pots pay the winner; lowest-value skins covering ~5% go to the house.

## Games

| Game | How it works |
|------|----------------|
| **Coinflip** | Create a lobby with skins. After the bot trade accepts, call a bot opponent (or a real joiner). 50/50 flip. |
| **Jackpot** | Deposit skins into a timed pot. Chance ∝ deposit value. Rival bots fill the pot in demo so rounds can complete. |

## Steam bot

- **Mock (default):** trades auto-accept in a few seconds.
- **Live:** set `STEAM_BOT_MODE=live` and Steam env vars (see `.env.example`), then implement live sending in `src/lib/steam-bot.ts`.

## Notes

- In-memory state resets when the server restarts.
- Fictional skin names / SVG glyphs — not official Rust art.
- Real operation needs licensing and Steam / Facepunch ToS compliance.
