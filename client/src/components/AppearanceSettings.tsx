"use client";

import React, { useEffect, useState, useRef } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export type ThemeMode = "light" | "dark" | "system";
export type FontScaleKey = "XS" | "S" | "M" | "L" | "XL";

const FONT_SCALES: { key: FontScaleKey; px: number; label: string }[] = [
  { key: "XS", px: 13, label: "13px" },
  { key: "S", px: 14, label: "14px" },
  { key: "M", px: 16, label: "16px" },
  { key: "L", px: 18, label: "18px" },
  { key: "XL", px: 19, label: "19px" },
];

export function AppearanceSettings() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [fontScale, setFontScale] = useState<FontScaleKey>("M");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("wp_theme") as ThemeMode | null;
      const savedScale = localStorage.getItem("wp_font_scale") as FontScaleKey | null;
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) setTheme(savedTheme);
      if (savedScale && FONT_SCALES.some((s) => s.key === savedScale)) setFontScale(savedScale);
    } catch {}
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const isDark = theme === "dark" || (theme === "system" && mediaQuery.matches);
      root.classList.toggle("dark", isDark);
      root.classList.toggle("light", !isDark);
    };

    applyTheme();
    try {
      localStorage.setItem("wp_theme", theme);
    } catch {}

    const listener = () => {
      if (theme === "system") applyTheme();
    };
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);

  useEffect(() => {
    const found = FONT_SCALES.find((s) => s.key === fontScale) || FONT_SCALES[2];
    document.documentElement.style.fontSize = `${found.px}px`;
    try {
      localStorage.setItem("wp_font_scale", fontScale);
    } catch {}
  }, [fontScale]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey && e.altKey)) return;
      if (e.key === "+" || e.key === "=" || e.code === "NumpadAdd") {
        e.preventDefault();
        setFontScale((prev) => {
          const idx = FONT_SCALES.findIndex((s) => s.key === prev);
          return FONT_SCALES[Math.min(FONT_SCALES.length - 1, idx + 1)].key;
        });
      } else if (e.key === "-" || e.key === "_" || e.code === "NumpadSubtract") {
        e.preventDefault();
        setFontScale((prev) => {
          const idx = FONT_SCALES.findIndex((s) => s.key === prev);
          return FONT_SCALES[Math.max(0, idx - 1)].key;
        });
      } else if (e.key === "0" || e.code === "Digit0" || e.code === "Numpad0") {
        e.preventDefault();
        setFontScale("M");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const currentScale = FONT_SCALES.find((s) => s.key === fontScale) || FONT_SCALES[2];

  return (
    <div ref={containerRef} className="relative inline-block text-left z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/90 hover:border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-100 transition"
      >
        <span className="font-bold">Aa</span>
        <span className="rounded bg-cyan-500/15 text-cyan-400 px-1.5 py-0.5 text-[10px] font-bold leading-none border border-cyan-500/30">
          {fontScale}
        </span>
        <span className="h-3 w-[1px] bg-zinc-800" />
        <span className="text-cyan-400">
          {theme === "light" ? (
            <Sun className="w-3.5 h-3.5" />
          ) : theme === "system" ? (
            <Monitor className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </span>
      </button>

      {/* Compact Popover (235px wide) */}
      {open && (
        <div className="absolute right-0 mt-1.5 w-[235px] rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl p-3 shadow-2xl text-zinc-100">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <span className="text-xs font-semibold">Görünüş</span>
            <span className="text-[10px] font-mono text-cyan-400">{currentScale.label}</span>
          </div>

          {/* Theme Segmented Row */}
          <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-lg bg-zinc-900 p-1 border border-zinc-800">
            {(
              [
                { id: "light", label: "İşıqlı", Icon: Sun },
                { id: "dark", label: "Qaranlıq", Icon: Moon },
                { id: "system", label: "Sistem", Icon: Monitor },
              ] as const
            ).map(({ id, label, Icon }) => {
              const active = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={`flex items-center justify-center gap-1 rounded-md py-1 text-[10px] font-medium transition ${
                    active
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Font Scale Row */}
          <div className="mt-2 grid grid-cols-5 gap-1 rounded-lg bg-zinc-900 p-1 border border-zinc-800">
            {FONT_SCALES.map((item) => {
              const active = fontScale === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFontScale(item.key)}
                  className={`flex flex-col items-center justify-center rounded-md py-1 transition ${
                    active
                      ? "bg-cyan-600 text-white font-bold shadow-sm"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  <span className="text-[11px] font-semibold leading-none">Aa</span>
                  <span className="text-[9px] mt-0.5 opacity-85">{item.key}</span>
                </button>
              );
            })}
          </div>

          {/* Compact 1-line Shortcut Footer */}
          <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>Qısayol:</span>
            <span>Ctrl+Alt + / - / 0</span>
          </div>
        </div>
      )}
    </div>
  );
}
