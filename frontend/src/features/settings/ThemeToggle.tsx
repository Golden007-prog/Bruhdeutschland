import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { getStoredTheme, setTheme, type Theme } from "@/lib/theme/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { key: Theme; label: string; icon: typeof Sun }[] = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
];

/** Light / Dark / System theme switch (token swap). Re-applies on OS change while in System mode. */
export function ThemeToggle() {
  const [theme, setT] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    if (theme !== "system" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setTheme("system");
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [theme]);

  const choose = (t: Theme) => {
    setT(t);
    setTheme(t);
  };

  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-md border bg-card p-1">
      {OPTIONS.map((o) => {
        const Icon = o.icon;
        const active = theme === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(o.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden /> {o.label}
          </button>
        );
      })}
    </div>
  );
}
