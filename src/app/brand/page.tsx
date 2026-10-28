import Link from "next/link";

const FILES = [
  {
    href: "/scrapyard-logos.zip",
    name: "All logos (ZIP)",
    detail: "SVG · PNG · Discord GIFs",
    primary: true,
  },
  {
    href: "/scrapyard-logo.svg",
    name: "Logo SVG",
    detail: "Vector · transparent",
  },
  {
    href: "/scrapyard-logo.png",
    name: "Logo PNG 256",
    detail: "Static mark",
  },
  {
    href: "/scrapyard-logo-512.png",
    name: "Logo PNG 512",
    detail: "Hi-res static",
  },
  {
    href: "/scrapyard-logo-discord.gif",
    name: "Discord Nitro GIF",
    detail: "256×256 animated avatar",
  },
  {
    href: "/scrapyard-logo-emoji.gif",
    name: "Discord emoji GIF",
    detail: "128×128 custom emoji",
  },
  {
    href: "/logo.svg",
    name: "Site logo.svg",
    detail: "Same mark used in-app",
  },
] as const;

export default function BrandPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#cd412b]">
        Brand kit
      </p>
      <h1 className="mt-1 font-display text-4xl tracking-wide text-[#efe6da]">
        Scrapyard logos
      </h1>
      <p className="mt-3 text-sm text-[#a89888]">
        Download the mark and Discord Nitro loops. Transparent backgrounds on
        everything.
      </p>

      <div className="mt-8 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/scrapyard-logo-discord.gif"
          alt="Scrapyard animated logo"
          className="h-36 w-36"
        />
      </div>

      <ul className="mt-10 space-y-2">
        {FILES.map((f) => (
          <li key={f.href}>
            <a
              href={f.href}
              download
              className={
                "primary" in f && f.primary
                  ? "flex items-center justify-between gap-4 rounded-sm bg-[#cd412b] px-4 py-4 text-[#140c08] transition hover:bg-[#e25a3c]"
                  : "flex items-center justify-between gap-4 rounded-sm border border-[rgba(205,65,43,0.35)] bg-[rgba(18,14,10,0.85)] px-4 py-3 transition hover:border-[rgba(240,160,96,0.55)]"
              }
            >
              <span>
                <span
                  className={
                    "primary" in f && f.primary
                      ? "block font-display text-lg tracking-wide"
                      : "block font-semibold text-[#efe6da]"
                  }
                >
                  {f.name}
                </span>
                <span
                  className={
                    "primary" in f && f.primary
                      ? "text-xs opacity-80"
                      : "text-xs text-[#8a7d70]"
                  }
                >
                  {f.detail}
                </span>
              </span>
              <span
                className={
                  "primary" in f && f.primary
                    ? "shrink-0 text-xs font-semibold uppercase tracking-[0.16em]"
                    : "shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#f0a060]"
                }
              >
                Download
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center text-sm text-[#6b6258]">
        <Link href="/" className="text-[#a89888] hover:text-[#efe6da]">
          ← Back to lobby
        </Link>
      </p>
    </main>
  );
}
