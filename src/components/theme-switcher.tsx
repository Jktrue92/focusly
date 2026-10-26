"use client";
import { useEffect, useSyncExternalStore } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
type Theme = "light" | "dark" | "system";
const key = "focusly-theme";
let fallback: Theme = "system";
function preference(): Theme {
  try {
    const value = localStorage.getItem(key);
    return value === "light" || value === "dark" || value === "system"
      ? value
      : fallback;
  } catch {
    return fallback;
  }
}
function applyTheme() {
  const theme = preference();
  const dark =
    theme === "dark" ||
    (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("focusly-theme-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("focusly-theme-change", callback);
  };
}
function choose(value: Theme) {
  fallback = value;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Preference still works for this session when storage is unavailable. */
  }
  applyTheme();
  window.dispatchEvent(new Event("focusly-theme-change"));
}
export function ThemeSwitcher() {
  const theme = useSyncExternalStore(subscribe, preference, () => "system");
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => applyTheme();
    applyTheme();
    media.addEventListener("change", update);
    window.addEventListener("storage", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return (
    <fieldset className="theme-switcher" aria-label="Color theme">
      <legend className="sr-only">Color theme</legend>
      {[
        { value: "light", label: "Light theme", Icon: Sun },
        { value: "dark", label: "Dark theme", Icon: Moon },
        { value: "system", label: "Use system theme", Icon: Monitor },
      ].map(({ value, label, Icon }) => (
        <button
          type="button"
          key={value}
          title={label}
          aria-label={label}
          aria-pressed={theme === value}
          onClick={() => choose(value as Theme)}
        >
          <Icon size={16} />
        </button>
      ))}
    </fieldset>
  );
}
