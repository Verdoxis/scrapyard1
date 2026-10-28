import Link from "next/link";
import { HOUSE_RAKE_PERCENT } from "@/lib/config";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="relative mb-10 overflow-hidden rounded-lg border border-[rgba(196,92,38,0.28)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% 40%, rgba(196,92,38,0.35), transparent 55%), linear-gradient(135deg, #1a1410 0%, #0c0a08 55%, #1c120c 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c45c26' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative px-6 py-14 sm:px-10 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#c45c26]">
            Steam skins · {HOUSE_RAKE_PERCENT}% house cut
          </p>
          <h1 className="mt-3 max-w-xl font-display text-5xl leading-none tracking-[0.06em] text-[#f3ebe2] sm:text-7xl">
            SCRAPYARD
          </h1>
          <p className="mt-4 max-w-lg text-base text-[#c4b5a5] sm:text-lg">
            Connect Steam, see your inventory on screen, and gamble skins in
            coinflip or jackpot. The bot trades you for the items you select.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/connect"
              className="inline-flex items-center rounded bg-[#c45c26] px-5 py-2.5 font-display text-sm tracking-wider text-[#120e0b] transition hover:bg-[#e07030]"
            >
              Connect Steam
            </Link>
            <Link
              href="/coinflip"
              className="inline-flex items-center rounded border border-[rgba(240,160,96,0.35)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#f0a060] transition hover:bg-[rgba(196,92,38,0.12)]"
            >
              Coinflip
            </Link>
            <Link
              href="/jackpot"
              className="inline-flex items-center rounded border border-[rgba(240,160,96,0.35)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#f0a060] transition hover:bg-[rgba(196,92,38,0.12)]"
            >
              Jackpot
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            step: "01",
            title: "Connect trade URL",
            body: "Follow the Steam setup steps and paste your trade URL so the bot can reach you.",
            href: "/connect",
          },
          {
            step: "02",
            title: "Pick listed skins",
            body: "Your inventory is already on the page. Select what you want to put into a game.",
            href: "/connect",
          },
          {
            step: "03",
            title: "Bot sends the trade",
            body: "Accept the offer, then play coinflip or jackpot. Site keeps a small % of every pot.",
            href: "/coinflip",
          },
        ].map((card) => (
          <Link
            key={card.step}
            href={card.href}
            className="rounded border border-[rgba(196,92,38,0.22)] bg-[rgba(20,16,12,0.85)] p-5 transition hover:border-[rgba(196,92,38,0.5)]"
          >
            <p className="font-mono text-xs text-[#c45c26]">{card.step}</p>
            <h2 className="mt-2 font-display text-2xl tracking-wide text-[#f3ebe2]">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-[#a89a8c]">{card.body}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
