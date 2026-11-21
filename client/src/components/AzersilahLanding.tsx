"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowUpRight, Play, ShieldCheck } from "lucide-react";
import { AppLang, TRANSLATIONS } from "@/lib/i18n";

interface AzersilahLandingProps {
  lang: AppLang;
  onChangeLang: (lang: AppLang) => void;
  onLaunchDashboard: (targetTab?: "command" | "ai" | "data" | "vfm" | "pta" | "gaslift" | "export" | "logs" | "rbac") => void;
}

const ROTATING_WORDS = ["METER", "OPTIMIZE", "PREDICT", "CONTROL"];

export function AzersilahLanding({ lang, onChangeLang, onLaunchDashboard }: AzersilahLandingProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const t = TRANSLATIONS[lang];
  const heroCanvasRef = useRef<HTMLCanvasElement>(null);
  const landingRootRef = useRef<HTMLDivElement>(null);

  // Vertical word carousel (like Azersilah heroSwiper: DEFEND / WIN / CONTROL)
  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  // Animated WebGL-style Offshore Caspian & Subsurface Seismic Motion Backdrop Canvas (60 FPS GIF-like background)
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Subsurface well particles & seismic nodes
    const nodes = Array.from({ length: 55 }, (_, i) => ({
      x: (i / 55) * 1.2 - 0.1,
      y: 0.25 + Math.random() * 0.65,
      r: 1.5 + Math.random() * 2.5,
      speed: 0.0008 + Math.random() * 0.0018,
      well: i % 10,
    }));

    const draw = () => {
      animId = requestAnimationFrame(draw);
      t += 0.016;
      const w = canvas.width;
      const h = canvas.height;

      // Deep Caspian industrial gradient backdrop
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#021019");
      grad.addColorStop(0.45, "#042335");
      grad.addColorStop(1, "#010b12");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle architectural radar grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.06)";
      ctx.lineWidth = 1;
      const step = 64;
      for (let gx = 0; gx < w; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += step) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // 5 Undulating Seismic Anticline Horizons (Animated Wave Contours)
      const horizons = [
        { yBase: h * 0.36, amp: 18, color: "rgba(14, 165, 233, 0.28)", fill: "rgba(14, 165, 233, 0.04)" },
        { yBase: h * 0.50, amp: 28, color: "rgba(20, 184, 166, 0.32)", fill: "rgba(20, 184, 166, 0.05)" },
        { yBase: h * 0.64, amp: 36, color: "rgba(16, 185, 129, 0.35)", fill: "rgba(16, 185, 129, 0.06)" },
        { yBase: h * 0.78, amp: 24, color: "rgba(245, 158, 11, 0.25)", fill: "rgba(245, 158, 11, 0.04)" },
      ];

      horizons.forEach((hz, idx) => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 12) {
          const nx = x / w;
          const dome = Math.sin(nx * Math.PI) * hz.amp * 1.4;
          const wave =
            Math.sin(nx * 8 + t * (1.1 + idx * 0.2)) * (hz.amp * 0.45) +
            Math.cos(nx * 14 - t * 0.8) * 6;
          const py = hz.yBase - dome + wave;
          if (x === 0) ctx.moveTo(x, py);
          else ctx.lineTo(x, py);
        }
        ctx.strokeStyle = hz.color;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = hz.fill;
        ctx.fill();
      });

      // 10 Deviated Gas-Lift Wellbore Trajectories radiating from Offshore Platform Center
      const rigX = w * 0.5;
      const rigY = h * 0.24;
      for (let i = 0; i < 10; i++) {
        const spread = (i - 4.5) / 5;
        const targetX = rigX + spread * (w * 0.42);
        const targetY = h * (0.72 + (i % 3) * 0.07);
        const ctrlX = rigX + spread * (w * 0.16);
        const ctrlY = h * 0.48;

        ctx.beginPath();
        ctx.moveTo(rigX + spread * 24, rigY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, targetX, targetY);
        ctx.strokeStyle =
          i === 5
            ? "rgba(245, 158, 11, 0.55)" // GL-06 Stimulation Target
            : i === 0
            ? "rgba(16, 185, 129, 0.55)" // GL-01 High Marginal Yield
            : "rgba(56, 189, 248, 0.28)";
        ctx.lineWidth = i === 5 || i === 0 ? 2.2 : 1.2;
        ctx.stroke();

        // Pulsing Darcy Radial Pressure Wave at toe of each well
        const pulse = ((t * 0.7 + i * 0.23) % 1);
        ctx.beginPath();
        ctx.arc(targetX, targetY, 6 + pulse * 36, 0, Math.PI * 2);
        ctx.strokeStyle =
          i === 5
            ? `rgba(245, 158, 11, ${(1 - pulse) * 0.6})`
            : `rgba(16, 185, 129, ${(1 - pulse) * 0.5})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Multiphase Flowing Particles rising along wellbores
      nodes.forEach((n) => {
        n.y -= n.speed;
        if (n.y < 0.24) n.y = 0.88;
        const spread = (n.well - 4.5) / 5;
        const prog = (n.y - 0.24) / 0.64;
        const px = rigX + spread * (w * 0.42) * Math.pow(prog, 1.25);
        const py = n.y * h;

        ctx.beginPath();
        ctx.arc(px, py, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.well === 5 ? "#f59e0b" : "#2dd4bf";
        ctx.fill();
      });
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // GSAP Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".az-hero-reveal",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" }
      );
    }, landingRootRef);
    return () => ctx.revert();
  }, []);

  const MODULE_CARDS = [
    {
      id: "vfm" as const,
      num: "01",
      title: lang === "AZ" ? "VİRTUAL AXIN ÖLÇMƏ (VFM)" : "VIRTUAL FLOW METERING (VFM)",
      subtitle: "vfm_daily_predictions.xlsx",
      metric: "3.72% FORWARD OIL MAPE",
      tags: [
        "38% Daha Aşağı Neft Xətası",
        "BoundedRidge Fiziki Model",
        "+0.7% Separator Bias",
        "Gündəlik Neft · Su · Qaz",
      ],
      accent: "#10b981",
      svgType: "vfm",
    },
    {
      id: "pta" as const,
      num: "02",
      title: lang === "AZ" ? "TƏZYİQ BƏRPASI ANALİZİ (PTA)" : "PRESSURE TRANSIENT ANALYSIS (PTA)",
      subtitle: "pta_reservoir_properties.xlsx",
      metric: "GL-06 SKIN +1.74 · k = 292 md",
      tags: [
        "Bourdet Log-Log Törəməsi",
        "Horner Yarım-Loq Reqressiya",
        "4 Good · 2 Indicative Quyu",
        "#1 Stimulyasiya Namizədi: GL-06",
      ],
      accent: "#f59e0b",
      svgType: "pta",
    },
    {
      id: "gaslift" as const,
      num: "03",
      title: lang === "AZ" ? "QAZ-LİFT OPTİMALLAŞDIRICISI" : "LIFT-GAS ALLOCATION OPTIMISER",
      subtitle: "GL-04 → GL-01 (100 Mscf/d)",
      metric: "+19 BBL/D · +$485,000 / İL",
      tags: [
        "$0 CAPEX İqtisadi Qazanc",
        "GL-01: +26 bbl/d per 100 Mscf",
        "GL-04: +7.5 bbl/d (Donor)",
        "GL-03 (+82) & GL-05 (+59) Potensial",
      ],
      accent: "#06b6d4",
      svgType: "gaslift",
    },
    {
      id: "data" as const,
      num: "04",
      title: lang === "AZ" ? "3.93M SENSOR TELEMETRİYASI & 3D TWIN" : "3.93M SENSOR QC & 3D DIGITAL TWIN",
      subtitle: "10 Quyu · 273 Gün · 1-Dəq Tezlik",
      metric: "14 İYUN TƏBİİ EKSPERİMENTİ",
      tags: [
        "3.93M Dəqiqəlik Sensor Sətri",
        "Spikes · Frozen · Shut-In Aşkarlama",
        "3D Xəzər Platforması & Quyular",
        "4 Offline Excel & HTML Hesabat",
      ],
      accent: "#3b82f6",
      svgType: "twin",
    },
  ];

  return (
    <div ref={landingRootRef} className="w-full min-h-screen bg-white text-[#05293C] font-sans selection:bg-[#05293C] selection:text-white">
      {/* ===================================================================== */}
      {/* STICKY 100dvh HERO — EXACT AZERSILAH.COM 2×2 GRID & CENTER '+' RETICLE */}
      {/* ===================================================================== */}
      <header className="sticky inset-0 z-10 w-full isolate h-dvh overflow-hidden bg-[#021824] text-white">
        {/* AI-Generated Caspian Offshore Rig Backdrop + Animated Subsurface Telemetry Canvas */}
        <img
          src="/caspian-rig.png"
          alt="Caspian Offshore Rig"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity z-0"
        />
        <canvas
          ref={heroCanvasRef}
          className="absolute inset-0 w-full h-full object-cover opacity-85 z-0"
        />
        <div className="absolute inset-0 bg-black/25 z-0" />

        {/* Exact Azersilah Top Bar: Brand Logo Left | Horizontal Side-by-Side Links Middle | AZ/EN/RU & Enter Dashboard Right */}
        <div className="absolute top-0 inset-x-0 z-30 flex justify-between items-center px-6 md:px-10 pt-5 md:pt-7">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => onLaunchDashboard("command")}
            className="flex items-center gap-3 text-left group"
          >
            <div className="h-9 w-9 bg-white text-[#021824] flex items-center justify-center font-mono font-black text-sm tracking-tighter">
              WP
            </div>
            <div>
              <div className="text-lg md:text-xl font-bold tracking-[-0.04em] leading-none">
                WELLPERF
              </div>
              <div className="text-[10px] font-mono tracking-[0.2em] text-white/60 uppercase mt-0.5">
                CASPIAN INTELLIGENCE
              </div>
            </div>
          </button>

          {/* Horizontal Side-by-Side Links (Agentation Feedback: "düzəlt bunu yanaşı dursun") */}
          <ul className="hidden lg:flex flex-row items-center gap-6 xl:gap-8 text-xs xl:text-sm font-medium tracking-[-0.02em]">
            {[
              { label: t.land_about, href: "#about" },
              { label: t.land_modules, href: "#products" },
              { label: t.land_edge, href: "#our-edge" },
              { label: t.land_validation, href: "#supply" },
              { label: "WELLPERF AI", action: () => onLaunchDashboard("ai") },
            ].map((item, idx) => (
              <li key={idx} className="group overflow-hidden">
                {item.action ? (
                  <button
                    type="button"
                    onClick={item.action}
                    className="flex items-center gap-1.5 relative py-1 text-cyan-300"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono">[</span>
                    <div className="relative overflow-hidden">
                      <span className="invisible block uppercase">{item.label}</span>
                      <span className="block absolute top-0 left-0 transition-transform duration-300 group-hover:-translate-y-full uppercase">
                        {item.label}
                      </span>
                      <span className="block absolute top-full left-0 transition-transform duration-300 group-hover:translate-y-[-100%] uppercase text-white">
                        {item.label}
                      </span>
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono">]</span>
                  </button>
                ) : (
                  <a href={item.href} className="flex items-center gap-1.5 relative py-1">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono text-cyan-400">[</span>
                    <div className="relative overflow-hidden">
                      <span className="invisible block uppercase">{item.label}</span>
                      <span className="block absolute top-0 left-0 transition-transform duration-300 group-hover:-translate-y-full uppercase">
                        {item.label}
                      </span>
                      <span className="block absolute top-full left-0 transition-transform duration-300 group-hover:translate-y-[-100%] uppercase text-cyan-300">
                        {item.label}
                      </span>
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono text-cyan-400">]</span>
                  </a>
                )}
              </li>
            ))}
          </ul>

          {/* Right Controls: AZ / EN / RU Multi-Language Switcher + Direct Dashboard Launch Button */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center border border-white/25 bg-black/30 backdrop-blur-sm">
              {(["AZ", "EN", "RU"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => onChangeLang(l)}
                  className={`px-2 py-1.5 text-xs font-mono uppercase transition ${
                    lang === l ? "bg-white text-[#021824] font-bold" : "text-white/70 hover:text-white"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onLaunchDashboard("command")}
              className="bg-white text-[#021824] hover:bg-cyan-400 hover:text-[#021824] px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg"
            >
              <span>{t.land_dashboard}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Crosshair '+' Icon (Exact Azersilah plus-icon.svg placement) */}
        <div className="pointer-events-none absolute inset-0 m-auto flex justify-center items-center z-20">
          <svg className="w-9 h-9 md:w-11 md:h-11 text-white/60" viewBox="0 0 40 40" fill="none">
            <line x1="20" y1="2" x2="20" y2="38" stroke="currentColor" strokeWidth="1.5" />
            <line x1="2" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        {/* 2×2 Architectural Grid Overlay */}
        <div className="relative z-10 w-full h-full grid grid-cols-2 grid-rows-2 border border-white/15">
          {/* Top-Left Quadrant */}
          <div className="p-6 md:px-10 md:pb-6 flex items-end justify-start border-b border-white/15">
            <p className="az-hero-reveal text-xs sm:text-sm md:text-lg xl:text-xl font-medium leading-[130%] tracking-[-0.03em] flex gap-2 uppercase">
              <span className="animate-pulse text-cyan-400 font-bold">/</span>
              <span>
                {lang === "AZ" ? (
                  <>
                    10 QAZ-LİFT NEFT QUYUSU ÜÇÜN YARADILIB —
                    <br />
                    3.93M SENSOR SƏTRİNDƏN DƏQİQ QƏRARLARA.
                  </>
                ) : (
                  <>
                    ENGINEERED FOR 10 GAS-LIFTED OIL WELLS —
                    <br />
                    SHAPING AUTONOMOUS UPSTREAM SURVEILLANCE.
                  </>
                )}
              </span>
            </p>
          </div>

          {/* Top-Right Quadrant */}
          <div className="p-6 md:px-10 md:pb-6 flex flex-col items-end justify-end border-b border-l border-white/15 text-right">
            <div className="az-hero-reveal font-mono text-[11px] md:text-xs text-white/70 space-y-1">
              <div className="text-cyan-300 font-semibold">FIELD TELEMETRY: JAN–SEP 2025 (273 DAYS)</div>
              <div>14,250 BBL/D OIL · 7,170 BBL/D WATER · 9,100 MSCF/D LIFT GAS</div>
            </div>
          </div>

          {/* Bottom-Left Quadrant: Giant Swiss Headline + Vertical Sliding Word */}
          <div className="p-6 md:p-10 flex items-end justify-start">
            <h1 className="az-hero-reveal text-[9.5vw] md:text-[6.6vw] font-medium leading-[95%] tracking-[-0.05em] uppercase select-none">
              <div>ENGINEERED</div>
              <div className="flex items-center gap-3 md:gap-5 mt-1">
                <span>TO</span>
                <span className="inline-block h-[10vw] md:h-[7vw] overflow-hidden text-cyan-400">
                  <div
                    className="transition-transform duration-500 ease-out"
                    style={{ transform: `translateY(-${wordIndex * 25}%)` }}
                  >
                    {ROTATING_WORDS.map((w) => (
                      <div key={w} className="h-[10vw] md:h-[7vw] flex items-center">
                        {w}
                      </div>
                    ))}
                  </div>
                </span>
              </div>
            </h1>
          </div>

          {/* Bottom-Right Quadrant */}
          <div className="p-6 md:p-10 flex flex-col items-end justify-end border-l border-white/15 text-right gap-4">
            <div className="az-hero-reveal text-sm sm:text-lg md:text-2xl xl:text-3xl font-medium leading-[115%] tracking-[-0.04em] uppercase">
              {lang === "AZ" ? (
                <>
                  FİZİKİ MƏHDUDİYYƏTLİ VFM & PTA.
                  <br />
                  AVADANLIQ XƏRCİ OLMADAN MAKSİMUM HASİLAT.
                </>
              ) : (
                <>
                  PHYSICS-CONSTRAINED VFM & PTA.
                  <br />
                  PRODUCTION WITHOUT COMPROMISE.
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => onLaunchDashboard("command")}
              className="az-hero-reveal group inline-flex items-center gap-3 bg-cyan-400 hover:bg-white text-[#021824] px-6 py-3.5 text-xs md:text-sm font-bold uppercase tracking-wider transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{lang === "AZ" ? "CANLI PLATFORMANI AÇ (3D + VFM + PTA)" : "ENTER LIVE WORKBENCH"}</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* SCROLLING FOREGROUND CONTENT (z-20 bg-white OVER STICKY HERO)         */}
      {/* ===================================================================== */}
      <main id="other-section" className="relative z-20 bg-white text-[#05293C]">
        {/* 1. [ ABOUT US / THE PROBLEM & SOLUTION ] */}
        <section
          id="about"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-6 md:px-10 pt-20 md:pt-28 pb-12 md:pb-16"
        >
          <div className="col-span-1">
            <span className="font-mono font-medium text-sm md:text-base text-[#05293C]/60 tracking-[-0.03em] flex items-center gap-2 uppercase">
              <span>[</span> {lang === "AZ" ? "PROBLEM VƏ HƏLL" : "THE PROBLEM & SOLUTION"} <span>]</span>
            </span>
          </div>

          <div className="col-span-1 md:col-span-2 md:w-5/6">
            <h2 className="font-medium text-[#05293C] text-3xl sm:text-5xl xl:text-6xl tracking-[-0.04em] uppercase leading-[100%]">
              {lang === "AZ"
                ? "TEST GÜNLƏRİ ARASINDA KOR İDARƏETMƏYƏ SON: BİR TƏTBİQ, DÖRD ADDIM"
                : "BRIDGING THE BLIND GAP BETWEEN MONTHLY WELL TESTS"}
            </h2>
            <p className="text-[#4C5B63] text-base md:text-lg leading-[145%] tracking-[-0.01em] pt-5">
              {lang === "AZ"
                ? "Yataqdakı 10 qaz-lift quyusu gündəlik 14,250 bbl neft, 7,170 bbl su və 3,660 Mscf qaz hasil edir, lakin real деbit yalnız ayda bir dəfə test separatorunda ölçülür. WellPerf 3.93 milyon sətirlik 1-dəqiqəlik təzyiq, temperatur, ştuser və lift-qaz sensorlarını təmizləyir, fiziki məhdudiyyətli VFM ilə gündəlik hasilatı 3.72% dəqiqliklə hesablayır, PTA build-up testlərini analiz edir və əlavə qaz-liftin hansı quyuda ən çox neft verəcəyini sıralayır."
                : "The field operates 10 gas-lifted oil wells producing 14,250 bbl/d oil with 9,100 Mscf/d of lift gas, yet rates are only measured once a month on the test separator. WellPerf turns 3.9 million rows of 1-minute pressure, temperature, choke and lift-gas telemetry into calibrated daily phase rates (VFM), automated build-up permeability & skin diagnostics (PTA), and zero-CAPEX lift-gas reallocation."}
            </p>
          </div>
        </section>

        {/* 2. [ STATISTICS ] — Exact Azersilah Bracketed Counter Grid */}
        <section
          id="statistics"
          className="grid grid-cols-1 md:grid-cols-3 px-6 md:px-10 gap-5 pb-20 md:pb-28"
        >
          {[
            {
              value: "3.72%",
              label:
                lang === "AZ"
                  ? "FORWARD VFM NEFT XƏTASI (STANDART 6.00% METODUNDAN 38% DAHA DƏQİQ)"
                  : "FORWARD VFM OIL ERROR (38% LOWER THAN 6.00% INDUSTRY CARRY-FORWARD)",
            },
            {
              value: "$485K",
              label:
                lang === "AZ"
                  ? "GL-04 → GL-01 (100 MSCF/D) QAZ BÖLGÜSÜNDƏN İLLİK ƏLAVƏ GƏLİR (+19 BBL/D)"
                  : "ANNUAL ZERO-CAPEX VALUE MOVING 100 MSCF/D FROM GL-04 TO GL-01 (+19 BBL/D)",
            },
            {
              value: "+1.74",
              label:
                lang === "AZ"
                  ? "GL-06 QUYUSUNDA TƏSDİQLƏNMİŞ SKİN FAKTORU (k = 292 MD · #1 STİMULYASİYA NAMİZƏDİ)"
                  : "VALIDATED SKIN ON GL-06 (k = 292 MD · RANKED #1 STIMULATION CANDIDATE)",
            },
          ].map((st, idx) => (
            <div key={idx} className="flex flex-col justify-between gap-10 text-[#05293C]">
              {/* Top U-Bracket */}
              <div className="w-full h-6 border-t border-x border-[#D5DFE5]" />
              <div className="px-4">
                <div className="text-6xl sm:text-7xl xl:text-8xl font-normal tracking-[-0.05em] leading-none">
                  {st.value}
                </div>
                <p className="font-medium text-xs sm:text-sm md:text-base uppercase tracking-[-0.03em] leading-[125%] pt-4 text-[#05293C]/85">
                  {st.label}
                </p>
              </div>
              {/* Bottom U-Bracket */}
              <div className="w-full h-6 border-b border-x border-[#D5DFE5]" />
            </div>
          ))}
        </section>

        {/* 3. [ PRODUCT PORTFOLIO / 4 STEPS & OPTIMISER ] */}
        <section
          id="products"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-6 md:px-10 pb-10"
        >
          <div className="col-span-1">
            <span className="font-mono font-medium text-sm md:text-base text-[#05293C]/60 tracking-[-0.03em] flex items-center gap-2 uppercase">
              <span>[</span> {lang === "AZ" ? "PLATFORMANIN 4 ADDIMI" : "SYSTEM ARCHITECTURE"} <span>]</span>
            </span>
          </div>
          <div className="col-span-1 md:col-span-2">
            <h2 className="font-medium text-[#05293C] text-3xl sm:text-5xl xl:text-6xl tracking-[-0.04em] uppercase leading-[100%]">
              {lang === "AZ" ? (
                <>
                  DƏQİQLİK. FİZİKA.
                  <br />
                  SIFIR KOMPROMİS.
                </>
              ) : (
                <>
                  PHYSICS. PRECISION.
                  <br />
                  ZERO COMPROMISE.
                </>
              )}
            </h2>
          </div>
        </section>

        {/* 2×2 Azersilah Product Portfolio Grid */}
        <section className="px-6 md:px-10 pb-20 md:pb-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MODULE_CARDS.map((card) => (
              <div
                key={card.id}
                onClick={() => onLaunchDashboard(card.id)}
                className="group relative overflow-hidden bg-[#F0F3F5] hover:bg-[#E2E8EC] p-6 md:p-8 min-h-[380px] md:min-h-[430px] flex flex-col justify-between transition-colors duration-500 cursor-pointer border border-[#E1E7EB]"
              >
                {/* Top Hover-Revealing Tags */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-[#05293C]/60">
                      STEP {card.num} / {card.subtitle}
                    </span>
                    <span
                      className="font-mono text-xs font-bold px-2.5 py-1"
                      style={{ backgroundColor: "#05293C", color: "#ffffff" }}
                    >
                      {card.metric}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {card.tags.map((t, i) => (
                      <span
                        key={i}
                        className="border border-[#B8C4CC] bg-white/70 group-hover:border-[#05293C] px-3 py-1 text-xs font-medium text-[#05293C] transition-colors"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Center Animated Technical Blueprint Visual (AI/SVG Telemetry Render) */}
                <div className="my-6 flex-1 flex items-center justify-center">
                  {card.svgType === "vfm" && (
                    <svg viewBox="0 0 420 150" className="w-full max-w-[380px] h-32 overflow-visible">
                      <rect x="0" y="0" width="420" height="150" fill="#05293C" rx="6" />
                      <g stroke="rgba(255,255,255,0.08)" strokeWidth="1">
                        <line x1="0" y1="37" x2="420" y2="37" />
                        <line x1="0" y1="75" x2="420" y2="75" />
                        <line x1="0" y1="112" x2="420" y2="112" />
                      </g>
                      {/* Carry-forward baseline step line */}
                      <path
                        d="M 15 95 L 95 95 L 95 62 L 185 62 L 185 88 L 285 88 L 285 52 L 405 52"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                      {/* VFM Calibrated Rate Curve */}
                      <path
                        d="M 15 92 Q 55 86, 95 64 T 185 84 T 285 54 T 405 48"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                      />
                      {/* Measured Well Test Points */}
                      {[
                        [95, 64],
                        [185, 84],
                        [285, 54],
                        [385, 49],
                      ].map(([cx, cy], i) => (
                        <g key={i}>
                          <circle cx={cx} cy={cy} r="6" fill="#10b981" opacity="0.25" />
                          <circle cx={cx} cy={cy} r="3.5" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
                        </g>
                      ))}
                      <text x="16" y="22" fill="#34d399" fontSize="10" fontFamily="monospace">
                        OIL RATE VFM (3.72% MAPE) vs CARRY-FORWARD (6.00%)
                      </text>
                    </svg>
                  )}

                  {card.svgType === "pta" && (
                    <svg viewBox="0 0 420 150" className="w-full max-w-[380px] h-32">
                      <rect x="0" y="0" width="420" height="150" fill="#05293C" rx="6" />
                      {/* IARF Radial Stabilization Window */}
                      <rect x="175" y="18" width="175" height="114" fill="rgba(245, 158, 11, 0.14)" stroke="#f59e0b" strokeDasharray="3 3" />
                      {/* Delta P Curve */}
                      <path
                        d="M 25 128 Q 95 68, 175 48 T 385 32"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                      />
                      {/* Bourdet Derivative dP/dln(t) Curve stabilizing flat in IARF */}
                      <path
                        d="M 25 132 Q 105 55, 175 78 L 355 78 L 395 82"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.8"
                      />
                      <line x1="175" y1="78" x2="355" y2="78" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 3" />
                      <text x="182" y="34" fill="#fbbf24" fontSize="10" fontFamily="monospace">
                        IARF RADIAL FLOW: k=292 md, Skin=+1.74
                      </text>
                    </svg>
                  )}

                  {card.svgType === "gaslift" && (
                    <svg viewBox="0 0 420 150" className="w-full max-w-[380px] h-32">
                      <rect x="0" y="0" width="420" height="150" fill="#05293C" rx="6" />
                      {[
                        { w: "GL-01", val: 26, wBar: 250, col: "#10b981" },
                        { w: "GL-06", val: 23, wBar: 220, col: "#14b8a6" },
                        { w: "GL-08", val: 21, wBar: 200, col: "#06b6d4" },
                        { w: "GL-04", val: 7.5, wBar: 75, col: "#f43f5e" },
                      ].map((b, idx) => (
                        <g key={b.w} transform={`translate(20, ${22 + idx * 30})`}>
                          <text x="0" y="13" fill="#e2e8f0" fontSize="11" fontFamily="monospace">
                            {b.w}
                          </text>
                          <rect x="52" y="2" width={b.wBar} height="14" fill={b.col} rx="2" />
                          <text x={60 + b.wBar} y="13" fill={b.col} fontSize="11" fontFamily="monospace" fontWeight="bold">
                            +{b.val} bbl/d
                          </text>
                        </g>
                      ))}
                    </svg>
                  )}

                  {card.svgType === "twin" && (
                    <svg viewBox="0 0 420 150" className="w-full max-w-[380px] h-32">
                      <rect x="0" y="0" width="420" height="150" fill="#05293C" rx="6" />
                      <line x1="0" y1="36" x2="420" y2="36" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
                      <rect x="190" y="14" width="40" height="22" fill="#f59e0b" rx="2" />
                      {[-140, -90, -45, 0, 45, 90, 140].map((dx, i) => (
                        <path
                          key={i}
                          d={`M 210 36 Q ${210 + dx * 0.35} 85, ${210 + dx} 132`}
                          fill="none"
                          stroke={i === 1 ? "#f59e0b" : "#2dd4bf"}
                          strokeWidth="2"
                        />
                      ))}
                      <text x="16" y="24" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                        CASPIAN 3D TWIN · 10 WELLS · 3.93M ROWS
                      </text>
                    </svg>
                  )}
                </div>

                {/* Bottom Title & Arrow */}
                <div className="flex items-end justify-between">
                  <h3 className="font-medium text-2xl md:text-3xl text-[#05293C] uppercase tracking-[-0.03em] leading-none">
                    {card.title}
                  </h3>
                  <div className="h-10 w-10 rounded-full border border-[#05293C]/20 group-hover:bg-[#05293C] group-hover:text-white flex items-center justify-center transition-all">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. [ OUR EDGE & VALIDATION ] — Exact Azersilah Deep Navy #021824 3-Col Section */}
        <section
          id="our-edge"
          className="bg-[#021824] text-white grid grid-cols-1 md:grid-cols-3 gap-6 px-6 md:px-10 pt-20 md:pt-28 pb-12"
        >
          <div className="col-span-1">
            <span className="font-mono font-medium text-sm md:text-base text-white/50 tracking-[-0.03em] flex items-center gap-2 uppercase">
              <span>[</span> {lang === "AZ" ? "NECƏ TƏSDİQLƏDİK?" : "HOW WE VALIDATED IT"} <span>]</span>
            </span>
          </div>
          <div className="col-span-1 md:col-span-2">
            <h2 className="font-medium text-white text-3xl sm:text-5xl xl:text-6xl tracking-[-0.04em] uppercase leading-[100%]">
              {lang === "AZ"
                ? "DATA TƏLƏSİNİN HƏLLİ VƏ TƏBİİ EKSPERİMENT SÜBUTU"
                : "SOLVING THE SEPARATOR TRAP & PROVEN ON REAL FIELD EVENTS"}
            </h2>
          </div>
        </section>

        <section id="supply" className="bg-[#021824] text-white pb-20 md:pb-28 px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 border border-white/20">
            {[
              {
                num: "01",
                title: lang === "AZ" ? "TEST SEPARATORU TƏLƏSİ (+0.7% BİAS)" : "TEST SEPARATOR ROUTING TRAP REMOVED",
                desc:
                  lang === "AZ"
                    ? "Quyu test separatoruna yönəldildikdə quyuağzı təzyiq düşür. Adi model axını deyil, separator marşrutunu öyrənir (−9% bias). Biz quyudibi və həlqəvi fəza sensorlarına keçərək test-günü sürüşməsini +0.7%-ə endirdik."
                    : "Surface pressures drop when routed to the test separator. A naive model learns routing, not flow (−9% bias). Switching to downhole & annulus inputs reduced test-day bias to +0.7%.",
              },
              {
                num: "02",
                title: lang === "AZ" ? "14 İYUN TƏBİİ EKSPERİMENTİ" : "JUNE 14 NATURAL EXPERIMENT",
                desc:
                  lang === "AZ"
                    ? "14 İyun (10:20–15:02) tarixində bütün 10 quyuda lift-qaz verilişi eyni anda ~50% azaldı və hər bir quyuda quyudibi təzyiq dərhal qalxdı. Bu, qaz-lift modelimizi fərziyyəsiz, real sahə datası ilə sübut edir."
                    : "On 14 Jun (10:20–15:02), lift gas fell by half across all 10 wells simultaneously. Every well's bottom-hole pressure rose, proving the lift-gas physics directly from real data.",
              },
              {
                num: "03",
                title: lang === "AZ" ? "74 AVTOMATİK TEST VƏ FİZİKİ YOXLAMA" : "74 AUTOMATED TESTS & PHYSICS CHECKS",
                desc:
                  lang === "AZ"
                    ? "Hər quyuda yüksək quyudibi təzyiqin daha az maye demək olduğu (dQ/dPwf <= 0) məcburi qorunur. 4 'good' PTA quyusunda IARF pəncərəsi dəyişsə belə k və skin 5% daxilində sabit qalır."
                    : "Monotonic pressure response is enforced in every well. Across the four 'good' PTA build-ups, permeability and skin stay within 5% regardless of the chosen window.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="min-h-[320px] flex flex-col justify-between p-8 border-b md:border-b-0 md:border-r last:border-r-0 border-white/20 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl text-cyan-400">/{item.num}</span>
                  <ShieldCheck className="w-6 h-6 text-white/40" />
                </div>
                <div className="space-y-3 mt-12">
                  <h3 className="text-xl md:text-2xl font-medium uppercase tracking-[-0.03em]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. FOOTER — Exact Azersilah #021824 Footer with Giant Call-to-Action */}
        <footer className="bg-[#021824] border-t border-white/15 px-6 md:px-10 py-16 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div>
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-2">
                [ READY FOR FIELD DEPLOYMENT ]
              </div>
              <h2 className="text-4xl sm:text-6xl font-medium tracking-[-0.05em] uppercase leading-none">
                WELLPERF ENTERPRISE
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onLaunchDashboard("command")}
              className="bg-white text-[#021824] hover:bg-cyan-400 px-8 py-4 text-sm font-bold uppercase tracking-wider flex items-center gap-3 transition-all"
            >
              <span>{lang === "AZ" ? "İDARƏETMƏ PANELİNƏ DAXİL OL" : "OPEN ENGINEERING DASHBOARD"}</span>
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between text-xs font-mono text-white/50 gap-4">
            <span>© 2026 WELLPERF · 10 GAS-LIFT WELLS · VFM + PTA + 3D TWIN</span>
            <span>NEXT.JS 14 · THREE.JS · EXPRESS.JS · MONGODB ATLAS · PYTHON 3.11</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
