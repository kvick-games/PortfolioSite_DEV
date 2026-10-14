import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const darkQuery = "(prefers-color-scheme: dark)";

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem("theme");
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

/**
 * Switches between the light and dark themes. Until the visitor picks one, the
 * site follows the system setting (index.html applies it before first paint).
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    const media = window.matchMedia(darkQuery);
    const follow = () => {
      if (savedTheme()) return;
      const next: Theme = media.matches ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("theme", next);
        } catch {
          // Private windows can block storage; the choice still applies to this visit.
        }
        setTheme(next);
      }}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 1.75a8.25 8.25 0 0 1 0 16.5z" fill="currentColor" />
      </svg>
    </button>
  );
}
