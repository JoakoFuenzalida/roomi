"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center justify-between rounded-[14px] bg-surface-container-lowest border border-outline-variant px-5 py-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition-colors"
    >
      <div className="flex items-center gap-3">
        {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
        <span className="text-[15px] font-semibold">
          {theme === "dark" ? "Modo oscuro" : "Modo claro"}
        </span>
      </div>
      <div
        className={`relative w-[44px] h-[24px] rounded-full transition-colors ${
          theme === "dark" ? "bg-primary" : "bg-outline"
        }`}
      >
        <div
          className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow transition-transform ${
            theme === "dark" ? "translate-x-[22px]" : "translate-x-[2px]"
          }`}
        />
      </div>
    </button>
  );
}
