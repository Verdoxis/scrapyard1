"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type CoinSide = "red" | "black";

const FLIP_MS = 3200;

function faceGradient(side: CoinSide) {
  return side === "red"
    ? "radial-gradient(circle at 35% 30%, #e85a45, #8b1a12 55%, #3a0808)"
    : "radial-gradient(circle at 35% 30%, #4a4a4a, #141414 55%, #050505)";
}

function faceShadow(side: CoinSide) {
  return side === "red"
    ? "inset 0 0 0 3px rgba(255,180,140,0.28), 0 8px 20px rgba(140,20,10,0.45)"
    : "inset 0 0 0 3px rgba(200,200,200,0.22), 0 8px 20px rgba(0,0,0,0.55)";
}

/** Build alternating faces that end on `land`. */
function faceSequence(start: CoinSide, land: CoinSide, steps: number): CoinSide[] {
  const seq: CoinSide[] = new Array(steps);
  seq[steps - 1] = land;
  for (let i = steps - 2; i >= 0; i--) {
    seq[i] = seq[i + 1] === "red" ? "black" : "red";
  }
  // Prefer starting on `start` when possible by adding one step
  if (seq[0] !== start) {
    return [start, ...seq];
  }
  return seq;
}

export function RustCoin({
  side,
  selected,
  size = "md",
  spinning,
  landSide,
}: {
  side: CoinSide;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  spinning?: boolean;
  landSide?: CoinSide;
}) {
  const dim =
    size === "lg" ? "h-28 w-28" : size === "sm" ? "h-12 w-12" : "h-20 w-20";

  const [face, setFace] = useState<CoinSide>(landSide ?? side);
  const [scaleX, setScaleX] = useState(1);
  const [lift, setLift] = useState(0);

  useEffect(() => {
    if (!spinning || !landSide) {
      setFace(landSide ?? side);
      setScaleX(1);
      setLift(0);
      return;
    }

    const seq = faceSequence(side, landSide, 13);
    const start = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / FLIP_MS);
      // Slow into the landing
      const e = 1 - Math.pow(1 - t, 2.6);
      const seg = e * (seq.length - 1);
      const i = Math.min(seq.length - 2, Math.floor(seg));
      const local = seg - i;

      if (local < 0.5) {
        setFace(seq[i]);
        setScaleX(Math.max(0.06, 1 - local * 2));
      } else {
        setFace(seq[i + 1]);
        setScaleX(Math.max(0.06, (local - 0.5) * 2));
      }
      // Arc up then down
      setLift(Math.sin(t * Math.PI) * -22);

      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        setFace(landSide);
        setScaleX(1);
        setLift(0);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [spinning, landSide, side]);

  const edgeOn = scaleX < 0.2;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        dim,
        selected && "rounded-full ring-2 ring-[#f0a060] ring-offset-2 ring-offset-[#0a0806]",
      )}
      aria-label={face === "red" ? "Red" : "Black"}
      style={{ transform: `translateY(${lift}px)` }}
    >
      <div
        className="h-full w-full rounded-full"
        style={{
          transform: `scaleX(${scaleX})`,
          background: edgeOn
            ? face === "red"
              ? "linear-gradient(90deg, #5a1008, #e85a45, #5a1008)"
              : "linear-gradient(90deg, #050505, #666, #050505)"
            : faceGradient(face),
          boxShadow: faceShadow(face),
          transition: spinning ? undefined : "background 0.15s linear",
        }}
      >
        {!edgeOn && (
          <span
            className="pointer-events-none absolute inset-2 rounded-full border"
            style={{
              borderColor:
                face === "red"
                  ? "rgba(255,120,80,0.35)"
                  : "rgba(255,255,255,0.14)",
            }}
          />
        )}
      </div>
    </div>
  );
}

export const COIN_FLIP_DURATION_MS = FLIP_MS;
