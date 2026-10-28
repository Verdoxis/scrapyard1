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
