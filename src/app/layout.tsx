import type { Metadata } from "next";
import { Bebas_Neue, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AgeGate } from "@/components/age-gate";
import { AppProvider } from "@/components/app-provider";
import { ClickSoundHost } from "@/components/click-sound";
import { SiteHeader } from "@/components/site-header";
import { SkinCursorTipHost } from "@/components/skin-icons";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SCRAPYARD — Rust Coinflip & Jackpot",
  description:
    "Connect Steam, list market skins, chat with the yard, and gamble via trade bot. 18+ only.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-[#f3ebe2]">
        <AgeGate>
          <AppProvider>
            <ClickSoundHost />
            <SkinCursorTipHost />
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <footer className="border-t border-[rgba(196,92,38,0.15)] px-4 py-6 text-center text-xs text-[#6b6258]">
              <p>
                18+ only. Gamble responsibly — use Account → Self-ban if you
                need a break. Demo site; not affiliated with Facepunch or Valve.{" "}
                <a href="/fair" className="text-[#a89888] hover:text-[#f0a060]">
                  Fair & Terms
                </a>
              </p>
              <p className="mt-3">
                <a
                  href="https://discord.gg/YU99W9nF5G"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#a89888] transition hover:text-[#f0a060]"
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-current"
                  >
                    <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.07.07 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.07.07 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.07.07 0 0 0-.041-.098 13.107 13.107 0 0 1-1.872-.892.07.07 0 0 1-.008-.117c.126-.094.252-.192.373-.292a.07.07 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.07.07 0 0 1 .079.01c.12.1.247.198.373.292a.07.07 0 0 1-.006.117 12.3 12.3 0 0 1-1.873.892.07.07 0 0 0-.041.099c.36.698.772 1.362 1.225 1.993a.07.07 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.07.07 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Join Discord for support
                </a>
              </p>
            </footer>
          </AppProvider>
        </AgeGate>
      </body>
    </html>
  );
}
