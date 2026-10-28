import Link from "next/link";
import { ScrapyardLogo } from "@/components/logo";
import { ChatRoom } from "@/components/chat-room";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="relative overflow-hidden rounded-sm">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 70% 40%, rgba(205,65,43,0.28), transparent 55%), linear-gradient(160deg, #16100c 0%, #0a0806 100%)",
          }}
        />
        <div className="relative px-6 py-14 sm:px-10 sm:py-20">
          <ScrapyardLogo markClassName="h-16 w-16 sm:h-20 sm:w-20" />
          <h1 className="mt-6 max-w-xl font-display text-5xl leading-none tracking-[0.06em] text-[#efe6da] sm:text-7xl">
            SURVIVE THE FLIP
          </h1>
          <p className="mt-4 max-w-md text-base text-[#c4b5a5]">
            Link Steam, put skins on the line, take the pot.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/coinflip"
              className="inline-flex items-center rounded-sm bg-[#cd412b] px-6 py-3 font-display text-sm tracking-wider text-[#140c08] transition hover:bg-[#e25a3c]"
            >
              Play coinflip
            </Link>
            <Link
              href="/jackpot"
              className="inline-flex items-center rounded-sm border border-[rgba(240,160,96,0.45)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#f0a060] transition hover:bg-[rgba(205,65,43,0.12)]"
            >
              Jackpot
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#a89888] transition hover:text-[#efe6da]"
            >
              Account
            </Link>
          </div>
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
