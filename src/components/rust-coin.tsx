"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type CoinSide = "red" | "black";

const FLIP_MS = 3200;

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

function CoinFace({ side, edgeOn }: { side: CoinSide; edgeOn: boolean }) {
  const isRed = side === "red";
  if (edgeOn) {
    return (
      <div
        className="h-full w-full rounded-full"
        style={{
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
      className="relative h-full w-full overflow-hidden rounded-full"
      style={{
        background: faceGradient(side),
        boxShadow: faceShadow(side),
      }}
    >
      {/* Outer rim */}
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
      {/* Inner ring */}
      <span
        className="pointer-events-none absolute inset-[18%] rounded-full border"
        style={{
          borderColor: isRed
            ? "rgba(255,140,100,0.28)"
            : "rgba(200,200,200,0.16)",
        }}
      />
      {/* Center disc */}
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
      {/* Specular highlight */}
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
        selected &&
          "rounded-full ring-2 ring-[#f0a060] ring-offset-2 ring-offset-[#0a0806]",
      )}
      aria-label={face === "red" ? "Red" : "Black"}
      style={{ transform: `translateY(${lift}px)` }}
    >
      <div
        className="h-full w-full"
        style={{ transform: `scaleX(${scaleX})` }}
      >
        <CoinFace side={face} edgeOn={edgeOn} />
      </div>
    </div>
  );
}

export const COIN_FLIP_DURATION_MS = FLIP_MS;
