import type { Metadata } from "next";
import { Bebas_Neue, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AppProvider } from "@/components/app-provider";
import { SiteHeader } from "@/components/site-header";
import { HOUSE_RAKE_PERCENT } from "@/lib/config";
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
    "Connect Steam, list market skins, chat with the yard, and gamble via trade bot.",
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
        <AppProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-[rgba(196,92,38,0.15)] px-4 py-6 text-center text-xs text-[#6b6258]">
            Demo — mock Steam trades by default. {HOUSE_RAKE_PERCENT}% house rake on every game.
            Not affiliated with Facepunch or Valve.
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
