import Link from "next/link";
import { HOUSE_RAKE_PERCENT } from "@/lib/config";
import { ScrapyardLogo } from "@/components/logo";
import { ChatRoom } from "@/components/chat-room";
import { SKINS } from "@/lib/skins";

export default function HomePage() {
  const preview = SKINS.slice(0, 8);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="relative mb-10 overflow-hidden rounded-sm border border-[rgba(205,65,43,0.35)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 70% at 75% 45%, rgba(205,65,43,0.4), transparent 55%), linear-gradient(120deg, #1a120c 0%, #0a0806 48%, #142016 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23cd412b' fill-opacity='0.55'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40z'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative grid gap-8 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <ScrapyardLogo markClassName="h-14 w-14" />
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#cd412b]">
              Facepunch twilight · {HOUSE_RAKE_PERCENT}% house cut
            </p>
            <h1 className="mt-3 max-w-xl font-display text-5xl leading-none tracking-[0.06em] text-[#efe6da] sm:text-7xl">
              SURVIVE THE FLIP
            </h1>
            <p className="mt-4 max-w-lg text-base text-[#c4b5a5] sm:text-lg">
              Connect Steam. Your skins list on-screen with Steam market art.
              The bot trades you for what you gamble — coinflip or jackpot only.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/account"
                className="inline-flex items-center rounded-sm bg-[#cd412b] px-5 py-2.5 font-display text-sm tracking-wider text-[#140c08] transition hover:bg-[#e25a3c]"
              >
                Connect Steam
              </Link>
              <Link
                href="/coinflip"
                className="inline-flex items-center rounded-sm border border-[rgba(240,160,96,0.4)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#f0a060] transition hover:bg-[rgba(205,65,43,0.12)]"
              >
                Coinflip
              </Link>
              <Link
                href="/jackpot"
                className="inline-flex items-center rounded-sm border border-[rgba(240,160,96,0.4)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#f0a060] transition hover:bg-[rgba(205,65,43,0.12)]"
              >
                Jackpot
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {preview.map((skin) => (
              <div
                key={skin.id}
                className="aspect-square overflow-hidden rounded-sm border border-[rgba(205,65,43,0.25)] bg-black/50 p-1"
                title={skin.marketHashName}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={skin.image}
                  alt={skin.name}
                  className="h-full w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <section className="space-y-4">
          <h2 className="font-display text-3xl tracking-wide text-[#efe6da]">
            How the yard works
          </h2>
          {[
            {
              step: "01",
              title: "Link trade URL",
              body: "We pull your Steam avatar automatically from the partner id in your trade URL.",
            },
            {
              step: "02",
              title: "Skins already listed",
              body: "Inventory shows real Steam market icons cached from the economy CDN.",
            },
            {
              step: "03",
              title: "Bot sends the trade",
              body: "Pick skins for coinflip or jackpot — accept the bot offer and play. 5% rake.",
            },
          ].map((card) => (
            <div
              key={card.step}
              className="rounded-sm border border-[rgba(205,65,43,0.25)] bg-[rgba(18,14,10,0.9)] p-5"
            >
              <p className="font-mono text-xs text-[#cd412b]">{card.step}</p>
              <h3 className="mt-1 font-display text-2xl text-[#efe6da]">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-[#a89888]">{card.body}</p>
            </div>
          ))}
        </section>
        <ChatRoom compact />
      </div>
    </main>
  );
}
