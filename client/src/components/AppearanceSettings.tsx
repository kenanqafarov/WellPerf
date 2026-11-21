"use client";

import React, { useEffect, useState, useRef } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export type ThemeMode = "light" | "dark" | "system";
export type FontScaleKey = "XS" | "S" | "M" | "L" | "XL";

interface FontScaleConfig {
  key: FontScaleKey;
  label: string;
  px: number;
  previewPx: number;
}

const FONT_SCALES: FontScaleConfig[] = [
  { key: "XS", label: "Extra Small (13px)", px: 13, previewPx: 12 },
  { key: "S", label: "Small (14px)", px: 14, previewPx: 14 },
  { key: "M", label: "Middle (16px)", px: 16, previewPx: 16 },
  { key: "L", label: "Large (18px)", px: 18, previewPx: 18 },
  { key: "XL", label: "Extra Large (20px)", px: 20, previewPx: 20 },
];

export function AppearanceSettings() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [resolvedDark, setResolvedDark] = useState(true);
  const [fontScale, setFontScale] = useState<FontScaleKey>("M");
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("wp_theme") as ThemeMode | null;
      const savedScale = localStorage.getItem("wp_font_scale") as FontScaleKey | null;
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        setTheme(savedTheme);
      }
      if (savedScale && FONT_SCALES.some((s) => s.key === savedScale)) {
        setFontScale(savedScale);
      }
    } catch {}
  }, []);

  // Apply theme (Light / Dark / System) to <html>
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const isDark =
        theme === "dark" || (theme === "system" && mediaQuery.matches);
      setResolvedDark(isDark);
      if (isDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
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

  // Apply root font size scale to <html>
  useEffect(() => {
    const found = FONT_SCALES.find((s) => s.key === fontScale) || FONT_SCALES[2];
    document.documentElement.style.fontSize = `${found.px}px`;
    try {
      localStorage.setItem("wp_font_scale", fontScale);
    } catch {}
  }, [fontScale]);

  // Global keyboard shortcuts: Ctrl + Alt + (+/-) and Ctrl + Alt + 0
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey && e.altKey)) return;

      if (e.key === "+" || e.key === "=" || e.code === "NumpadAdd") {
        e.preventDefault();
        setFontScale((prev) => {
          const idx = FONT_SCALES.findIndex((s) => s.key === prev);
          const nextIdx = Math.min(FONT_SCALES.length - 1, idx + 1);
          return FONT_SCALES[nextIdx].key;
        });
      } else if (e.key === "-" || e.key === "_" || e.code === "NumpadSubtract") {
        e.preventDefault();
        setFontScale((prev) => {
          const idx = FONT_SCALES.findIndex((s) => s.key === prev);
          const nextIdx = Math.max(0, idx - 1);
          return FONT_SCALES[nextIdx].key;
        });
      } else if (e.key === "0" || e.code === "Digit0" || e.code === "Numpad0") {
        e.preventDefault();
        setFontScale("M");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const currentScaleObj =
    FONT_SCALES.find((s) => s.key === fontScale) || FONT_SCALES[2];

  return (
    <div ref={containerRef} className="relative inline-block text-left z-50">
      {/* Trigger Pill Button (Matches Screenshot: Aa [M] | Moon/Sun) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Görünüş Tənzimləmələri (Mövzu və şrift ölçüsü)"
        className="inline-flex items-center gap-2.5 rounded-xl border border-zinc-700/80 bg-zinc-900/90 hover:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 shadow-sm transition-all"
      >
        <div className="flex items-center gap-1.5">
          <span className="font-bold tracking-tight text-zinc-100">Aa</span>
          <span className="inline-flex items-center justify-center rounded-md bg-[#023F46] text-teal-300 dark:bg-[#023F46] dark:text-teal-300 px-1.5 py-0.5 text-[11px] font-bold leading-none border border-teal-500/30">
            {fontScale}
          </span>
        </div>
        <span className="h-3.5 w-[1px] bg-zinc-700" />
        <span className="text-teal-400 dark:text-teal-300 flex items-center">
          {theme === "light" ? (
            <Sun className="w-3.5 h-3.5 text-[#023F46]" />
          ) : theme === "system" ? (
            <Monitor className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </span>
      </button>

      {/* Dropdown Popover Card */}
      {open && (
        <div
          className={`absolute right-0 mt-2.5 w-[340px] sm:w-[365px] rounded-2xl border p-5 shadow-2xl backdrop-blur-xl transition-all ${
            resolvedDark
              ? "bg-[#051F24]/98 border-[#0D565F] text-[#F0FAFB]"
              : "bg-white border-[#C9DFE2] text-[#023F46]"
          }`}
        >
          {/* Header */}
          <div className="pb-3.5 border-b border-zinc-800">
            <h3 className="text-base font-bold tracking-tight text-zinc-100">
              Görünüş Tənzimləmələri
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Mövzu və şrift miqyasını fərdiləşdirin
            </p>
          </div>

          {/* Mövzu (Theme) */}
          <div className="mt-4">
            <div className="text-xs font-semibold text-zinc-300 mb-2">
              Mövzu
            </div>
            <div
              className={`grid grid-cols-3 gap-1.5 rounded-xl p-1.5 border ${
                resolvedDark
                  ? "bg-[#031518] border-[#0A474F]"
                  : "bg-[#EEF5F6] border-[#D5E6E8]"
              }`}
            >
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
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-2.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-[#023F46] text-white shadow-md border border-teal-400/30"
                        : resolvedDark
                        ? "text-[#8AB8BE] hover:text-white hover:bg-[#072C31]"
                        : "text-[#3B757C] hover:text-[#023F46] hover:bg-white/70"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Yazı və element ölçüsü (Font & Element Scale) */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-300">
                Yazı və element ölçüsü
              </span>
              <span
                className={`text-xs font-semibold ${
                  resolvedDark ? "text-teal-400" : "text-[#023F46]"
                }`}
              >
                {currentScaleObj.label}
              </span>
            </div>

            <div
              className={`grid grid-cols-5 gap-1.5 rounded-xl p-1.5 border ${
                resolvedDark
                  ? "bg-[#031518] border-[#0A474F]"
                  : "bg-[#EEF5F6] border-[#D5E6E8]"
              }`}
            >
              {FONT_SCALES.map((item) => {
                const active = fontScale === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFontScale(item.key)}
                    className={`flex flex-col items-center justify-between rounded-xl py-2.5 px-1 transition-all ${
                      active
                        ? "bg-[#023F46] text-white shadow-md ring-1 ring-teal-400/50"
                        : resolvedDark
                        ? "text-[#8AB8BE] hover:text-white hover:bg-[#072C31]"
                        : "text-[#3B757C] hover:text-[#023F46] hover:bg-white/80"
                    }`}
                  >
                    <span
                      className="font-bold leading-none flex items-center justify-center h-6"
                      style={{ fontSize: `${item.previewPx}px` }}
                    >
                      Aa
                    </span>
                    <span
                      className={`text-[11px] font-semibold mt-1.5 ${
                        active ? "text-teal-200" : "opacity-80"
                      }`}
                    >
                      {item.key}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Qısayollar (Shortcuts) */}
          <div
            className={`mt-4 rounded-xl p-3.5 border ${
              resolvedDark
                ? "bg-[#031518]/90 border-[#0A474F]"
                : "bg-[#EEF5F6] border-[#D5E6E8]"
            }`}
          >
            <div className="text-xs font-bold text-zinc-100 mb-2.5">
              Qısayollar:
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Böyüt / Kiçilt</span>
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <kbd
                    className={`px-1.5 py-0.5 rounded border ${
                      resolvedDark
                        ? "bg-[#052429] border-[#0E5A63] text-zinc-200"
                        : "bg-white border-[#C9DFE2] text-[#023F46]"
                    }`}
                  >
                    Ctrl
                  </kbd>
                  <span className="text-zinc-500">+</span>
                  <kbd
                    className={`px-1.5 py-0.5 rounded border ${
                      resolvedDark
                        ? "bg-[#052429] border-[#0E5A63] text-zinc-200"
                        : "bg-white border-[#C9DFE2] text-[#023F46]"
                    }`}
                  >
                    Alt
                  </kbd>
                  <span className="text-zinc-500">+</span>
                  <kbd
                    className={`px-1.5 py-0.5 rounded border ${
                      resolvedDark
                        ? "bg-[#052429] border-[#0E5A63] text-zinc-200"
                        : "bg-white border-[#C9DFE2] text-[#023F46]"
                    }`}
                  >
                    +/-
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Sıfırla (M)</span>
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <kbd
                    className={`px-1.5 py-0.5 rounded border ${
                      resolvedDark
                        ? "bg-[#052429] border-[#0E5A63] text-zinc-200"
                        : "bg-white border-[#C9DFE2] text-[#023F46]"
                    }`}
                  >
                    Ctrl
                  </kbd>
                  <span className="text-zinc-500">+</span>
                  <kbd
                    className={`px-1.5 py-0.5 rounded border ${
                      resolvedDark
                        ? "bg-[#052429] border-[#0E5A63] text-zinc-200"
                        : "bg-white border-[#C9DFE2] text-[#023F46]"
                    }`}
                  >
                    Alt
                  </kbd>
                  <span className="text-zinc-500">+</span>
                  <kbd
                    className={`px-1.5 py-0.5 rounded border ${
                      resolvedDark
                        ? "bg-[#052429] border-[#0E5A63] text-zinc-200"
                        : "bg-white border-[#C9DFE2] text-[#023F46]"
                    }`}
                  >
                    0
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          {/* 60-30-10 Petrol Rule Indicator Footer */}
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>PALETTE: PETROL #023F46</span>
            <div className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-2 rounded-sm border border-zinc-700"
                style={{ backgroundColor: resolvedDark ? "#03181C" : "#FFFFFF" }}
                title="60% Dominant Canvas"
              />
              <span
                className="inline-block w-3 h-2 rounded-sm border border-zinc-700"
                style={{ backgroundColor: resolvedDark ? "#023F46" : "#E8F2F3" }}
                title="30% Secondary Surface"
              />
              <span
                className="inline-block w-3 h-2 rounded-sm border border-zinc-700"
                style={{ backgroundColor: resolvedDark ? "#14B8A6" : "#023F46" }}
                title="10% Accent Highlight"
              />
              <span className="ml-1">60·30·10</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
