"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { cruiseProgress } from "@/lib/spin-motion";

export type CoinSide = "red" | "black";

/** Accel → readable cruise → soft land. */
const FLIP_MS = 6200;

function faceGradient(side: CoinSide) {
  return side === "red"
    ? "radial-gradient(circle at 32% 28%, #ff7a5c 0%, #e85a45 22%, #9b1c12 58%, #3a0808 100%)"
    : "radial-gradient(circle at 32% 28%, #6a6a6a 0%, #3a3a3a 28%, #161616 62%, #050505 100%)";
}

function faceShadow(side: CoinSide) {
  return side === "red"
    ? "inset 0 0 0 2px rgba(255,200,160,0.35), inset 0 -10px 18px rgba(60,0,0,0.45), inset 0 8px 14px rgba(255,180,140,0.18), 0 10px 22px rgba(120,15,8,0.55)"
    : "inset 0 0 0 2px rgba(220,220,220,0.28), inset 0 -10px 18px rgba(0,0,0,0.65), inset 0 8px 14px rgba(255,255,255,0.08), 0 10px 22px rgba(0,0,0,0.65)";
}

/** Build alternating faces that end on `land`. */
function faceSequence(start: CoinSide, land: CoinSide, steps: number): CoinSide[] {
  const seq: CoinSide[] = new Array(steps);
  seq[steps - 1] = land;
  for (let i = steps - 2; i >= 0; i--) {
    seq[i] = seq[i + 1] === "red" ? "black" : "red";
  }
  if (seq[0] !== start) {
    return [start, ...seq];
  }
  return seq;
}

function CoinFace({
  side,
  edgeOn,
  hidden,
}: {
  side: CoinSide;
  edgeOn?: boolean;
  hidden?: boolean;
}) {
  const isRed = side === "red";
  if (edgeOn) {
    return (
      <div
        className="absolute inset-0 rounded-full"
        style={{
          display: hidden ? "none" : "block",
          background: isRed
            ? "linear-gradient(90deg, #2a0604 0%, #8b1a12 18%, #e85a45 50%, #8b1a12 82%, #2a0604 100%)"
            : "linear-gradient(90deg, #000 0%, #2a2a2a 18%, #888 50%, #2a2a2a 82%, #000 100%)",
          boxShadow: "0 8px 18px rgba(0,0,0,0.5)",
        }}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-full"
      style={{
        display: hidden ? "none" : "block",
        background: faceGradient(side),
        boxShadow: faceShadow(side),
      }}
    >
      <span
        className="pointer-events-none absolute inset-[5%] rounded-full border"
        style={{
          borderColor: isRed
            ? "rgba(255,170,130,0.45)"
            : "rgba(230,230,230,0.28)",
          boxShadow: isRed
            ? "inset 0 0 0 1px rgba(80,10,5,0.5)"
            : "inset 0 0 0 1px rgba(0,0,0,0.55)",
        }}
      />
      <span
        className="pointer-events-none absolute inset-[18%] rounded-full border"
        style={{
          borderColor: isRed
            ? "rgba(255,140,100,0.28)"
            : "rgba(200,200,200,0.16)",
        }}
      />
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: isRed
            ? "radial-gradient(circle at 35% 30%, #ff8a6a, #7a120c 70%)"
            : "radial-gradient(circle at 35% 30%, #555, #0c0c0c 70%)",
          boxShadow: isRed
            ? "inset 0 1px 2px rgba(255,200,160,0.4), 0 0 0 1px rgba(255,160,120,0.25)"
            : "inset 0 1px 2px rgba(255,255,255,0.15), 0 0 0 1px rgba(180,180,180,0.2)",
        }}
      />
      <span
        className="pointer-events-none absolute left-[18%] top-[14%] h-[22%] w-[38%] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.55), transparent 70%)",
        }}
      />
    </div>
  );
}

export function RustCoin({
  side,
  selected,
  size = "md",
  spinning,
  landSide,
  onLand,
}: {
  side: CoinSide;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  spinning?: boolean;
  landSide?: CoinSide;
  onLand?: () => void;
}) {
  const dim =
    size === "lg" ? "h-28 w-28" : size === "sm" ? "h-12 w-12" : "h-20 w-20";

  const liftRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const redRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const edgeRef = useRef<HTMLDivElement>(null);
  const landedRef = useRef(false);
  const onLandRef = useRef(onLand);
  onLandRef.current = onLand;

  function showFace(face: CoinSide | "edge") {
    if (redRef.current) redRef.current.style.display = face === "red" ? "block" : "none";
    if (blackRef.current)
      blackRef.current.style.display = face === "black" ? "block" : "none";
    if (edgeRef.current)
      edgeRef.current.style.display = face === "edge" ? "block" : "none";
  }

  // Keep static face in sync when not spinning
  useEffect(() => {
    if (spinning && landSide) return;
    const face = landSide ?? side;
    showFace(face);
    if (liftRef.current) liftRef.current.style.transform = "translate3d(0,0,0)";
    if (scaleRef.current) scaleRef.current.style.transform = "scaleX(1)";
    landedRef.current = false;
  }, [spinning, landSide, side]);

  useEffect(() => {
    if (!spinning || !landSide) return;

    landedRef.current = false;
    // Enough half-turns that cruise speed stays easy to read
    const seq = faceSequence(side, landSide, 19);
    const start = performance.now();
    let raf = 0;
    let lastFace: CoinSide | "edge" | null = null;

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / FLIP_MS);
      const p = cruiseProgress(t);
      const seg = p * (seq.length - 1);
      const i = Math.min(seq.length - 2, Math.floor(seg));
      const local = seg - i;
      const squash = Math.sin(local * Math.PI);
      const sx = Math.max(0.07, 1 - squash * 0.93);
      const face: CoinSide = local < 0.5 ? seq[i] : seq[i + 1];
      const show: CoinSide | "edge" = sx < 0.22 ? "edge" : face;

      if (scaleRef.current) {
        scaleRef.current.style.transform = `scaleX(${sx})`;
      }
      if (liftRef.current) {
        const lift = Math.sin(p * Math.PI) * -26;
        liftRef.current.style.transform = `translate3d(0,${lift}px,0)`;
      }
      if (show !== lastFace) {
        lastFace = show;
        showFace(show);
      }

      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        if (scaleRef.current) scaleRef.current.style.transform = "scaleX(1)";
        if (liftRef.current)
          liftRef.current.style.transform = "translate3d(0,0,0)";
        showFace(landSide);
        if (!landedRef.current) {
          landedRef.current = true;
          onLandRef.current?.();
        }
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [spinning, landSide, side]);

  const initial = landSide ?? side;

  return (
    <div
      ref={liftRef}
      className={cn(
        "relative flex items-center justify-center will-change-transform",
        dim,
        selected &&
          "rounded-full ring-2 ring-[#f0a060] ring-offset-2 ring-offset-[#0a0806]",
      )}
      aria-label={initial === "red" ? "Red" : "Black"}
      style={{ transform: "translate3d(0,0,0)" }}
    >
      <div
        ref={scaleRef}
        className="relative h-full w-full will-change-transform"
        style={{ transform: "scaleX(1)" }}
      >
        <div ref={redRef} className="absolute inset-0" style={{ display: initial === "red" ? "block" : "none" }}>
          <CoinFace side="red" />
        </div>
        <div
          ref={blackRef}
          className="absolute inset-0"
          style={{ display: initial === "black" ? "block" : "none" }}
        >
          <CoinFace side="black" />
        </div>
        <div ref={edgeRef} className="absolute inset-0" style={{ display: "none" }}>
          <CoinFace side={initial} edgeOn />
        </div>
      </div>
    </div>
  );
}

export const COIN_FLIP_DURATION_MS = FLIP_MS;
