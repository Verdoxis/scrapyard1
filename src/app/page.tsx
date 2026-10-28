import Link from "next/link";
import { ScrapyardLogo } from "@/components/logo";
import { ChatRoom } from "@/components/chat-room";
import { HOUSE_RAKE_PERCENT } from "@/lib/config";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="relative overflow-hidden rounded-sm border border-[rgba(196,92,38,0.45)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 70% 40%, rgba(205,65,43,0.28), transparent 55%), linear-gradient(160deg, #16100c 0%, #0a0806 100%)",
          }}
        />
        <div className="relative px-6 py-12 sm:px-10 sm:py-16">
          <ScrapyardLogo markClassName="h-16 w-16 sm:h-20 sm:w-20" />
          <h1 className="mt-6 max-w-xl font-display text-5xl leading-none tracking-[0.06em] text-[#efe6da] sm:text-7xl">
            SURVIVE THE FLIP
          </h1>
          <p className="mt-4 max-w-lg text-base text-[#c4b5a5]">
            Rust skin coinflip and jackpot. Link Steam on Account, deposit
            skins to the bot, and claim wins by trade.
          </p>
          <dl className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.2em] text-[#8a7d70]">
                Games
              </dt>
              <dd className="mt-1 font-display text-lg tracking-wide text-[#efe6da]">
                Coinflip · Jackpot
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.2em] text-[#8a7d70]">
                House rake
              </dt>
              <dd className="mt-1 font-mono text-lg text-[#f0a060]">
                {HOUSE_RAKE_PERCENT}%
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.2em] text-[#8a7d70]">
                Payouts
              </dt>
              <dd className="mt-1 font-display text-lg tracking-wide text-[#efe6da]">
                Steam trade
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-sm border border-[rgba(240,160,96,0.35)] bg-[rgba(18,14,10,0.92)]">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
          <div className="max-w-xl">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#f0a060]">
              Provably fair
            </p>
            <h2 className="mt-1 font-display text-2xl tracking-wide text-[#efe6da] sm:text-3xl">
              Every roll is verifiable
            </h2>
            <p className="mt-2 text-sm text-[#a89888]">
              Server seeds are hashed before the round, then revealed after
              settle. House cut is a small skin when one fits — tiny pots often
              have no cut at all.
            </p>
          </div>
          <Link
            href="/fair"
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-sm bg-[#cd412b] px-6 font-display text-sm tracking-[0.14em] text-[#140c08] shadow-[0_8px_24px_rgba(205,65,43,0.3)] transition hover:bg-[#e25a3c]"
          >
            How fairness works
          </Link>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <section className="space-y-5">
          <h2 className="font-display text-3xl tracking-wide text-[#efe6da]">
            How it works
          </h2>
          <ol className="space-y-4 text-sm text-[#a89888]">
            <li>
              <span className="font-mono text-[#cd412b]">01</span>
              <span className="ml-3 text-[#efe6da]">Connect Steam</span> on
              Account with your trade URL.
            </li>
            <li>
              <span className="font-mono text-[#cd412b]">02</span>
              <span className="ml-3 text-[#efe6da]">Pick skins</span> and join a
              coinflip or drop into jackpot.
            </li>
            <li>
              <span className="font-mono text-[#cd412b]">03</span>
              <span className="ml-3 text-[#efe6da]">Accept the bot trade</span>{" "}
              — winner claims the pot.
            </li>
          </ol>
        </section>
        <ChatRoom compact />
      </div>
    </main>
  );
}
