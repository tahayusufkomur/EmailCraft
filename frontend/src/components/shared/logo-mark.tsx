import { cn } from "../../lib/utils";

interface MarkProps {
  size?: number;
  className?: string;
}

/**
 * MailCraft brand mark — matches Contentor's rounded-square glyph geometry.
 * Uses `currentColor` for the tile and `var(--background)` for the cutout so
 * it adapts to light, dark, and inverted surfaces automatically.
 */
export function Mark({ size = 28, className }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 text-foreground", className)}
    >
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <rect
        x="7"
        y="9.5"
        width="18"
        height="13"
        rx="2"
        stroke="var(--background)"
        strokeWidth="2.4"
      />
      <path
        d="M8 10.5L16 16.5L24 10.5"
        stroke="var(--background)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface WordmarkProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { mark: 22, text: "text-[15px]", gap: "gap-2" },
  md: { mark: 26, text: "text-[17px]", gap: "gap-2.5" },
  lg: { mark: 32, text: "text-[20px]", gap: "gap-2.5" },
} as const;

export function Wordmark({ size = "md", className }: WordmarkProps) {
  const s = sizes[size];
  return (
    <span className={cn("inline-flex items-center", s.gap, className)}>
      <Mark size={s.mark} />
      <span
        className={cn(
          "font-semibold tracking-[-0.025em] text-foreground select-none",
          s.text,
        )}
      >
        MailCraft
      </span>
    </span>
  );
}

export function Monogram({ size = "md", className }: WordmarkProps) {
  const s = sizes[size];
  return (
    <span className={cn("inline-flex items-center", s.gap, className)}>
      <Mark size={s.mark} />
      <span
        className={cn(
          "font-mono font-semibold tracking-[-0.04em] text-foreground select-none",
          s.text,
        )}
      >
        MC
      </span>
    </span>
  );
}
