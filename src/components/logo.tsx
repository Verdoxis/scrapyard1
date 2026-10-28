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
    <span className={cn("inline-flex items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt="Scrapyard"
        className={cn("h-14 w-14 shrink-0 sm:h-16 sm:w-16", markClassName)}
      />
      {showWordmark && (
        <span className="font-display text-3xl tracking-[0.14em] text-[#f3ebe2] sm:text-[2.65rem] sm:leading-none">
          SCRAPYARD
        </span>
      )}
    </span>
  );
}
