#!/usr/bin/env node
/**
 * Renders Scrapyard mark → static PNG + Discord Nitro looping GIF.
 * Discord Nitro avatars look best at 128–512px, looping, under ~1MB.
 */
import { mkdirSync, writeFileSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const OUT = "/opt/cursor/artifacts";
const TMP = "/tmp/scrapyard-logo-frames";
const SIZE = 256;
const FRAMES = 36; // full rotation — smooth at Discord's display size
const FPS = 18; // ~2s loop

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

function logoSvg({ rotationDeg = 0, pulse = 1, rustGlow = 0.9 } = {}) {
  // pulse: hub scale; rustGlow: scratch opacity
  const hubR = (15 * pulse).toFixed(2);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 128 128" fill="none">
  <defs>
    <linearGradient id="rust" x1="20" y1="10" x2="110" y2="120" gradientUnits="userSpaceOnUse">
      <stop stop-color="#e07030"/>
      <stop offset="0.45" stop-color="#c45c26"/>
      <stop offset="1" stop-color="#6b2e14"/>
    </linearGradient>
    <linearGradient id="steel" x1="24" y1="24" x2="96" y2="104" gradientUnits="userSpaceOnUse">
      <stop stop-color="#efe6da"/>
      <stop offset="1" stop-color="#8a7d70"/>
    </linearGradient>
    <radialGradient id="glow" cx="64" cy="64" r="52" gradientUnits="userSpaceOnUse">
      <stop stop-color="#c45c26" stop-opacity="${(0.22 * rustGlow).toFixed(3)}"/>
      <stop offset="0.55" stop-color="#c45c26" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#c45c26" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="64" cy="64" r="54" fill="url(#glow)"/>
  <g transform="rotate(${rotationDeg.toFixed(2)} 64 64)">
    <circle cx="64" cy="64" r="36" stroke="url(#steel)" stroke-width="7" fill="none"/>
    <circle cx="64" cy="64" r="${hubR}" fill="url(#rust)"/>
    <g stroke="url(#steel)" stroke-width="8" stroke-linecap="square">
      <path d="M64 18v14M64 96v14M18 64h14M96 64h14"/>
      <path d="M31 31l10 10M87 87l10 10M87 31l-10 10M31 87l10-10"/>
    </g>
    <path d="M78 28c-8 14-6 22 2 34-10 4-18 14-22 28" stroke="#f0a060" stroke-width="3.5" stroke-linecap="round" opacity="${rustGlow.toFixed(3)}"/>
  </g>
</svg>`;
}

// Static logo (clean, no glow) — SVG + PNG
const staticSvg = readFileSync("/workspace/public/logo.svg", "utf8");
writeFileSync(join(OUT, "scrapyard-logo.svg"), staticSvg);

await sharp(Buffer.from(logoSvg({ rotationDeg: 0, pulse: 1, rustGlow: 0.9 })), {
  density: 300,
})
  .resize(SIZE, SIZE)
  .png()
  .toFile(join(OUT, "scrapyard-logo.png"));

await sharp(Buffer.from(logoSvg({ rotationDeg: 0, pulse: 1, rustGlow: 0.9 })), {
  density: 300,
})
  .resize(512, 512)
  .png()
  .toFile(join(OUT, "scrapyard-logo-512.png"));

// Animated frames: gear rotates, hub + scratch breathe slightly
for (let i = 0; i < FRAMES; i++) {
  const t = i / FRAMES;
  const rot = t * 360;
  const pulse = 1 + 0.06 * Math.sin(t * Math.PI * 2);
  const rustGlow = 0.75 + 0.25 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 + 0.4));
  const buf = Buffer.from(logoSvg({ rotationDeg: rot, pulse, rustGlow }));
  await sharp(buf, { density: 220 })
    .resize(SIZE, SIZE)
    .png()
    .toFile(join(TMP, `frame-${String(i).padStart(3, "0")}.png`));
}

const gifPath = join(OUT, "scrapyard-logo-discord.gif");
const palette = join(TMP, "palette.png");

// High-quality palette GIF with transparency (Discord dark theme friendly)
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    join(TMP, "frame-%03d.png"),
    "-vf",
    "palettegen=reserve_transparent=1:stats_mode=diff",
    "-update",
    "1",
    "-frames:v",
    "1",
    palette,
  ],
  { stdio: "inherit" },
);

execFileSync(
  "ffmpeg",
  [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    join(TMP, "frame-%03d.png"),
    "-i",
    palette,
    "-lavfi",
    "paletteuse=dither=bayer:bayer_scale=3:alpha_threshold=128",
    "-loop",
    "0",
    gifPath,
  ],
  { stdio: "inherit" },
);

// Also a tighter 128px emoji-sized version for Nitro custom emoji
const gifEmoji = join(OUT, "scrapyard-logo-emoji.gif");
const tmp128 = join(TMP, "128");
mkdirSync(tmp128, { recursive: true });
for (let i = 0; i < FRAMES; i++) {
  await sharp(join(TMP, `frame-${String(i).padStart(3, "0")}.png`))
    .resize(128, 128)
    .png()
    .toFile(join(tmp128, `frame-${String(i).padStart(3, "0")}.png`));
}
const palette128 = join(tmp128, "palette.png");
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    join(tmp128, "frame-%03d.png"),
    "-vf",
    "palettegen=reserve_transparent=1:stats_mode=diff",
    "-update",
    "1",
    "-frames:v",
    "1",
    palette128,
  ],
  { stdio: "inherit" },
);
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    join(tmp128, "frame-%03d.png"),
    "-i",
    palette128,
    "-lavfi",
    "paletteuse=dither=bayer:bayer_scale=3:alpha_threshold=128",
    "-loop",
    "0",
    gifEmoji,
  ],
  { stdio: "inherit" },
);

rmSync(TMP, { recursive: true, force: true });

for (const f of [
  "scrapyard-logo.svg",
  "scrapyard-logo.png",
  "scrapyard-logo-512.png",
  "scrapyard-logo-discord.gif",
  "scrapyard-logo-emoji.gif",
]) {
  const p = join(OUT, f);
  const st = statSync(p);
  console.log(`${f}\t${(st.size / 1024).toFixed(1)} KB`);
}
