"use client";

import { useEffect, useState } from "react";
import { ScrapyardLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "scrapyard_age_verified_v1";

export function AgeGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    try {
      setAllowed(localStorage.getItem(STORAGE_KEY) === "yes");
    } catch {
      setAllowed(false);
    }
    setReady(true);
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "yes");
    } catch {
      /* ignore */
    }
    setAllowed(true);
  }

  function decline() {
    window.location.href = "https://www.google.com";
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0806] text-sm text-[#a89888]">
        Loading…
      </div>
    );
  }

  if (allowed) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050403]/95 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-sm border border-[rgba(205,65,43,0.45)] p-6 shadow-[0_0_60px_rgba(205,65,43,0.2)] sm:p-8"
        style={{
          background:
            "linear-gradient(165deg, rgba(40,24,16,0.98), rgba(12,10,8,0.99))",
        }}
      >
        <ScrapyardLogo markClassName="h-12 w-12" />
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#cd412b]">
          Age verification · Gambling warning
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-wide text-[#efe6da] sm:text-4xl">
          18+ only
        </h1>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#c4b5a5]">
          <p>
            SCRAPYARD is a skin gambling site. By entering you confirm you are{" "}
            <strong className="text-[#efe6da]">at least 18 years old</strong>{" "}
            (or the legal age for gambling where you live — whichever is higher).
          </p>
          <p>
            Gambling can be addictive and you can lose items of real value.
            Never wager more than you can afford to lose. If you need help, use
            the self-ban tools in{" "}
            <span className="text-[#f0a060]">Account</span> or visit{" "}
            <a
              href="https://www.begambleaware.org/"
              target="_blank"
              rel="noreferrer"
              className="text-[#f0a060] underline-offset-2 hover:underline"
            >
              BeGambleAware
            </a>
            .
          </p>
          <p className="text-xs text-[#8a7d70]">
            This is a demo with mock Steam trades by default. Not affiliated
            with Facepunch or Valve. Local laws may prohibit online gambling.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            className="flex-1 bg-[#cd412b] text-[#140c08] hover:bg-[#e25a3c]"
            onClick={accept}
          >
            I am 18+ — enter
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-[rgba(240,160,96,0.35)] text-[#f0a060] hover:bg-[rgba(205,65,43,0.12)]"
            onClick={decline}
          >
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
