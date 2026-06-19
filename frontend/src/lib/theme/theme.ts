/**
 * Theme control (work order §12). System-aware by default, persisted. Dark mode is a pure token swap
 * — we toggle the `.dark` class on <html> and every component re-reads its CSS variables.
 */
export type Theme = "light" | "dark" | "system";

const KEY = "theme";

export function getStoredTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    if (t === "light" || t === "dark" || t === "system") return t;
  } catch {
    /* sandboxed */
  }
  return "system";
}

export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

export function resolveDark(theme: Theme): boolean {
  return theme === "dark" || (theme === "system" && systemPrefersDark());
}

/** Apply a theme to the document (defaults to the stored choice). Safe in jsdom/SSR. */
export function applyTheme(theme: Theme = getStoredTheme()): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveDark(theme));
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* quota / sandboxed */
  }
  applyTheme(theme);
}
