import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const systemPrefersDark = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

// Single icon-only toggle: 🌙 Midnight Nebula <-> ☀️ Ivory Professional.
// Tracks the *resolved* theme (not just the stored "system"/"light"/"dark"
// value) so the icon stays correct if the person's OS theme changes while
// they're on "system", and flips straight to the opposite explicit theme
// on click — matches the "instant, no page reload" behavior in the spec.
const ThemeToggle = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = useState(() => (theme === "system" ? systemPrefersDark() : theme === "dark"));

  useEffect(() => {
    if (theme !== "system") {
      setIsDark(theme === "dark");
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setIsDark(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to Ivory Professional theme" : "Switch to Midnight Nebula theme"}
      title={isDark ? "Ivory Professional" : "Midnight Nebula"}
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground",
        className
      )}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" strokeWidth={2} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={2} />}
    </button>
  );
};

export default ThemeToggle;
