// Smart Solar Microgrid Trading System - Theme Toggle Component
import { useState, useRef, useEffect } from "react";
import { useTheme, type Theme } from "@/context/ThemeContext";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        onContextMenu={(e) => {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }}
        className="size-8 rounded-lg border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all relative"
        title={`Current theme: ${resolvedTheme} (${theme} setting). Click to toggle, right-click for menu.`}
        aria-label="Toggle theme"
        id="theme-toggle-btn"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="size-4 text-amber-400 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Sun className="size-4 text-amber-600 transition-transform duration-300 rotate-0 scale-100" />
        )}
      </Button>

      {/* Mode selection dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-lg border border-border bg-card p-1 shadow-lg ring-1 ring-black/5 focus:outline-none z-50 text-xs">
          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Appearance
          </div>
          <button
            onClick={() => handleSelect("light")}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              theme === "light"
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <span className="flex items-center gap-2">
              <Sun className="size-3.5 text-amber-600 dark:text-amber-400" />
              Light
            </span>
            {theme === "light" && <Check className="size-3.5 text-primary" />}
          </button>

          <button
            onClick={() => handleSelect("dark")}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              theme === "dark"
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <span className="flex items-center gap-2">
              <Moon className="size-3.5 text-amber-600 dark:text-amber-400" />
              Dark
            </span>
            {theme === "dark" && <Check className="size-3.5 text-primary" />}
          </button>

          <button
            onClick={() => handleSelect("system")}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              theme === "system"
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <span className="flex items-center gap-2">
              <Laptop className="size-3.5 text-muted-foreground" />
              System
            </span>
            {theme === "system" && <Check className="size-3.5 text-primary" />}
          </button>
        </div>
      )}
    </div>
  );
}
