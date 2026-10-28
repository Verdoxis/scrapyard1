import { cn } from "@/lib/utils";

export function ScrapyardLogo({
  className,
  markClassName,
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt="Scrapyard"
        className={cn("h-9 w-9 shrink-0 drop-shadow-[0_0_12px_rgba(196,92,38,0.45)]", markClassName)}
      />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-2xl tracking-[0.14em] text-[#f3ebe2] sm:text-3xl">
            SCRAPYARD
          </span>
          <span className="hidden text-[9px] uppercase tracking-[0.32em] text-[#c45c26] sm:block">
            Rust skin arena
          </span>
        </span>
      )}
    </span>
  );
}
