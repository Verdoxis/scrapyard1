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

type MetalKind = "tin" | "clank" | "scrap" | "ping" | "rivet";

const METAL_KINDS: MetalKind[] = ["tin", "clank", "scrap", "ping", "rivet"];

/** Burst of band-passed noise — the “metal body” of a hit. */
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
  src.buffer = noiseBuffer(ac, dur + 0.02);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(freq, now + start);
  bp.Q.setValueAtTime(q, now + start);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, now + start);
  g.gain.exponentialRampToValueAtTime(gain, now + start + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(ac.destination);
  src.start(now + start);
  src.stop(now + start + dur + 0.02);
}

/** Short bright oscillator tap — rivet / tin edge. */
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
  const hp = ac.createBiquadFilter();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now + start);
  osc.frequency.exponentialRampToValueAtTime(
    Math.max(40, endFreq),
    now + start + dur,
  );
  hp.type = "highpass";
  hp.frequency.setValueAtTime(300, now + start);
  g.gain.setValueAtTime(0.0001, now + start);
  g.gain.exponentialRampToValueAtTime(gain, now + start + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
  osc.connect(hp);
  hp.connect(g);
  g.connect(ac.destination);
  osc.start(now + start);
  osc.stop(now + start + dur + 0.02);
}

function playMetalVariant(ac: AudioContext, kind: MetalKind) {
  const now = ac.currentTime;
  const jitter = rand(0.92, 1.08);

  switch (kind) {
    case "tin":
      metalTap(ac, now, {
        freq: 2400 * jitter,
        endFreq: 900,
        dur: 0.045,
        gain: 0.055,
        type: "triangle",
      });
      metalNoise(ac, now, {
        freq: 3200 * jitter,
        q: 8,
        dur: 0.035,
        gain: 0.04,
      });
      break;
    case "clank":
      metalTap(ac, now, {
        freq: 780 * jitter,
        endFreq: 220,
        dur: 0.07,
        gain: 0.06,
        type: "square",
      });
      metalNoise(ac, now, {
        freq: 1400 * jitter,
        q: 4,
        dur: 0.06,
        gain: 0.05,
      });
      metalTap(ac, now, {
        freq: 1600 * jitter,
        endFreq: 600,
        dur: 0.04,
        gain: 0.03,
        type: "triangle",
        start: 0.012,
      });
      break;
    case "scrap":
      metalNoise(ac, now, {
        freq: 2100 * jitter,
        q: 2.5,
        dur: 0.08,
        gain: 0.055,
      });
      metalNoise(ac, now, {
        freq: 4800 * jitter,
        q: 6,
        dur: 0.04,
        gain: 0.03,
        start: 0.01,
      });
      metalTap(ac, now, {
        freq: 1100 * jitter,
        endFreq: 400,
        dur: 0.05,
        gain: 0.025,
        type: "sawtooth",
      });
      break;
    case "ping":
      metalTap(ac, now, {
        freq: 3100 * jitter,
        endFreq: 1800,
        dur: 0.09,
        gain: 0.045,
        type: "sine",
      });
      metalTap(ac, now, {
        freq: 4650 * jitter,
        endFreq: 2200,
        dur: 0.06,
        gain: 0.028,
        type: "triangle",
        start: 0.004,
      });
      break;
    case "rivet":
      metalTap(ac, now, {
        freq: 1350 * jitter,
        endFreq: 500,
        dur: 0.035,
        gain: 0.06,
        type: "square",
      });
      metalNoise(ac, now, {
        freq: 2600 * jitter,
        q: 10,
        dur: 0.028,
        gain: 0.045,
      });
      metalTap(ac, now, {
        freq: 900 * jitter,
        endFreq: 280,
        dur: 0.05,
        gain: 0.03,
        type: "triangle",
        start: 0.018,
      });
      break;
  }
}

/** Soft metallic UI click — random variant each time. */
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
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + start);
    g.gain.setValueAtTime(0.0001, now + start);
    g.gain.exponentialRampToValueAtTime(gain, now + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(now + start);
    osc.stop(now + start + dur + 0.05);
  };

  tone(880, 0, 0.35, 0.12);
  tone(1320, 0.04, 0.45, 0.08);
}

/** Alias used by inventory / legacy call sites. */
export function playSelectSound() {
  playClickSound();
}

/** @deprecated use playCoinLandDing at land time */
export function playCoinFlipSound() {}
