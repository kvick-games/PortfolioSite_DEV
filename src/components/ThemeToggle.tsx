import { useState } from "react";

type Theme = "light" | "dark";

/**
 * Applies a theme. Where the browser can, the new theme spreads out from the
 * toggle in a soft, grainy circle over the old one (styles.css); nothing on
 * the page moves. Otherwise the colours ease across.
 */
function switchTheme(theme: Theme, from: HTMLElement) {
  const root = document.documentElement;
  if (!document.startViewTransition) {
    root.classList.add("theme-fading");
    root.dataset.theme = theme;
    window.setTimeout(() => root.classList.remove("theme-fading"), 700);
    return;
  }
  const box = from.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const reach = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.style.setProperty("--theme-x", `${x}px`);
  root.style.setProperty("--theme-y", `${y}px`);
  root.style.setProperty("--theme-reach", `${reach + 240}px`);
  root.classList.add("theme-switch");
  const transition = document.startViewTransition(() => {
    root.dataset.theme = theme;
  });
  transition.finished.finally(() => root.classList.remove("theme-switch"));
}

/**
 * Switches between the dark (default) and light themes and remembers the
 * choice. index.html applies the saved theme before first paint.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={(event) => {
        try {
          localStorage.setItem("theme", next);
        } catch {
          // Private windows can block storage; the choice still applies to this visit.
        }
        setTheme(next);
        switchTheme(next, event.currentTarget);
      }}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 1.75a8.25 8.25 0 0 1 0 16.5z" fill="currentColor" />
      </svg>
    </button>
  );
}
