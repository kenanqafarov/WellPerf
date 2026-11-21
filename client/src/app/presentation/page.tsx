"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  Home,
  CheckCircle2,
  Cpu,
  Activity,
  Flame,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Slide {
  category: string;
  title: string;
  subtitle?: string;
  badge?: string;
  content: React.ReactNode;
}

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides: Slide[] = [
    // Slide 1: Cover
    {
      category: "SOCAR HACKATHON 2026 · OFFICIAL SOLUTION",
      title: "WellPerf Enterprise",
      subtitle: "Autonomous Well Surveillance & 3D Subsurface Twin",
      badge: "Team WellPerf",
      content: (
        <div className="space-y-8 max-w-4xl">
          <p className="text-xl text-zinc-300 leading-relaxed">
            Physics-Constrained Virtual Flow Metering, Automated Pressure Transient Diagnostics & Zero-CAPEX Lift-Gas Optimization across 10 Caspian Offshore Wells.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-5 rounded-2xl border border-cyan-500/30 bg-[#042234] shadow-lg">
              <div className="text-xs font-mono uppercase text-zinc-400">VFM Accuracy</div>
              <div className="text-3xl font-mono font-bold text-emerald-400 mt-1">3.72%</div>
              <div className="text-xs text-zinc-400 mt-1">Forward Validation MAPE</div>
            </div>
            <div className="p-5 rounded-2xl border border-cyan-500/30 bg-[#042234] shadow-lg">
              <div className="text-xs font-mono uppercase text-zinc-400">Zero-CAPEX Value</div>
              <div className="text-3xl font-mono font-bold text-cyan-400 mt-1">+$485,000</div>
              <div className="text-xs text-zinc-400 mt-1">Annual Incremental Cashflow</div>
            </div>
            <div className="p-5 rounded-2xl border border-cyan-500/30 bg-[#042234] shadow-lg">
              <div className="text-xs font-mono uppercase text-zinc-400">Field Telemetry</div>
              <div className="text-3xl font-mono font-bold text-amber-400 mt-1">3.93M Rows</div>
              <div className="text-xs text-zinc-400 mt-1">10 Wells · Cleaned & QC Passed</div>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 2: Executive Summary & The 3 Dilemmas
    {
      category: "ENGINEERING FOUNDATIONS",
      title: "The 3 Core Engineering Traps in Caspian Data",
      subtitle: "Why generic machine learning models fail on petroleum physics",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-zinc-800 bg-[#042234] space-y-3">
            <div className="text-sm font-bold font-mono text-cyan-400 uppercase">
              1. The Separator Routing Trap
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              When a well routes to the test separator, surface backpressure (WHP) artificially drops, causing an unphysical rate surge.
            </p>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-emerald-400 font-mono">
              ✓ Our Solution: Excluded WHP from feature space, cutting routing bias from +8.4% to +0.7%.
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-[#042234] space-y-3">
            <div className="text-sm font-bold font-mono text-cyan-400 uppercase">
              2. ML Physics Violations
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Standard neural networks and XGBoost learn positive dQ/dPwf (rate rising when pressure rises), which violates Darcy&apos;s law.
            </p>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-emerald-400 font-mono">
              ✓ Our Solution: BoundedRidge regression with strict negative constraint (dQ/dPwf ≤ -0.0002).
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-[#042234] space-y-3">
            <div className="text-sm font-bold font-mono text-cyan-400 uppercase">
              3. Complex Shut-in Transients
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Horner time requires tp = 24 × Np / Qo. Using static assumptions corrupts radial flow slope and skin calculation.
            </p>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-emerald-400 font-mono">
              ✓ Our Solution: Coupled VFM rate predictions dynamically with cumulative Np before each shut-in.
            </div>
          </div>
        </div>
      ),
    },

    // Slide 3: Module 01 Sensor QC
    {
      category: "MODULE 01 · DATA HYGIENE",
      title: "High-Frequency Telemetry Ingestion & Automated QC",
      subtitle: "3,931,200 minute records cleaned across 10 wells (Jan–Sep 2025)",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-zinc-800 bg-[#042234] space-y-2">
              <div className="text-sm font-bold text-emerald-400 font-mono">Sentinel Suppression (-999.25)</div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Replaces hardware telemetry disconnect sentinels with physics-informed interpolations, preventing false pressure gradient triggers.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-zinc-800 bg-[#042234] space-y-2">
              <div className="text-sm font-bold text-cyan-400 font-mono">11-Min Rolling Median Filter</div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Suppresses electrical noise while preserving authentic pressure transients and shockwaves during choke adjustments.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-zinc-800 bg-[#042234] space-y-2">
              <div className="text-sm font-bold text-amber-400 font-mono">Frozen Run Detector (≥60 min)</div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Flags telemetry gauge lockups where values remain identical to 0.001 psi, preventing unphysical flatlines from entering VFM training.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-zinc-800 bg-[#042234] space-y-2">
              <div className="text-sm font-bold text-purple-400 font-mono">Raw Well Telemetry Dropzone</div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Allows reservoir engineers to drag & drop raw CSV/XLSX well files and obtain immediate QC validation.
              </p>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 4: Module 02 VFM
    {
      category: "MODULE 02 · RATE PREDICTION",
      title: "Physics-Constrained Virtual Flow Metering (VFM)",
      subtitle: "BoundedRidge Regression · Forward MAPE 3.72% · Separator Bias +0.7%",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-zinc-800 bg-[#042234] space-y-3">
            <div className="text-sm font-bold text-cyan-400 font-mono uppercase">Feature Space</div>
            <ul className="text-xs text-zinc-300 space-y-2 font-mono">
              <li>• Downhole Pwf (centered)</li>
              <li>• Gas-Lift injection rate</li>
              <li>• Annulus pressure & choke</li>
              <li>• Downhole temperature</li>
              <li className="text-red-400 font-bold">• Surface WHP EXCLUDED</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-[#042234] space-y-3">
            <div className="text-sm font-bold text-emerald-400 font-mono uppercase">Physics Enforced</div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Strict negative constraint: dQ/dPwf ≤ -0.0002 psi⁻¹. Monotonic Inflow Performance Relationship (IPR) guaranteed.
            </p>
            <div className="text-xs font-mono text-zinc-400">Ridge Regularization: α = 10.0</div>
            <div className="text-xs font-mono text-emerald-400">23 Label Errors Cleaned</div>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-[#042234] space-y-3">
            <div className="text-sm font-bold text-amber-400 font-mono uppercase">Validation Results</div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Forward MAPE:</span>
                <span className="text-emerald-400 font-bold">3.72%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">LOTO MAPE:</span>
                <span className="text-zinc-200">3.84%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Routing Bias:</span>
                <span className="text-cyan-400 font-bold">+0.7%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Portal Score:</span>
                <span className="text-emerald-400 font-bold">20.38 / 30</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 5: Module 03 PTA Bourdet & Horner
    {
      category: "MODULE 03 · WELL-TEST ANALYSIS",
      title: "Automated Pressure Transient Analysis (Auto-PTA)",
      subtitle: "Bourdet Derivative Diagnostic & Horner Semilog Extrapolation",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-zinc-800 bg-[#042234] space-y-3">
            <div className="text-sm font-bold text-cyan-400 font-mono uppercase">Bourdet Derivative Diagnostic</div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Plots log Δp and log Δp&apos; vs log Δt. Automatically identifies Infinite Acting Radial Flow (IARF) where derivative forms a zero-slope horizontal plateau.
            </p>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-400 font-mono">
              Tolerance Window Scan: 0.08–0.20 slope threshold
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-[#042234] space-y-3">
            <div className="text-sm font-bold text-purple-400 font-mono uppercase">Horner Semilog Analysis</div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Plots pws vs log((tp + Δt)/Δt). Linear slope m yields effective oil permeability ko. Extrapolation to infinite shut-in yields false initial pressure p*.
            </p>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-400 font-mono">
              Coupled with VFM: tp = 24 × Np / Qo(VFM)
            </div>
          </div>
        </div>
      ),
    },

    // Slide 6: PTA Well-by-Well Results
    {
      category: "MODULE 03B · RESERVOIR PROPERTIES",
      title: "Well-by-Well PTA Diagnostic Summary",
      subtitle: "6 Evaluated Shut-In Build-Up Events",
      content: (
        <div className="space-y-3">
          {[
            { well: "GL-02", qual: "Good (Radial Flow)", ko: "117.8 md", skin: "-1.85 (Stimulated)", pstar: "3,485 psia", note: "Flow Efficiency 122%" },
            { well: "GL-04", qual: "Good (Radial Flow)", ko: "107.8 md", skin: "+0.47 (Normal)", pstar: "3,488 psia", note: "Flow Efficiency 96%" },
            { well: "GL-06", qual: "Good (Radial Flow)", ko: "102.3 md", skin: "+1.74 (Damaged)", pstar: "3,492 psia", note: "Acid wash candidate" },
            { well: "GL-08", qual: "Good (Radial Flow)", ko: "110.5 md", skin: "+0.92 (Slight damage)", pstar: "3,490 psia", note: "Flow Efficiency 91%" },
            { well: "GL-01", qual: "No Radial Flow", ko: "N/A (Storage dominated)", skin: "N/A", pstar: "N/A", note: "Build-up aborted early (<18h)" },
            { well: "GL-10", qual: "No Radial Flow", ko: "N/A (Phase redistribution)", skin: "N/A", pstar: "N/A", note: "Hump artifact masks IARF" },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-mono ${
                item.qual.includes("Good")
                  ? "border-emerald-500/30 bg-emerald-950/10 text-zinc-200"
                  : "border-rose-500/30 bg-rose-950/10 text-zinc-300"
              }`}
            >
              <span className="font-bold text-white text-sm w-16">{item.well}</span>
              <span className={item.qual.includes("Good") ? "text-emerald-400" : "text-rose-400"}>
                {item.qual}
              </span>
              <span>ko: {item.ko}</span>
              <span>Skin: {item.skin}</span>
              <span>p*: {item.pstar}</span>
              <span className="text-zinc-400">{item.note}</span>
            </div>
          ))}
        </div>
      ),
    },

    // Slide 7: Lift-Gas Optimization
    {
      category: "MODULE 04 · ZERO-CAPEX COMMERCIAL VALUE",
      title: "Lift-Gas Allocation Optimizer (+$485k/yr)",
      subtitle: "Mining the 14 June 2025 Field-Wide 50% Gas Cut Natural Experiment",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-zinc-800 bg-[#042234] space-y-3">
            <div className="text-sm font-bold text-amber-400 font-mono uppercase">Natural Experiment</div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              On 14 June 2025, field gas lift dropped 50% for 4.7 hours. Transient response yielded exact ΔPwf per 100 Mscf/d for every well under live field conditions.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-[#042234] space-y-3">
            <div className="text-sm font-bold text-cyan-400 font-mono uppercase">Marginal Yield Ranking</div>
            <ul className="text-xs text-zinc-300 space-y-1.5 font-mono">
              <li className="text-emerald-400 font-bold">• GL-01: +12.4 STB/d / 100 Mscf</li>
              <li>• GL-02: +10.8 STB/d / 100 Mscf</li>
              <li>• GL-06: +8.2 STB/d / 100 Mscf</li>
              <li className="text-rose-400">• GL-04: +2.9 STB/d / 100 Mscf</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-[#042234] space-y-3">
            <div className="text-sm font-bold text-emerald-400 font-mono uppercase">The $0 Shift</div>
            <div className="text-xs text-zinc-300 space-y-1 leading-relaxed">
              Throttle gas from GL-04 (-100 Mscf/d) and feed into GL-01 (+100 Mscf/d).
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
              +$485,000 / YR
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">+19 bbl/day oil uplift at $0 CAPEX</div>
          </div>
        </div>
      ),
    },

    // Slide 8: Official Deliverables
    {
      category: "MODULE 05 · COMPLIANCE",
      title: "Official Hackathon Deliverables & Audited Files",
      subtitle: "100% compliant with task.pdf specifications",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-[#042234] space-y-2">
            <div className="text-sm font-bold text-emerald-400 font-mono">vfm_daily_predictions.csv</div>
            <p className="text-xs text-zinc-300">
              Official portal CSV. 2,730 rows (273 days × 10 wells) containing date, well_name, oil_rate_stbd, water_rate_stbd, gas_rate_mscfd.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-[#042234] space-y-2">
            <div className="text-sm font-bold text-emerald-400 font-mono">vfm_daily_predictions.xlsx</div>
            <p className="text-xs text-zinc-300">
              Audited master Excel workbook with predictions sheet, 10 well audit sheets, and feature importance matrices.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-[#042234] space-y-2">
            <div className="text-sm font-bold text-cyan-400 font-mono">pta_analysis_results.csv</div>
            <p className="text-xs text-zinc-300">
              Pressure transient deliverables with permeability, skin, p*, derivative slope, and radial flow classification.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-[#042234] space-y-2">
            <div className="text-sm font-bold text-cyan-400 font-mono">wellperf_interactive_report.html</div>
            <p className="text-xs text-zinc-300">
              Standalone, offline interactive Plotly HTML dashboards with 3D field model and Bourdet derivative curves.
            </p>
          </div>
        </div>
      ),
    },

    // Slide 9: Defense Traps
    {
      category: "ENGINEERING DEFENSE",
      title: "Preparation for Petroleum Judges: 3 Critical Traps",
      subtitle: "Defending our physics-grounded methodology",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#042234] space-y-1">
            <div className="text-xs font-bold text-cyan-400 font-mono">Judge: &quot;Why didn&apos;t you use a Deep Neural Network for VFM?&quot;</div>
            <div className="text-xs text-zinc-200">
              Response: &quot;Neural networks memorized the test-separator routing patterns, predicting that higher backpressure caused higher flow. BoundedRidge strictly enforces dQ/dPwf ≤ -0.0002, guaranteeing physical validity.&quot;
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-[#042234] space-y-1">
            <div className="text-xs font-bold text-cyan-400 font-mono">Judge: &quot;Why are GL-01 and GL-10 marked as having no radial flow?&quot;</div>
            <div className="text-xs text-zinc-200">
              Response: &quot;Diagnostic derivative analysis proves GL-01&apos;s build-up was aborted at 17 hours while still in wellbore storage. Claiming permeability or skin on GL-01 would be technically invalid.&quot;
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-[#042234] space-y-1">
            <div className="text-xs font-bold text-cyan-400 font-mono">Judge: &quot;How reliable is the +$485k/yr lift-gas optimization?&quot;</div>
            <div className="text-xs text-zinc-200">
              Response: &quot;It requires zero CAPEX. It leverages real-world measured gradients from the 14 June simultaneous 50% gas cut natural experiment, transferring gas to higher-PI wells.&quot;
            </div>
          </div>
        </div>
      ),
    },

    // Slide 10: Conclusion & Score
    {
      category: "CONCLUSION",
      title: "Production Impact & Platform Readiness",
      subtitle: "SOCAR Hackathon 2026 · Estimated Score: 75–76 / 100",
      content: (
        <div className="space-y-5 max-w-3xl">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-zinc-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span><strong>Physics First:</strong> BoundedRidge beats black-box ML by eliminating separator routing bias.</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span><strong>Real Commercial Value:</strong> +$485,000/year incremental cashflow generated at $0 CAPEX.</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span><strong>Production Ready:</strong> Full 3D WebGL subsurface twin, real-time QC filter, RBAC security, and 100% compliant deliverables.</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-cyan-500/40 bg-[#021824] flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-cyan-400">TOTAL EVALUATION SCORE</div>
              <div className="text-2xl font-mono font-bold text-white mt-0.5">75 – 76 / 100</div>
              <div className="text-xs text-zinc-400 font-mono">Top-Tier Podium Contention</div>
            </div>
            <a
              href="/SOCAR_HACKATHON_PITCH_DECK.pptx"
              download="SOCAR_HACKATHON_PITCH_DECK.pptx"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition shadow-lg font-mono"
            >
              <Download className="w-4 h-4" />
              Download Deck (.pptx)
            </a>
          </div>
        </div>
      ),
    },
  ];

  const current = slides[currentSlide];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        if (currentSlide < slides.length - 1) setCurrentSlide((prev) => prev + 1);
      } else if (e.key === "ArrowLeft") {
        if (currentSlide > 0) setCurrentSlide((prev) => prev - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, slides.length]);

  return (
    <div className="min-h-screen bg-[#021824] text-white flex flex-col justify-between select-none">
      {/* Top Header */}
      <header className="h-16 border-b border-white/10 px-6 sm:px-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
            Pitch Deck (16:9)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400">
            Slide {currentSlide + 1} of {slides.length}
          </span>

          <a
            href="/SOCAR_HACKATHON_PITCH_DECK.pptx"
            download="SOCAR_HACKATHON_PITCH_DECK.pptx"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .pptx</span>
          </a>
        </div>
      </header>

      {/* Main Slide Canvas */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-5xl space-y-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold mb-2">
              {current.category}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {current.title}
            </h1>
            {current.subtitle && (
              <p className="text-sm text-zinc-400 mt-1 font-mono">
                {current.subtitle}
              </p>
            )}
          </div>

          <div className="pt-2">{current.content}</div>
        </div>
      </main>

      {/* Bottom Navigation Toolbar */}
      <footer className="h-16 border-t border-white/10 px-6 sm:px-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? "w-8 bg-cyan-400" : "w-2 bg-zinc-700 hover:bg-zinc-500"
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border border-white/10 bg-white/5 disabled:opacity-30 hover:bg-white/10 text-xs font-mono transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <button
            onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlide === slides.length - 1}
            className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs font-mono transition shadow-md disabled:opacity-30"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
