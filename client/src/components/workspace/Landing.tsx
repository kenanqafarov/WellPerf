"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { engineGet, fmt } from "./api";
import { CountUp } from "./ui";
import { PrefsControls, usePrefs } from "./prefs";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const FLOW = ["s_data", "s_clean", "s_model", "s_vfm", "s_pta", "s_export"];
const MARQUEE = ["Virtual flow metering", "Bourdet derivative", "Horner", "Bounded ridge", "Skin", "Permeability", "Gas lift", "Shut-in detection", "P10 · P90", "Agarwal time"];

export function Landing({ onEnter }: { onEnter: () => void }) {
  const { t, theme, cssVars } = usePrefs();
  const root = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<any | null>(null);
  const [live, setLive] = useState<boolean | null>(null);

  useEffect(() => {
    let stop = false;
    const load = () =>
      engineGet("/api/status")
        .then((s) => {
          if (stop) return;
          setLive(!!s.ready);
          setModel(s.model);
        })
        .catch(() => !stop && setLive(false));
    load();
    const id = setInterval(load, 5000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  useIso(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(".lp-nav > *", { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.06 })
        .fromTo(".lp-h1 .wf-reveal-mask > span", { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.12 }, 0.1)
        .fromTo(".lp-fade", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 0.5)
        .fromTo(".lp-bg", { scale: 1.12 }, { scale: 1, duration: 2.4, ease: "power2.out" }, 0);
      gsap.to(".lp-bg", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".lp-hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.utils.toArray<HTMLElement>(".lp-step").forEach((el, i) =>
        gsap.fromTo(el, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: (i % 3) * 0.08, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } })
      );
      gsap.utils.toArray<HTMLElement>(".lp-rise").forEach((el) =>
        gsap.fromTo(el, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } })
      );
      gsap.to(".lp-marquee-track", { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
    }, root);
    return () => ctx.revert();
  }, []);

  const oil = model?.held_out_mape?.oil_rate_stbd;
  const fwd = model?.forward_mape?.oil_rate_stbd;

  return (
    <div className="wf lp" data-theme={theme} style={cssVars} ref={root}>
      <section className="lp-hero">
        <div className="lp-bg-wrap" aria-hidden>
          <img className="lp-bg" src="/caspian-rig.gif" alt="" />
          <div className="lp-bg-shade" />
        </div>

        <nav className="lp-nav">
          <div className="wf-brand">
            <span className="wf-brand-dot" />
            WellPerf
          </div>
          <div className="lp-links">
            <a href="#flow">{t("l_flow")}</a>
            <a href="#why">{t("l_why")}</a>
            <a href="/presentation">Deck</a>
          </div>
          <div className="wf-row" style={{ gap: 10 }}>
            <PrefsControls compact />
            <button className="wf-btn primary sm" onClick={onEnter}>
              {t("l_enter")} <ArrowUpRight size={14} />
            </button>
          </div>
        </nav>

        <div className="lp-hero-body">
          <div className="label lp-fade">{t("l_eyebrow")}</div>
          <h1 className="lp-h1">
            <span className="wf-reveal-mask">
              <span>{t("l_h1a")}</span>
            </span>
            <span className="wf-reveal-mask">
              <span>
                <em>{t("l_h1b")}</em>
              </span>
            </span>
          </h1>
          <p className="wf-lead lp-fade" style={{ maxWidth: 620, fontSize: 17 }}>
            {t("l_lead")}
          </p>
          <div className="wf-row lp-fade" style={{ marginTop: 30, gap: 12 }}>
            <button className="wf-btn primary" style={{ height: 48, padding: "0 24px", fontSize: 15 }} onClick={onEnter}>
              {t("l_enter")} <ArrowUpRight size={16} />
            </button>
            <a className="wf-btn" style={{ height: 48, padding: "0 22px", fontSize: 15 }} href="#flow">
              {t("l_cta2")} <ArrowDown size={15} />
            </a>
            <span className="wf-row label" style={{ gap: 8, marginLeft: 8 }}>
              <span className={`wf-dot ${live ? "live" : live === false ? "bad" : "warn"}`} />
              {live ? t("l_live") : live === false ? t("l_offline") : "…"}
            </span>
          </div>
        </div>

        <div className="lp-stats lp-fade">
          {[
            [t("l_stat1"), oil, "%", 1],
            [t("l_stat2"), fwd, "%", 1],
            [t("l_stat3"), model?.wells?.length, "", 0],
            [t("l_stat4"), 10, "s", 0],
          ].map(([l, v, u, d]: any) => (
            <div key={l} className="lp-stat">
              <div className="lp-stat-v">
                {v == null ? "—" : <CountUp value={v} decimals={d} duration={2} />}
                <span>{u}</span>
              </div>
              <div className="label">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-marquee" aria-hidden>
        <div className="lp-marquee-track">
          {[...MARQUEE, ...MARQUEE].map((w, i) => (
            <span key={i}>
              {w} <i>✦</i>
            </span>
          ))}
        </div>
      </div>

      <section id="flow" className="lp-section">
        <div className="lp-section-head lp-rise">
          <div className="label">{t("l_flow")}</div>
          <h2 className="wf-h1" style={{ fontSize: "clamp(34px, 4.4vw, 60px)", marginTop: 12 }}>
            {t("l_flow_sub")}
          </h2>
        </div>
        <div className="lp-steps">
          {FLOW.map((k, i) => (
            <button key={k} className="lp-step" onClick={onEnter}>
              <div className="wf-between">
                <span className="mono lp-step-n">{String(i + 1).padStart(2, "0")}</span>
                <ArrowUpRight size={16} className="lp-step-arrow" />
              </div>
              <div className="lp-step-title">{t(k)}</div>
              <div className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>
                {t(`l_f${i + 1}`)}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="why" className="lp-section">
        <div className="lp-section-head lp-rise">
          <div className="label">{t("l_why")}</div>
        </div>
        <div className="wf-grid k3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="lp-why lp-rise">
              <div className="lp-why-n mono">0{n}</div>
              <div style={{ fontSize: 26, letterSpacing: "-0.03em", marginTop: 26 }}>{t(`l_why${n}`)}</div>
              <div className="muted" style={{ fontSize: 14.5, lineHeight: 1.6, marginTop: 10 }}>
                {t(`l_why${n}d`)}
              </div>
            </div>
          ))}
        </div>

        <div className="lp-cta lp-rise">
          <h2 className="wf-h1" style={{ fontSize: "clamp(36px, 5vw, 68px)" }}>
            {t("l_h1a")} <em>{t("l_h1b")}</em>
          </h2>
          <button className="wf-btn primary" style={{ height: 52, padding: "0 28px", fontSize: 15, marginTop: 28 }} onClick={onEnter}>
            {t("l_enter")} <ArrowUpRight size={16} />
          </button>
        </div>
      </section>

      <footer className="lp-foot">
        <span>{t("l_foot")}</span>
        <span className="mono dim">SOCAR Hackathon 2026 · {model?.wells?.length ? `${fmt(model.wells.length)} wells` : ""}</span>
      </footer>
    </div>
  );
}
