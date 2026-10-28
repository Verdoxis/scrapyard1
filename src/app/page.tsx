import { CaseOpener } from "@/components/case-opener";

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
            Live demo · mock Steam bot
          </p>
          <h1 className="mt-3 max-w-xl font-display text-5xl leading-none tracking-[0.06em] text-[#f3ebe2] sm:text-7xl">
            SCRAPYARD
          </h1>
          <p className="mt-4 max-w-lg text-base text-[#c4b5a5] sm:text-lg">
            Open crates, spin roulette, flip for skins — deposit and withdraw
            through the Steam trade bot.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#opener"
              className="inline-flex items-center rounded bg-[#c45c26] px-5 py-2.5 font-display text-sm tracking-wider text-[#120e0b] transition hover:bg-[#e07030]"
            >
              Open a crate
            </a>
            <a
              href="/trades"
              className="inline-flex items-center rounded border border-[rgba(240,160,96,0.35)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#f0a060] transition hover:bg-[rgba(196,92,38,0.12)]"
            >
              Connect Steam bot
            </a>
          </div>
        </div>
      </section>

      <div id="opener">
        <CaseOpener />
      </div>
    </main>
  );
}
