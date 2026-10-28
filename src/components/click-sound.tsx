"use client";

import { useEffect } from "react";
import { playClickSound } from "@/lib/sfx";

const SELECTOR =
  'button, a, [role="button"], input[type="checkbox"], input[type="radio"], input[type="submit"], summary, select, label[for]';

/** Plays a soft click on interactive taps site-wide. */
export function ClickSoundHost() {
  useEffect(() => {
    const onPointer = (e: Event) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const el = t.closest(SELECTOR);
      if (!el) return;
      if (el.hasAttribute("data-no-click-sound")) return;
      if (el instanceof HTMLButtonElement && el.disabled) return;
      if (el instanceof HTMLInputElement && el.disabled) return;
      playClickSound();
    };

    // capture so we hear clicks even when handlers stopPropagation
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, []);

  return null;
}
