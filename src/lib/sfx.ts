"use client";

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function noiseBuffer(ac: AudioContext, seconds: number) {
  const len = Math.max(1, Math.floor(ac.sampleRate * seconds));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

type MetalKind = "plate" | "clank" | "thud" | "bolt" | "hatch";

const METAL_KINDS: MetalKind[] = ["plate", "clank", "thud", "bolt", "hatch"];

/** Low/mid band-passed noise — heavy metal body. */
function metalNoise(
  ac: AudioContext,
  now: number,
  {
    freq,
    q,
    dur,
    gain,
    start = 0,
  }: { freq: number; q: number; dur: number; gain: number; start?: number },
) {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, dur + 0.03);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(freq, now + start);
  bp.Q.setValueAtTime(q, now + start);
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(Math.max(600, freq * 1.8), now + start);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, now + start);
  g.gain.exponentialRampToValueAtTime(gain, now + start + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
  src.connect(bp);
  bp.connect(lp);
  lp.connect(g);
  g.connect(ac.destination);
  src.start(now + start);
  src.stop(now + start + dur + 0.03);
}

/** Deep metallic tap — muted plate / hatch. */
function metalTap(
  ac: AudioContext,
  now: number,
  {
    freq,
    endFreq,
    dur,
    gain,
    type = "triangle",
    start = 0,
  }: {
    freq: number;
    endFreq: number;
    dur: number;
    gain: number;
    type?: OscillatorType;
    start?: number;
  },
) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now + start);
  osc.frequency.exponentialRampToValueAtTime(
    Math.max(40, endFreq),
    now + start + dur,
  );
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(Math.min(2200, freq * 2.2), now + start);
  lp.frequency.exponentialRampToValueAtTime(500, now + start + dur);
  g.gain.setValueAtTime(0.0001, now + start);
  g.gain.exponentialRampToValueAtTime(gain, now + start + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
  osc.connect(lp);
  lp.connect(g);
  g.connect(ac.destination);
  osc.start(now + start);
  osc.stop(now + start + dur + 0.03);
}

function playMetalVariant(ac: AudioContext, kind: MetalKind) {
  const now = ac.currentTime;
  const jitter = rand(0.94, 1.06);

  switch (kind) {
    case "plate":
      metalTap(ac, now, {
        freq: 420 * jitter,
        endFreq: 140,
        dur: 0.09,
        gain: 0.07,
        type: "triangle",
      });
      metalNoise(ac, now, {
        freq: 680 * jitter,
        q: 3.5,
        dur: 0.07,
        gain: 0.05,
      });
      break;
    case "clank":
      metalTap(ac, now, {
        freq: 280 * jitter,
        endFreq: 95,
        dur: 0.1,
        gain: 0.075,
        type: "square",
      });
      metalNoise(ac, now, {
        freq: 520 * jitter,
        q: 2.8,
        dur: 0.085,
        gain: 0.055,
      });
      metalTap(ac, now, {
        freq: 560 * jitter,
        endFreq: 180,
        dur: 0.055,
        gain: 0.03,
        type: "triangle",
        start: 0.016,
      });
      break;
    case "thud":
      metalTap(ac, now, {
        freq: 160 * jitter,
        endFreq: 55,
        dur: 0.11,
        gain: 0.08,
        type: "sine",
      });
      metalNoise(ac, now, {
        freq: 380 * jitter,
        q: 2.2,
        dur: 0.09,
        gain: 0.05,
      });
      break;
    case "bolt":
      metalTap(ac, now, {
        freq: 360 * jitter,
        endFreq: 120,
        dur: 0.06,
        gain: 0.065,
        type: "triangle",
      });
      metalNoise(ac, now, {
        freq: 740 * jitter,
        q: 4,
        dur: 0.05,
        gain: 0.04,
      });
      metalTap(ac, now, {
        freq: 220 * jitter,
        endFreq: 80,
        dur: 0.07,
        gain: 0.035,
        type: "sine",
        start: 0.02,
      });
      break;
    case "hatch":
      metalNoise(ac, now, {
        freq: 450 * jitter,
        q: 1.8,
        dur: 0.1,
        gain: 0.06,
      });
      metalTap(ac, now, {
        freq: 240 * jitter,
        endFreq: 90,
        dur: 0.085,
        gain: 0.055,
        type: "triangle",
      });
      metalTap(ac, now, {
        freq: 480 * jitter,
        endFreq: 160,
        dur: 0.05,
        gain: 0.025,
        type: "sine",
        start: 0.022,
      });
      break;
  }
}

/** Deep metallic UI click — random low scrapyard hit each time. */
export function playClickSound() {
  const ac = ctx();
  if (!ac) return;
  const kind = METAL_KINDS[Math.floor(Math.random() * METAL_KINDS.length)]!;
  playMetalVariant(ac, kind);
}

/** Soft chime when the coin lands — no MP3. */
export function playCoinLandDing() {
  const ac = ctx();
  if (!ac) return;
  const now = ac.currentTime;

  const tone = (freq: number, start: number, dur: number, gain: number) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    const lp = ac.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + start);
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(1800, now + start);
    g.gain.setValueAtTime(0.0001, now + start);
    g.gain.exponentialRampToValueAtTime(gain, now + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
    osc.connect(lp);
    lp.connect(g);
    g.connect(ac.destination);
    osc.start(now + start);
    osc.stop(now + start + dur + 0.05);
  };

  tone(520, 0, 0.4, 0.11);
  tone(780, 0.05, 0.45, 0.07);
}

/** Alias used by inventory / legacy call sites. */
export function playSelectSound() {
  playClickSound();
}

/** @deprecated use playCoinLandDing at land time */
export function playCoinFlipSound() {}
