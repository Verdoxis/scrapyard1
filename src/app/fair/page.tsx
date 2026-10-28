"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VERIFY_SNIPPET = `// Browser / Node — same formula Scrapyard uses
async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function fairFloat(serverSeed, clientSeed, nonce) {
  const h = await sha256Hex(\`\${serverSeed}:\${clientSeed}:\${nonce}\`);
  const int = parseInt(h.slice(0, 8), 16);
  return int / 0x100000000; // [0, 1)
}

// Coinflip: creator wins if roll < (creatorStake / totalStake)
// Jackpot: winningTicket = roll; walk deposits by value share
`;

type VerifyResult = {
  type: string;
  id: string;
  status: string;
  serverSeed: string;
  serverSeedHash: string;
  hashMatches: boolean;
  clientSeed: string;
  nonce: number;
  roll: number;
  resultSide?: string;
  winningTicket?: number;
  winnerId?: string;
  explanation: string;
  error?: string;
};

export default function FairPage() {
  const [gameType, setGameType] = useState<"coinflip" | "jackpot">("coinflip");
  const [gameId, setGameId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(() => VERIFY_SNIPPET.trim(), []);

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  async function verify() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/api/fair/verify?type=${gameType}&id=${encodeURIComponent(gameId.trim())}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verify failed");
        if (data.preview) setResult(null);
        return;
      }
      setResult(data as VerifyResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verify failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide text-[#efe6da] sm:text-5xl">
            Provably Fair
          </h1>
          <p className="mt-2 max-w-lg text-sm text-[#a89888]">
            Every round outcome can be independently verified by anyone.
          </p>
        </div>
        <a
          href="#verify"
          className="inline-flex h-11 shrink-0 items-center rounded-sm bg-[#cd412b] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#140c08] shadow-[0_8px_24px_rgba(205,65,43,0.3)] transition hover:bg-[#e25a3c]"
        >
          Don&apos;t trust · verify
        </a>
      </div>

      <section className="mt-10 overflow-hidden rounded-sm border border-[rgba(205,65,43,0.35)]">
        <div className="bg-[#cd412b] px-4 py-2.5">
          <h2 className="font-display text-lg tracking-wide text-[#140c08]">
            How it works
          </h2>
        </div>
        <div className="space-y-4 bg-[rgba(18,14,10,0.92)] px-4 py-5 text-sm text-[#a89888] sm:px-5">
          <p>
            Scrapyard commits to a hidden{" "}
            <span className="text-[#efe6da]">server seed</span> before each
            round. Only the SHA-256 hash is shown until the game settles — then
            the seed is revealed so you can recompute the roll yourself.
          </p>
          <ol className="space-y-3">
            <li>
              <span className="font-mono text-[#cd412b]">1</span>
              <span className="ml-2 text-[#efe6da]">Server seed</span> is
              generated and hashed with SHA-256 before the round starts.
            </li>
            <li>
              <span className="font-mono text-[#cd412b]">2</span>
              <span className="ml-2 text-[#efe6da]">Client seed</span> +{" "}
              <span className="text-[#efe6da]">nonce</span> are combined with
              the server seed after the round is locked.
            </li>
            <li>
              <span className="font-mono text-[#cd412b]">3</span>
              <span className="ml-2 text-[#efe6da]">Roll</span> = first 8 hex
              chars of{" "}
              <code className="text-[#f0a060]">
                SHA256(server:client:nonce)
              </code>{" "}
              mapped into [0, 1).
            </li>
            <li>
              <span className="font-mono text-[#cd412b]">4</span>
              After settle, the original server seed is published — hash must
              match the pre-round commitment.
            </li>
          </ol>
          <div className="rounded-sm border border-[rgba(205,65,43,0.45)] bg-black/35 px-3 py-3 text-xs leading-relaxed text-[#a89888]">
            Coinflip: creator wins if{" "}
            <code className="text-[#f0a060]">roll &lt; creatorStake / total</code>
            . Jackpot: the roll is the winning ticket on the value-weighted
            chance line.
          </div>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-sm border border-[rgba(255,255,255,0.08)] bg-black/40">
        <div className="flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] px-4 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7d70]">
            JavaScript — roll generation
          </p>
          <button
            type="button"
            onClick={() => void copySnippet()}
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f0a060] hover:text-[#efe6da]"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="overflow-x-auto px-4 py-4 font-mono text-[11px] leading-relaxed text-[#c4b5a5]">
          {snippet}
        </pre>
        <p className="border-t border-[rgba(255,255,255,0.06)] px-4 py-3 text-xs text-[#6b6258]">
          Settled coinflip IDs appear under Recent. Jackpot IDs show on the
          jackpot page after a spin.{" "}
          <Link href="/account" className="text-[#f0a060] hover:underline">
            Account history
          </Link>{" "}
          also lists game IDs.
        </p>
      </section>

      <section
        id="verify"
        className="mt-10 rounded-sm border border-[rgba(205,65,43,0.35)] bg-[rgba(18,14,10,0.92)] p-5"
      >
        <h2 className="font-display text-2xl tracking-wide text-[#efe6da]">
          Verify a round
        </h2>
        <p className="mt-1 text-sm text-[#a89888]">
          Enter a Game ID to retrieve the seed information for that round.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-[9rem_1fr_auto]">
          <label className="block text-[10px] uppercase tracking-[0.18em] text-[#8a7d70]">
            Game type
            <select
              value={gameType}
              onChange={(e) =>
                setGameType(e.target.value === "jackpot" ? "jackpot" : "coinflip")
              }
              className="mt-1.5 h-11 w-full rounded-sm border border-[rgba(205,65,43,0.35)] bg-black/50 px-3 text-sm text-[#efe6da] outline-none"
            >
              <option value="coinflip">Coinflip</option>
              <option value="jackpot">Jackpot</option>
            </select>
          </label>
          <label className="block text-[10px] uppercase tracking-[0.18em] text-[#8a7d70]">
            Game ID
            <input
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter Game ID…"
              className="mt-1.5 h-11 w-full rounded-sm border border-[rgba(205,65,43,0.35)] bg-black/50 px-3 font-mono text-sm text-[#efe6da] outline-none placeholder:text-[#6b6258]"
            />
          </label>
          <div className="flex items-end">
            <Button
              disabled={busy || !gameId.trim()}
              onClick={() => void verify()}
              className="h-11 w-full bg-[#cd412b] px-5 text-[#140c08] hover:bg-[#e25a3c] sm:w-auto"
            >
              {busy ? "Checking…" : "Verify round"}
            </Button>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-rose-400">{error}</p>
        )}

        {result && (
          <div className="mt-5 space-y-2 rounded-sm border border-[rgba(240,160,96,0.35)] bg-black/40 px-4 py-4 text-sm">
            <p
              className={cn(
                "font-semibold",
                result.hashMatches ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {result.hashMatches
                ? "Hash matches pre-round commitment"
                : "Hash mismatch — do not trust this reveal"}
            </p>
            <p className="text-[#a89888]">{result.explanation}</p>
            <dl className="mt-3 grid gap-2 font-mono text-[11px] sm:grid-cols-2">
              <div>
                <dt className="text-[#6b6258]">Roll</dt>
                <dd className="text-[#f0a060]">{result.roll.toFixed(8)}</dd>
              </div>
              <div>
                <dt className="text-[#6b6258]">Nonce</dt>
                <dd className="text-[#efe6da]">{result.nonce}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[#6b6258]">Client seed</dt>
                <dd className="break-all text-[#efe6da]">{result.clientSeed}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[#6b6258]">Server seed</dt>
                <dd className="break-all text-[#efe6da]">{result.serverSeed}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[#6b6258]">Server seed hash</dt>
                <dd className="break-all text-[#a89888]">
                  {result.serverSeedHash}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>
    </main>
  );
}
