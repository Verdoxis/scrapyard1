"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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

export default function FairPage() {
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div>
        <h1 className="font-display text-4xl tracking-wide text-[#efe6da] sm:text-5xl">
          Provably Fair
        </h1>
        <p className="mt-2 max-w-lg text-sm text-[#a89888]">
          Every round outcome can be independently verified by anyone.
        </p>
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
          After a round settles, the server seed is revealed alongside the
          client seed and nonce so you can run this snippet yourself.{" "}
          <Link href="/account" className="text-[#f0a060] hover:underline">
            Account history
          </Link>{" "}
          lists recent games.
        </p>
      </section>
    </main>
  );
}
