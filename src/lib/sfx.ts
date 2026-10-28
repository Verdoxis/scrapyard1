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

/** Soft UI click — short filtered noise tick. */
export function playClickSound() {
  const ac = ctx();
  if (!ac) return;
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  const g = ac.createGain();
  const filter = ac.createBiquadFilter();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(920, now);
  osc.frequency.exponentialRampToValueAtTime(380, now + 0.04);
  filter.type = "highpass";
  filter.frequency.setValueAtTime(400, now);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.07, now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
  osc.connect(filter);
  filter.connect(g);
  g.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.07);
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
