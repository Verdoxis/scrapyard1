"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { cruiseProgress } from "@/lib/spin-motion";

export interface SpinnerDeposit {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  value: number;
}

const PX_PER_PERCENT = 14;
const MIN_SEG_PX = 72;
const CYCLES = 12;
const LAND_CYCLE = 9;

const PLAYER_COLORS = [
  "#cd412b",
  "#c45c26",
  "#d4a017",
  "#5a9e6a",
  "#4a90c8",
  "#9b59c6",
  "#e85a45",
  "#8a7d70",
];

function colorFor(userId: string) {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h + userId.charCodeAt(i) * 17) % 997;
  return PLAYER_COLORS[h % PLAYER_COLORS.length];
}

function segmentWidth(pct: number) {
  return Math.max(MIN_SEG_PX, pct * 100 * PX_PER_PERCENT);
}

function buildSegments(deposits: SpinnerDeposit[], total: number) {
  return deposits.map((d) => {
    const pct = total > 0 ? d.value / total : 0;
    return {
      ...d,
      pct,
      width: segmentWidth(pct),
      color: colorFor(d.userId),
    };
  });
}

function ticketOffset(
  segments: ReturnType<typeof buildSegments>,
  ticket: number,
) {
  let cursor = 0;
  for (const seg of segments) {
    const next = cursor + seg.pct;
    if (ticket <= next || seg === segments[segments.length - 1]) {
      const local = seg.pct > 0 ? (ticket - cursor) / seg.pct : 0.5;
      const clamped = Math.min(0.88, Math.max(0.12, local));
      let start = 0;
      for (const s of segments) {
        if (s === seg) break;
        start += s.width;
      }
      return start + clamped * seg.width;
    }
    cursor = next;
  }
  return 0;
}

type Seg = ReturnType<typeof buildSegments>[number];

const StripCells = memo(function StripCells({
  strip,
  winnerId,
  showWinner,
}: {
  strip: Array<Seg & { key: string }>;
  winnerId?: string;
  showWinner: boolean;
}) {
  return (
    <>
      {strip.map((seg) => {
        const isWinner = showWinner && seg.userId === winnerId;
        return (
          <div
            key={seg.key}
            className="relative flex shrink-0 flex-col items-center justify-center gap-1.5 border-r border-black/40 px-2"
            style={{
              width: seg.width,
              background: `linear-gradient(180deg, ${seg.color}33 0%, rgba(12,9,7,0.92) 70%)`,
              boxShadow: isWinner
                ? `inset 0 0 0 2px ${seg.color}`
                : `inset 0 -3px 0 ${seg.color}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={seg.avatarUrl || "/logo.svg"}
              alt=""
              decoding="async"
              draggable={false}
              className="h-12 w-12 rounded-sm border object-cover"
              style={{ borderColor: `${seg.color}99` }}
            />
            <p className="max-w-full truncate px-1 text-[11px] font-semibold text-[#efe6da]">
              {seg.displayName}
            </p>
            <p className="font-mono text-[10px] text-[#f0a060]">
              {(seg.pct * 100).toFixed(1)}%
            </p>
          </div>
        );
      })}
    </>
  );
});

export function JackpotSpinner({
  deposits,
  totalValue,
  status,
  winningTicket,
  winnerId,
  spinEndsAt,
  className,
}: {
  deposits: SpinnerDeposit[];
  totalValue: number;
  status: string;
  winningTicket?: number;
  winnerId?: string;
  spinEndsAt?: number;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState(640);
  const offsetRef = useRef(0);
  const rafRef = useRef(0);
  const spunFor = useRef<string | null>(null);
  const modeRef = useRef<"idle" | "spin" | "hold">("idle");
  /** Freeze layout for the duration of a spin so polling can't reshape the strip. */
  const frozenRef = useRef<{
    key: string;
    segments: Seg[];
    cycleWidth: number;
  } | null>(null);

  const liveSegments = useMemo(
    () => buildSegments(deposits, totalValue),
    [deposits, totalValue],
  );

  const spinKey =
    status === "spinning" && winningTicket != null
      ? `${winnerId}-${winningTicket}-${spinEndsAt}`
      : null;

  // Capture strip geometry once when a spin starts
  if (spinKey && frozenRef.current?.key !== spinKey) {
    frozenRef.current = {
      key: spinKey,
      segments: liveSegments,
      cycleWidth: liveSegments.reduce((s, seg) => s + seg.width, 0) || 1,
    };
  }
  if (status !== "spinning" && status !== "settled") {
    frozenRef.current = null;
    if (modeRef.current !== "spin") spunFor.current = null;
  }

  const segments =
    (status === "spinning" || status === "settled") && frozenRef.current
      ? frozenRef.current.segments
      : liveSegments;
  const cycleWidth =
    (status === "spinning" || status === "settled") && frozenRef.current
      ? frozenRef.current.cycleWidth
      : segments.reduce((s, seg) => s + seg.width, 0) || 1;

  const strip = useMemo(() => {
    const out: Array<Seg & { key: string }> = [];
    for (let c = 0; c < CYCLES; c++) {
      for (const seg of segments) {
        out.push({ ...seg, key: `${c}-${seg.userId}-${seg.value}` });
      }
    }
    return out;
  }, [segments]);

  function applyX(x: number) {
    offsetRef.current = x;
    if (stripRef.current) {
      stripRef.current.style.transform = `translate3d(${x}px,0,0)`;
    }
  }

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const sync = () => setViewport(el.clientWidth);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (segments.length === 0) {
      cancelAnimationFrame(rafRef.current);
      applyX(0);
      modeRef.current = "idle";
      return;
    }

    const spinning = status === "spinning" && winningTicket != null && spinKey;
    const settled = status === "settled" && winningTicket != null;

    // Already animating this spin — don't tear it down on poll re-renders
    if (spinning && spunFor.current === spinKey && modeRef.current === "spin") {
      return;
    }

    cancelAnimationFrame(rafRef.current);

    if (spinning && spunFor.current !== spinKey) {
      spunFor.current = spinKey;
      modeRef.current = "spin";
      const targetInCycle = ticketOffset(segments, winningTicket!);
      const absolute = LAND_CYCLE * cycleWidth + targetInCycle;
      const endX = viewport / 2 - absolute;
      // Roll across several cycles before landing
      const startX = viewport / 2 - (1.2 * cycleWidth + targetInCycle);
      applyX(startX);

      const remaining = (spinEndsAt ?? Date.now() + 8000) - Date.now();
      const duration = Math.max(5200, Math.min(9000, remaining));
      const t0 = performance.now();

      const tick = (now: number) => {
        if (modeRef.current !== "spin") return;
        const t = Math.min(1, (now - t0) / duration);
        // Accel → readable cruise → soft land (same profile as coinflip)
        const e = cruiseProgress(t, 0.14, 0.55);
        applyX(startX + (endX - startX) * e);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          modeRef.current = "hold";
          applyX(endX);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        // Only cancel if we're leaving this spin entirely
        if (modeRef.current === "spin") {
          /* keep going — cleanup on dep change is handled by spunFor guard */
        }
      };
    }

    if (settled || modeRef.current === "hold") {
      modeRef.current = "hold";
      const targetInCycle = ticketOffset(segments, winningTicket ?? 0.5);
      const absolute = LAND_CYCLE * cycleWidth + targetInCycle;
      applyX(viewport / 2 - absolute);
      return;
    }

    // Idle crawl
    modeRef.current = "idle";
    spunFor.current = null;
    let last = performance.now();
    const speed = Math.max(22, cycleWidth / 28);

    const tick = (now: number) => {
      if (modeRef.current !== "idle") return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let x = offsetRef.current - speed * dt;
      while (x <= -cycleWidth) x += cycleWidth;
      while (x > 0) x -= cycleWidth;
      applyX(x);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [
    status,
    winningTicket,
    winnerId,
    spinEndsAt,
    spinKey,
    segments,
    cycleWidth,
    viewport,
  ]);

  if (deposits.length === 0) {
    return (
      <div
        className={cn(
          "rounded-sm border border-dashed border-[rgba(196,92,38,0.3)] px-4 py-10 text-center text-sm text-[#a89a8c]",
          className,
        )}
      >
        Spinner waits for deposits — bigger stake, bigger slice of the line.
      </div>
    );
  }

  const winner = deposits.find((d) => d.userId === winnerId);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
            Chance line
          </p>
          <p className="text-sm text-[#a89a8c]">
            {status === "spinning"
              ? "Rolling through the line…"
              : status === "settled"
                ? `Landed on ${winner?.displayName ?? "winner"}`
                : "Your slice width = your win chance"}
          </p>
        </div>
        {(status === "spinning" || status === "settled") && winner && (
          <p className="font-display text-lg tracking-wide text-[#f0a060]">
            {winner.displayName}
          </p>
        )}
      </div>

      <div
        ref={trackRef}
        className="relative overflow-hidden rounded-sm border border-[rgba(196,92,38,0.4)] bg-[rgba(8,6,5,0.95)]"
        style={{
          boxShadow:
            "inset 0 0 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(240,160,96,0.08)",
        }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-0.5 -translate-x-1/2 bg-[#f0a060]">
          <div className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-x-[8px] border-b-[12px] border-x-transparent border-b-[#f0a060]" />
          <div className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[8px] border-t-[12px] border-x-transparent border-t-[#f0a060]" />
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[rgba(8,6,5,0.95)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[rgba(8,6,5,0.95)] to-transparent" />

        <div
          ref={stripRef}
          className="flex h-[118px] w-max items-stretch will-change-transform"
          style={{
            transform: "translate3d(0,0,0)",
            transition: "none",
            contain: "layout style paint",
          }}
        >
          <StripCells
            strip={strip}
            winnerId={winnerId}
            showWinner={status === "settled"}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {segments.map((seg) => (
          <div
            key={seg.userId}
            className="flex items-center gap-2 rounded-sm border border-[rgba(255,255,255,0.06)] bg-black/25 px-2 py-1"
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: seg.color }}
            />
            <span className="text-xs text-[#efe6da]">{seg.displayName}</span>
            <span className="font-mono text-[10px] text-[#f0a060]">
              {(seg.pct * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
