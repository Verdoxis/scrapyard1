"use client";

function play(src: string, volume = 0.7) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

export function playSelectSound() {
  play("/sounds/select.mp3", 0.7);
}

export function playCoinFlipSound() {
  play("/sounds/coinflip.mp3", 0.75);
}
