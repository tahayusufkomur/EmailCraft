import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { cn } from "../../lib/utils";

const cycle = ["light", "dark", "system"] as const;
const labels: Record<string, string> = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System theme",
};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const current = theme ?? "system";
  const nextIndex = (cycle.indexOf(current as (typeof cycle)[number]) + 1) % cycle.length;
  const next = cycle[nextIndex];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={cn(
        "rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
        className,
      )}
      aria-label={labels[current] ?? "Toggle theme"}
      title={`${labels[current]} — click for ${labels[next]?.toLowerCase()}`}
    >
      {current === "light" && <Sun className="h-4 w-4" />}
      {current === "dark" && <Moon className="h-4 w-4" />}
      {current === "system" && <Monitor className="h-4 w-4" />}
    </button>
  );
}
