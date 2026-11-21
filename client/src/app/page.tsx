"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  FileSpreadsheet,
  Flame,
  Gauge,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  Play,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wind,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ReferenceLine,
  ReferenceArea,
  BarChart,
  Cell,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
} from "@/components/ui/primitives";
import { apiFetch, API_URL } from "@/lib/utils";

const CaspianField3D = dynamic(() => import("@/components/CaspianField3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] rounded-2xl border border-slate-800 bg-[#040814] flex items-center justify-center text-sm text-slate-400">
      Initializing 3D Caspian Subsurface WebGL Engine…
    </div>
  ),
});

type NavTab =
  | "command"
  | "data"
  | "vfm"
  | "pta"
  | "gaslift"
  | "export"
  | "rbac";

const ROLE_BADGE_MAP: Record<string, "amber" | "emerald" | "cyan" | "purple" | "slate"> = {
  ADMIN: "amber",
  RESERVOIR_ENGINEER: "emerald",
  PRODUCTION_ENGINEER: "cyan",
  DATA_SCIENTIST: "purple",
  FIELD_OPERATOR: "slate",
};

export default function WellPerfEnterpriseApp() {
  // Auth & RBAC State
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);
  const [loginEmail, setLoginEmail] = useState("admin@socar.az");
  const [loginPassword, setLoginPassword] = useState("Password123!");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Navigation & Global Field State
  const [activeTab, setActiveTab] = useState<NavTab>("command");
  const [selectedWell, setSelectedWell] = useState<string>("GL-01");
  const [bootstrap, setBootstrap] = useState<any | null>(null);
  const [wellSeries, setWellSeries] = useState<any | null>(null);
  const [loadingField, setLoadingField] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // VFM Live Simulator State
  const [simPwf, setSimPwf] = useState<number>(3220);
  const [simTemp, setSimTemp] = useState<number>(203.0);
  const [simAnnulus, setSimAnnulus] = useState<number>(1150);
  const [simLiftGas, setSimLiftGas] = useState<number>(820);
  const [simChoke64, setSimChoke64] = useState<number>(48);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [retrainResult, setRetrainResult] = useState<any | null>(null);
  const [retrainLoading, setRetrainLoading] = useState(false);

  // PTA State
  const [selectedEventId, setSelectedEventId] = useState<string>("GL-06_20250722_0311");
  const [ptaDetail, setPtaDetail] = useState<any | null>(null);
  const [ptaPlotMode, setPtaPlotMode] = useState<"loglog" | "horner" | "mdh" | "history">("loglog");
  const [overrideQ, setOverrideQ] = useState<string>("");
  const [overrideStartH, setOverrideStartH] = useState<string>("");
  const [overrideEndH, setOverrideEndH] = useState<string>("");
  const [ptaOverrideLoading, setPtaOverrideLoading] = useState(false);

  // Gas-Lift Optimiser State
  const [donorWell, setDonorWell] = useState("GL-04");
  const [receiverWell, setReceiverWell] = useState("GL-01");
  const [shiftMscfd, setShiftMscfd] = useState<number>(100);
  const [oilPrice, setOilPrice] = useState<number>(70);
  const [glSimResult, setGlSimResult] = useState<any | null>(null);

  // RBAC Admin State
  const [rbacOverview, setRbacOverview] = useState<any | null>(null);

  const showNotice = (text: string, type: "success" | "error" | "info" = "info") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Load demo accounts on mount
  useEffect(() => {
    apiFetch("/auth/demo-accounts")
      .then((res) => {
        setDemoAccounts(res.accounts || []);
      })
      .catch(() => {});
  }, []);

  // Load bootstrap data when authenticated
  useEffect(() => {
    if (!token) return;
    setLoadingField(true);
    apiFetch("/field/bootstrap", {}, token)
      .then((data) => {
        setBootstrap(data);
        if (data.ptaEvents?.length && !selectedEventId) {
          setSelectedEventId(data.ptaEvents[0].event_id);
        }
      })
      .catch((err) => showNotice(err.message, "error"))
      .finally(() => setLoadingField(false));
  }, [token]);

  // Load selected well time series
  useEffect(() => {
    if (!token || !selectedWell) return;
    apiFetch(`/wells/${selectedWell}/timeseries`, {}, token)
      .then((data) => {
        setWellSeries(data);
        // Sync VFM simulator sliders with selected well's latest sensor means
        const lastSensor = data.sensors?.[data.sensors.length - 1];
        if (lastSensor) {
          setSimPwf(Math.round(lastSensor.dh_pressure_psia_mean || 2800));
          setSimTemp(Number((lastSensor.dh_temperature_degf_mean || 185).toFixed(1)));
          setSimAnnulus(Math.round(lastSensor.annulus_pressure_psia_mean || 1100));
          setSimLiftGas(Math.round(lastSensor.gas_lift_rate_mscfd_mean || 850));
        }
      })
      .catch((err) => showNotice(err.message, "error"));
  }, [token, selectedWell]);

  // Load selected PTA event detail
  useEffect(() => {
    if (!token || !selectedEventId) return;
    apiFetch(`/pta/events/${selectedEventId}`, {}, token)
      .then((ev) => {
        setPtaDetail(ev);
        setOverrideQ(String(ev.properties?.q_oil_before_shut_in_stbd?.toFixed(1) || ""));
        setOverrideStartH(String(ev.properties?.iarf_start_hours?.toFixed(2) || ""));
        setOverrideEndH(String(ev.properties?.iarf_end_hours?.toFixed(2) || ""));
      })
      .catch((err) => showNotice(err.message, "error"));
  }, [token, selectedEventId]);

  // Load RBAC overview when visiting RBAC tab
  useEffect(() => {
    if (!token || activeTab !== "rbac") return;
    apiFetch("/rbac/overview", {}, token)
      .then(setRbacOverview)
      .catch((err) => showNotice(err.message, "error"));
  }, [token, activeTab, user]);

  const handleLogin = async (emailToUse?: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: emailToUse || loginEmail,
          password: loginPassword,
        }),
      });
      setToken(res.token);
      setUser(res.user);
      showNotice(`Logged in as ${res.user.name} (${res.user.role})`, "success");
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickRoleSwitch = async (targetEmail: string) => {
    if (!token) return;
    try {
      const res = await apiFetch(
        "/auth/switch-role",
        {
          method: "POST",
          body: JSON.stringify({ targetEmail }),
        },
        token
      );
      setToken(res.token);
      setUser(res.user);
      showNotice(`Switched active RBAC role to ${res.user.role} (${res.user.name})`, "info");
    } catch (err: any) {
      showNotice(err.message, "error");
    }
  };

  const hasPerm = (perm: string) => {
    if (!user) return false;
    return user.role === "ADMIN" || (user.permissions || []).includes(perm);
  };

  const runVFMSimulation = async () => {
    if (!token) return;
    setSimLoading(true);
    try {
      const res = await apiFetch(
        "/vfm/simulate",
        {
          method: "POST",
          body: JSON.stringify({
            well_name: selectedWell,
            dh_pressure_psia: simPwf,
            dh_temperature_degf: simTemp,
            annulus_pressure_psia: simAnnulus,
            gas_lift_rate_mscfd: simLiftGas,
            choke_size_64ths: simChoke64,
            date_str: "2025-09-15",
            uptime_frac: 1.0,
          }),
        },
        token
      );
      setSimResult(res);
      showNotice(
        `Simulated ${selectedWell}: ${res.oil_rate_stbd} STB/d Oil, ${res.water_rate_stbd} STB/d Water`,
        "success"
      );
    } catch (err: any) {
      showNotice(err.message, "error");
    } finally {
      setSimLoading(false);
    }
  };

  const runPythonRetrain = async () => {
    if (!token) return;
    setRetrainLoading(true);
    try {
      const res = await apiFetch("/vfm/retrain", { method: "POST" }, token);
      setRetrainResult(res);
      showNotice(
        `Python VFM Engine Verified! Forward Oil MAPE: ${res.oil_forward_mape_pct}%, Bias: +${res.test_day_bias_pct}%`,
        "success"
      );
    } catch (err: any) {
      showNotice(err.message, "error");
    } finally {
      setRetrainLoading(false);
    }
  };

  const handlePTAOverride = async (reset = false) => {
    if (!token || !selectedEventId) return;
    setPtaOverrideLoading(true);
    try {
      const res = await apiFetch(
        `/pta/events/${selectedEventId}/override`,
        {
          method: "POST",
          body: JSON.stringify(
            reset
              ? { reset: true }
              : {
                  q_oil_stbd: Number(overrideQ),
                  window_start_hours: Number(overrideStartH),
                  window_end_hours: Number(overrideEndH),
                }
          ),
        },
        token
      );
      setPtaDetail(res);
      setOverrideQ(String(res.properties?.q_oil_before_shut_in_stbd?.toFixed(1) || ""));
      setOverrideStartH(String(res.properties?.iarf_start_hours?.toFixed(2) || ""));
      setOverrideEndH(String(res.properties?.iarf_end_hours?.toFixed(2) || ""));
      // Refresh bootstrap table
      const b = await apiFetch("/field/bootstrap", {}, token);
      setBootstrap(b);
      showNotice(
        reset
          ? `Reset ${selectedEventId} to automatic IARF detection`
          : `Updated ${selectedEventId}: k = ${res.properties.permeability_md.toFixed(1)} md, skin = ${res.properties.skin.toFixed(2)}`,
        "success"
      );
    } catch (err: any) {
      showNotice(err.message, "error");
    } finally {
      setPtaOverrideLoading(false);
    }
  };

  const runGasLiftAllocation = async () => {
    if (!token) return;
    try {
      const res = await apiFetch(
        "/gaslift/allocate",
        {
          method: "POST",
          body: JSON.stringify({
            donorWell,
            receiverWell,
            shiftMscfd,
            oilPriceUsd: oilPrice,
          }),
        },
        token
      );
      setGlSimResult(res);
      showNotice(
        `Gas-Lift Trial (${donorWell} → ${receiverWell}): +${res.netOilGainStbd} STB/d (+$${res.annualRevenueUsd.toLocaleString()}/yr)`,
        "success"
      );
    } catch (err: any) {
      showNotice(err.message, "error");
    }
  };

  // Field-wide totals
  const fieldTotals = useMemo(() => {
    if (!bootstrap?.wellAverages) {
      return { oil: 14250, water: 7170, gas: 3660, liftGas: 9100 };
    }
    const oil = bootstrap.wellAverages.reduce((acc: number, w: any) => acc + (w.avg_oil || 0), 0);
    const water = bootstrap.wellAverages.reduce((acc: number, w: any) => acc + (w.avg_water || 0), 0);
    const gas = bootstrap.wellAverages.reduce((acc: number, w: any) => acc + (w.avg_gas || 0), 0);
    return {
      oil: Math.round(oil),
      water: Math.round(water),
      gas: Math.round(gas),
      liftGas: 9100,
    };
  }, [bootstrap]);

  // ========================
  // LOGIN SCREEN (IF NOT AUTHENTICATED)
  // ========================
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-[#040814] text-slate-100 flex flex-col justify-between relative overflow-hidden">
        {/* Background cyber glow */}
        <div className="pointer-events-none absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 w-[550px] h-[550px] rounded-full bg-cyan-500/10 blur-[130px]" />

        <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/20">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">WellPerf OS</span>
                <Badge variant="emerald">SOCAR Hackathon 2026</Badge>
              </div>
              <p className="text-xs text-slate-400">
                Caspian AI Institute · Virtual Flow Metering & Automated PTA Suite
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              MongoDB Atlas Cluster0 Connected
            </span>
          </div>
        </header>

        <main className="max-w-7xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Pitch */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              One Field · 10 Gas-Lifted Wells · 3.93M Sensor Rows · Real-Time Physics AI
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
              From 1-Minute Raw Sensors to{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Subsurface Intelligence.
              </span>
            </h1>
            <p className="text-slate-300 text-base leading-relaxed max-w-2xl">
              WellPerf eliminates the 30-day blind spot between physical separator tests.
              Built with a physics-constrained <strong>BoundedRidge VFM</strong> (3.72% forward oil error, +0.7% test-day routing bias),
              automated <strong>Bourdet-Horner IARF PTA</strong>, a <strong>Three.js 3D Caspian Digital Twin</strong>, and
              a <strong>+$485k/yr Lift-Gas Optimiser</strong>.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-xs text-slate-400">Oil Forward MAPE</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">3.72%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">38% lower than industry default</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-xs text-slate-400">Separator Trap Bias</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1">+0.7%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Down from −9.0% WHP trap</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-xs text-slate-400">Stimulation Target</div>
                <div className="text-2xl font-bold text-amber-400 mt-1">GL-06</div>
                <div className="text-[11px] text-slate-400 mt-0.5">k = 292 md · Skin +1.74</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-xs text-slate-400">Zero-CAPEX Lift Gain</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">+$485k/yr</div>
                <div className="text-[11px] text-slate-400 mt-0.5">GL-04 → GL-01 (+19 bbl/d)</div>
              </div>
            </div>

            {/* 1-Click RBAC Persona Selector */}
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Instant Jury RBAC Role Login (Click any persona to launch)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => {
                      setLoginEmail(acc.email);
                      handleLogin(acc.email);
                    }}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-emerald-500/50 transition text-left group"
                  >
                    <div className="text-2xl mt-0.5">{acc.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-white group-hover:text-emerald-300 truncate">
                          {acc.name}
                        </span>
                        <Badge variant={ROLE_BADGE_MAP[acc.role] || "slate"}>
                          {acc.role}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">{acc.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {acc.email} · {acc.permissions?.length || 0} permissions
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sign-In Card */}
          <div className="lg:col-span-5">
            <Card className="border-slate-800 bg-slate-900/80 shadow-2xl">
              <CardHeader className="space-y-1 border-b border-slate-800/80 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-emerald-400" />
                    Enterprise RBAC Sign In
                  </CardTitle>
                  <Badge variant="cyan">JWT + Atlas</Badge>
                </div>
                <CardDescription>
                  Authenticate with your SOCAR role credentials or click a demo persona on the left.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Corporate Email</label>
                  <Input
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@socar.az"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                {authError && (
                  <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300">
                    {authError}
                  </div>
                )}
                <Button
                  variant="cyber"
                  className="w-full h-11"
                  onClick={() => handleLogin()}
                  disabled={authLoading}
                >
                  {authLoading ? "Authenticating with MongoDB Atlas…" : "Launch WellPerf Command Center"}
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300">Role-Based Access Control (RBAC) Enforcement:</div>
                  <div>• <strong>ADMIN / DATA_SCIENTIST:</strong> Can trigger live Python VFM retraining</div>
                  <div>• <strong>RESERVOIR_ENGINEER:</strong> Can override PTA oil rate & radial-flow windows</div>
                  <div>• <strong>PRODUCTION_ENGINEER:</strong> Can execute Lift-Gas reallocation trials</div>
                  <div>• <strong>FIELD_OPERATOR:</strong> Read-only surveillance & 3D twin telemetry</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="max-w-7xl w-full mx-auto px-6 py-4 border-t border-slate-800/70 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <span>SOCAR Hackathon 2026 · SABAH.city, Baku</span>
          <span>Express.js + MongoDB Atlas + Next.js 14 + Three.js + Python 3.11 Scientific Core</span>
        </footer>
      </div>
    );
  }

  // ========================
  // AUTHENTICATED ENTERPRISE SHELL
  // ========================
  const currentWellProfile = bootstrap?.wells?.find((w: any) => w.well_name === selectedWell);
  const meta = bootstrap?.metadata;

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col">
      {/* Top Enterprise Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#050914]/90 backdrop-blur-xl px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-base shadow-md shadow-emerald-500/20">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">WellPerf Enterprise</span>
                <Badge variant="emerald">v2.0 · SOCAR 2026</Badge>
              </div>
              <div className="text-[11px] text-slate-400">
                VFM → Auto PTA → Lift-Gas Optimiser · MongoDB Atlas Live
              </div>
            </div>
          </div>

          {/* Navigation Pills */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 ml-4">
            {[
              { id: "command", label: "3D Twin & Command", icon: CompassIcon },
              { id: "data", label: "1 · Field Data & QC", icon: Database },
              { id: "vfm", label: "2 · Virtual Flow Meter", icon: Gauge },
              { id: "pta", label: "3 · Auto PTA Engine", icon: Activity },
              { id: "gaslift", label: "💨 Lift-Gas Optimiser", icon: Flame },
              { id: "export", label: "4 · Deliverables & Export", icon: FileSpreadsheet },
              { id: "rbac", label: "RBAC & Audit Logs", icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as NavTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    active
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right User Role Switcher & Status */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher Dropdown for Jury Demo */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-lg">{user.avatar}</span>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{user.name}</span>
                <Badge variant={ROLE_BADGE_MAP[user.role] || "slate"}>{user.role}</Badge>
              </div>
              <div className="text-[10px] text-slate-400">{user.title}</div>
            </div>
            <select
              aria-label="Switch active RBAC role"
              value={user.email}
              onChange={(e) => handleQuickRoleSwitch(e.target.value)}
              className="ml-2 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-emerald-300 focus:outline-none"
            >
              {demoAccounts.map((acc) => (
                <option key={acc.email} value={acc.email}>
                  Switch → {acc.role}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setToken(null);
              setUser(null);
            }}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Mobile / Tablet Nav Bar */}
      <div className="flex xl:hidden overflow-x-auto gap-1.5 px-6 py-2.5 bg-slate-950 border-b border-slate-800">
        {[
          { id: "command", label: "3D Twin" },
          { id: "data", label: "1·Field Data" },
          { id: "vfm", label: "2·VFM" },
          { id: "pta", label: "3·Auto PTA" },
          { id: "gaslift", label: "💨 Optimiser" },
          { id: "export", label: "4·Exports" },
          { id: "rbac", label: "RBAC" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as NavTab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === t.id
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-semibold ${
            toast.type === "error"
              ? "bg-rose-950/90 border-rose-500/50 text-rose-200"
              : toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
              : "bg-slate-900/95 border-cyan-500/50 text-cyan-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {toast.text}
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6 space-y-6">
        {/* Global KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-4 border-slate-800/90 bg-slate-900/50">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Field Oil Production</span>
              <Badge variant="emerald">Jan–Sep 2025</Badge>
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">
              {fieldTotals.oil.toLocaleString()} <span className="text-xs font-normal text-slate-400">STB/d</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5">10 Gas-Lifted Wells · 273 Days</div>
          </Card>

          <Card className="p-4 border-slate-800/90 bg-slate-900/50">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>VFM Oil Error (Held / Fwd)</span>
              <Badge variant="cyan">85 / 55 Tests</Badge>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              2.65% <span className="text-slate-500">/</span> 3.72%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">vs 6.00% carry-forward baseline</div>
          </Card>

          <Card className="p-4 border-slate-800/90 bg-slate-900/50">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Separator Routing Bias</span>
              <Badge variant="emerald">Solved</Badge>
            </div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-1">+0.70%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Surface WHP excluded (−9% trap)</div>
          </Card>

          <Card className="p-4 border-slate-800/90 bg-slate-900/50">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Auto PTA Build-Ups</span>
              <Badge variant="amber">6 Shut-ins</Badge>
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">
              4 <span className="text-sm font-semibold text-emerald-400">Good</span>{" "}
              <span className="text-slate-500">·</span> 2 <span className="text-sm font-semibold text-rose-400">Indicative</span>
            </div>
            <div className="text-[11px] text-amber-300 mt-0.5">GL-06 Skin +1.74 → Stimulate</div>
          </Card>

          <Card className="p-4 border-slate-800/90 bg-slate-900/50">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Injected Lift Gas</span>
              <Badge variant="purple">14 Jun Cut</Badge>
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">
              9,100 <span className="text-xs font-normal text-slate-400">Mscf/d</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">GL-04 uses 1,570 Mscf/d (lowest ROI)</div>
          </Card>

          <Card className="p-4 border-emerald-500/40 bg-gradient-to-br from-emerald-950/50 to-slate-900/80">
            <div className="text-[11px] text-emerald-300 flex items-center justify-between font-semibold">
              <span>🔁 GL-04 → GL-01 Trial</span>
              <Badge variant="emerald">Zero CAPEX</Badge>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              +19 STB/d <span className="text-xs font-semibold text-white">($485k/yr)</span>
            </div>
            <div className="text-[11px] text-emerald-200/80 mt-0.5">Shift 100 Mscf/d · Same total gas</div>
          </Card>
        </div>

        {/* ==================================================== */}
        {/* TAB 0: 3D DIGITAL TWIN & EXECUTIVE COMMAND CENTER    */}
        {/* ==================================================== */}
        {activeTab === "command" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 8 Cols: Interactive Three.js 3D Caspian Field Twin */}
              <div className="lg:col-span-8 space-y-4">
                <CaspianField3D
                  wells={bootstrap?.wells || []}
                  latestPredictions={bootstrap?.latestPredictions || []}
                  ptaEvents={bootstrap?.ptaEvents || []}
                  selectedWell={selectedWell}
                  onSelectWell={(w) => setSelectedWell(w)}
                />
              </div>

              {/* Right 4 Cols: Selected Well Subsurface & Surface Telemetry Card */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <Card className="flex-1 border-slate-800">
                  <CardHeader className="pb-3 border-b border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span className="text-cyan-400">{selectedWell}</span> Well Digital Twin
                        </CardTitle>
                        <CardDescription>
                          Manifold {currentWellProfile?.completion?.production_manifold || "A"} · First Oil:{" "}
                          {currentWellProfile?.completion?.first_production_date}
                        </CardDescription>
                      </div>
                      <Badge variant="emerald">Active Producer</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                        <div className="text-slate-400">Net Pay & Porosity</div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {currentWellProfile?.pvt?.net_pay_thickness_ft} ft ·{" "}
                          {((currentWellProfile?.pvt?.porosity_frac || 0) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                        <div className="text-slate-400">Oil Viscosity & FVF</div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {currentWellProfile?.pvt?.oil_viscosity_cp} cp ·{" "}
                          {currentWellProfile?.pvt?.oil_fvf_rb_stb} rb/stb
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                        <div className="text-slate-400">Cum. Oil (1 Jan 2025)</div>
                        <div className="text-sm font-bold text-emerald-400 mt-0.5">
                          {((currentWellProfile?.completion?.cum_oil_at_2025_01_01_stb || 0) / 1e6).toFixed(2)} MMstb
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                        <div className="text-slate-400">Pwf Sensitivity (+10 psi)</div>
                        <div className="text-sm font-bold text-cyan-400 mt-0.5">
                          {currentWellProfile?.sensitivity?.liquid_pct_per_10psi_pwf?.toFixed(2)}% liquid
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                        <div className="text-slate-400">Lift-Gas Gain (+100 Mscf/d)</div>
                        <div className="text-sm font-bold text-amber-400 mt-0.5">
                          +{currentWellProfile?.lift_gas_rank?.oil_gain_stbd_per_100_mscfd?.toFixed(1)} STB/d
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                        <div className="text-slate-400">Sensor QC Flagged</div>
                        <div className="text-sm font-bold text-slate-200 mt-0.5">
                          {currentWellProfile?.qc?.pct_values_flagged}% of 393k rows
                        </div>
                      </div>
                    </div>

                    {/* Quick Jump Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button variant="secondary" size="sm" onClick={() => setActiveTab("vfm")}>
                        <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                        Open {selectedWell} VFM
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setActiveTab("data")}>
                        <Database className="w-3.5 h-3.5 text-cyan-400" />
                        Inspect {selectedWell} Sensors
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Lift-Gas Top Summary Card */}
                <Card className="border-emerald-500/30 bg-emerald-950/20">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <Flame className="w-4 h-4" />
                        14 June Natural Experiment Insight
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("gaslift")}>
                        Simulate Trial
                      </Button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      On <strong>14 Jun (10:20–15:02)</strong>, lift gas dropped ~50% across all 10 wells. Measuring{" "}
                      <code>ΔPwf × PI</code> proves shifting <strong>100 Mscf/d from GL-04 → GL-01</strong> yields{" "}
                      <strong className="text-emerald-400">+19 STB/d (+$485k/yr)</strong> immediately.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Bottom Row: Daily VFM Rates for Selected Well + PTA Summary Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Card className="lg:col-span-7">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {selectedWell} — VFM Daily Oil, Water & Gas Rates vs Measured Well Tests
                    </CardTitle>
                    <CardDescription>
                      Solid curves = VFM daily predictions · Diamond markers = periodic separator well tests
                    </CardDescription>
                  </div>
                  <Badge variant="emerald">P10–P90 Validated</Badge>
                </CardHeader>
                <CardContent className="h-[310px] pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={wellSeries?.predictions || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={28} />
                      <YAxis yAxisId="left" stroke="#10b981" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="oil_rate_stbd"
                        name="VFM Oil (STB/d)"
                        stroke="#10b981"
                        strokeWidth={2.2}
                        dot={false}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="water_rate_stbd"
                        name="VFM Water (STB/d)"
                        stroke="#38bdf8"
                        strokeWidth={1.8}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="gas_rate_mscfd"
                        name="VFM Gas (Mscf/d)"
                        stroke="#f59e0b"
                        strokeWidth={1.6}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-5">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Automated PTA Build-Up Summary (6 Shut-Ins)</CardTitle>
                    <CardDescription>Click any shut-in event to open full diagnostic plots & overrides</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("pta")}>
                    Full PTA Suite →
                  </Button>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2">Well</th>
                          <th className="py-2">Quality</th>
                          <th className="py-2 text-right">k (md)</th>
                          <th className="py-2 text-right">Skin s</th>
                          <th className="py-2 text-right">ΔPskin</th>
                          <th className="py-2 text-right">PI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(bootstrap?.ptaEvents || []).map((ev: any) => {
                          const p = ev.properties;
                          const isGood = p.iarf_quality === "good";
                          return (
                            <tr
                              key={ev.event_id}
                              onClick={() => {
                                setSelectedEventId(ev.event_id);
                                setActiveTab("pta");
                              }}
                              className="hover:bg-slate-800/50 cursor-pointer transition"
                            >
                              <td className="py-2.5 font-bold text-white">{ev.well_name}</td>
                              <td className="py-2.5">
                                <Badge variant={isGood ? "emerald" : "rose"}>
                                  {isGood ? "🟢 good" : "🔴 indicative"}
                                </Badge>
                              </td>
                              <td className="py-2.5 text-right font-mono text-slate-200">
                                {p.permeability_md?.toFixed(1)}
                              </td>
                              <td
                                className={`py-2.5 text-right font-mono font-bold ${
                                  p.skin > 1 ? "text-amber-400" : "text-emerald-400"
                                }`}
                              >
                                {p.skin > 0 ? `+${p.skin.toFixed(2)}` : p.skin.toFixed(2)}
                              </td>
                              <td className="py-2.5 text-right font-mono text-slate-300">
                                {p.delta_p_skin_psi?.toFixed(1)} psi
                              </td>
                              <td className="py-2.5 text-right font-mono text-cyan-300">
                                {p.productivity_index_stbd_psi?.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 1: FIELD DATA, SENSOR ENVELOPES & QC             */}
        {/* ==================================================== */}
        {activeTab === "data" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  1 · Field Sensor Telemetry, Data-Quality Checks & Event Detection
                </h2>
                <p className="text-xs text-slate-400">
                  3.93 million 1-minute sensor rows cleaned: -999.25 sentinels, duplicates, out-of-order timestamps,
                  11-min rolling-median spikes, and ≥60-min frozen runs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(bootstrap?.wells || []).map((w: any) => (
                  <button
                    key={w.well_name}
                    onClick={() => setSelectedWell(w.well_name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      selectedWell === w.well_name
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    {w.well_name}
                  </button>
                ))}
              </div>
            </div>

            {/* Downhole & Wellhead Pressure Min/Max Envelope Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {selectedWell} — Downhole Flowing Pressure (dh_pressure_psia) Min/Max Envelope
                  </CardTitle>
                  <CardDescription>
                    Spikes and shut-in build-up peaks remain visible via daily [min, max] envelope
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={wellSeries?.sensors || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={25} />
                      <YAxis stroke="#38bdf8" domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="dh_pressure_psia_max"
                        name="Daily Max Pwf (psia)"
                        stroke="#f43f5e"
                        strokeWidth={1}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="dh_pressure_psia_mean"
                        name="Daily Mean Pwf (psia)"
                        stroke="#38bdf8"
                        strokeWidth={2.2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="dh_pressure_psia_min"
                        name="Daily Min Pwf (psia)"
                        stroke="#64748b"
                        strokeWidth={1}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {selectedWell} — Gas-Lift Injection Rate & Annulus Pressure
                  </CardTitle>
                  <CardDescription>
                    Note the 14 June 2025 field-wide gas-lift cut across all 10 wells
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={wellSeries?.sensors || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={25} />
                      <YAxis yAxisId="left" stroke="#10b981" domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#a855f7"
                        domain={["auto", "auto"]}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="gas_lift_rate_mscfd_mean"
                        name="Mean Gas Lift (Mscf/d)"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="gas_lift_rate_mscfd_min"
                        name="Min Gas Lift (Mscf/d)"
                        stroke="#f59e0b"
                        strokeWidth={1}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="annulus_pressure_psia_mean"
                        name="Annulus Pressure (psia)"
                        stroke="#a855f7"
                        strokeWidth={1.8}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* QC Table, Shut-ins, and Gas-Lift Upsets */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Card className="lg:col-span-7">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Per-Well Sensor Data Quality Control (QC) Report</CardTitle>
                  <CardDescription>
                    Gaps up to 36h are reported transparently and never silently filled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2">Well</th>
                          <th className="py-2 text-right">Raw Rows</th>
                          <th className="py-2 text-right">Duplicates</th>
                          <th className="py-2 text-right">Out-of-Order</th>
                          <th className="py-2 text-right">Gaps</th>
                          <th className="py-2 text-right">Max Gap (h)</th>
                          <th className="py-2 text-right">Missing Min</th>
                          <th className="py-2 text-right">% Flagged</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(meta?.sensor_data_quality || []).map((q: any) => (
                          <tr key={q.well_name} className="hover:bg-slate-800/40">
                            <td className="py-2 font-bold text-white">{q.well_name}</td>
                            <td className="py-2 text-right font-mono">{q.rows_raw?.toLocaleString()}</td>
                            <td className="py-2 text-right font-mono text-amber-300">{q.duplicates_removed}</td>
                            <td className="py-2 text-right font-mono text-cyan-300">{q.out_of_order_rows}</td>
                            <td className="py-2 text-right font-mono">{q.gap_count}</td>
                            <td className="py-2 text-right font-mono text-rose-300">{q.longest_gap_hours} h</td>
                            <td className="py-2 text-right font-mono">{q.missing_minutes}</td>
                            <td className="py-2 text-right font-mono font-bold text-emerald-400">
                              {q.pct_values_flagged}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Detected Shut-Ins (Red) vs Field-Wide Gas-Lift Upsets (Orange)
                  </CardTitle>
                  <CardDescription>
                    Upsets (lift gas &lt;70% trailing 24h median while producing) are never sent to PTA
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-rose-300 mb-1.5">
                      6 Confirmed Shut-In Build-Up Events (Choke = 0% + GL Off):
                    </div>
                    <div className="overflow-x-auto max-h-40">
                      <table className="w-full text-[11px] text-left">
                        <thead className="text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-1">Event ID</th>
                            <th className="py-1">Start</th>
                            <th className="py-1 text-right">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {(meta?.shut_in_events || []).map((e: any) => (
                            <tr key={e.event_id}>
                              <td className="py-1.5 font-mono text-white">{e.event_id}</td>
                              <td className="py-1.5 text-slate-300">{String(e.shut_in_start).slice(0, 16)}</td>
                              <td className="py-1.5 text-right font-mono text-emerald-400">
                                {Number(e.duration_hours).toFixed(1)} h
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-amber-300 mb-1.5">
                      10 Field-Wide Gas-Lift Upsets (14 June 2025 Natural Experiment):
                    </div>
                    <div className="overflow-x-auto max-h-40">
                      <table className="w-full text-[11px] text-left">
                        <thead className="text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-1">Well</th>
                            <th className="py-1">Window (14 Jun)</th>
                            <th className="py-1 text-right">Min Ratio</th>
                            <th className="py-1 text-right">Scope</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {(meta?.gas_lift_upsets || []).map((u: any, idx: number) => (
                            <tr key={idx}>
                              <td className="py-1 font-bold text-white">{u.well_name}</td>
                              <td className="py-1 text-slate-300">
                                {String(u.start).slice(11, 16)}–{String(u.end).slice(11, 16)}
                              </td>
                              <td className="py-1 text-right font-mono text-amber-400">
                                {(u.min_ratio_to_baseline * 100).toFixed(0)}%
                              </td>
                              <td className="py-1 text-right">
                                <Badge variant="amber">{u.scope}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: VIRTUAL FLOW METERING (VFM) & LIVE SIMULATOR  */}
        {/* ==================================================== */}
        {activeTab === "vfm" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  2 · Physics-Constrained Virtual Flow Metering (BoundedRidge VFM)
                </h2>
                <p className="text-xs text-slate-400">
                  Enforces negative Pwf slope (≤ −1/5000 psi⁻¹), excludes surface WHP separator-routing trap,
                  and repairs 23 corrupted well-test entries.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="cyber"
                  size="sm"
                  onClick={runPythonRetrain}
                  disabled={retrainLoading || !hasPerm("vfm:retrain")}
                  title={!hasPerm("vfm:retrain") ? "Requires DATA_SCIENTIST or ADMIN role" : ""}
                >
                  <Cpu className="w-4 h-4" />
                  {retrainLoading
                    ? "Running Python Scientific Engine…"
                    : hasPerm("vfm:retrain")
                    ? "Verify / Retrain Live Python VFM"
                    : "🔒 Retrain VFM (Requires Data Scientist / Admin)"}
                </Button>
              </div>
            </div>

            {retrainResult && (
              <Card className="border-emerald-500/50 bg-emerald-950/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    Live Python Subprocess Verification Completed in {retrainResult.elapsed_sec}s
                  </div>
                  <div className="flex flex-wrap gap-4 font-mono">
                    <span>Tests: <strong>{retrainResult.tests_used}</strong></span>
                    <span>Repairs: <strong>{retrainResult.corrections_applied}</strong></span>
                    <span>Ridge α: <strong>{retrainResult.alpha}</strong></span>
                    <span>Held-Out Oil MAPE: <strong className="text-emerald-400">{retrainResult.oil_held_out_mape_pct}%</strong></span>
                    <span>Forward Oil MAPE: <strong className="text-cyan-400">{retrainResult.oil_forward_mape_pct}%</strong></span>
                    <span>Test-Day Bias: <strong className="text-amber-300">+{retrainResult.test_day_bias_pct}%</strong></span>
                  </div>
                </div>
              </Card>
            )}

            {/* Interactive VFM What-If Inflow Simulator + IPR Curve */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Card className="lg:col-span-5 border-emerald-500/30">
                <CardHeader className="pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      Real-Time VFM Inflow Simulator ({selectedWell})
                    </CardTitle>
                    <Badge variant={hasPerm("vfm:simulate") ? "emerald" : "rose"}>
                      {hasPerm("vfm:simulate") ? "Interactive" : "Read-Only Role"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Adjust downhole sensors & choke to compute instant VFM multiphase rates & IPR curve
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-xs">
                  <div className="grid grid-cols-5 gap-1.5">
                    {(bootstrap?.wells || []).map((w: any) => (
                      <button
                        key={w.well_name}
                        onClick={() => setSelectedWell(w.well_name)}
                        className={`py-1 rounded text-xs font-bold ${
                          selectedWell === w.well_name
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-900 text-slate-300 border border-slate-800"
                        }`}
                      >
                        {w.well_name}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">Downhole Flowing Pressure (Pwf)</span>
                        <span className="font-mono font-bold text-cyan-400">{simPwf} psia</span>
                      </div>
                      <input
                        type="range"
                        min={1900}
                        max={3800}
                        step={5}
                        value={simPwf}
                        onChange={(e) => setSimPwf(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">Gas-Lift Injection Rate</span>
                        <span className="font-mono font-bold text-emerald-400">{simLiftGas} Mscf/d</span>
                      </div>
                      <input
                        type="range"
                        min={200}
                        max={1800}
                        step={10}
                        value={simLiftGas}
                        onChange={(e) => setSimLiftGas(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">Choke Bean Size (64ths inch)</span>
                        <span className="font-mono font-bold text-amber-400">{simChoke64} / 64&quot;</span>
                      </div>
                      <input
                        type="range"
                        min={16}
                        max={96}
                        step={2}
                        value={simChoke64}
                        onChange={(e) => setSimChoke64(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400">Downhole Temp (°F)</label>
                        <Input
                          type="number"
                          step="0.5"
                          value={simTemp}
                          onChange={(e) => setSimTemp(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400">Annulus P (psia)</label>
                        <Input
                          type="number"
                          step="10"
                          value={simAnnulus}
                          onChange={(e) => setSimAnnulus(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="cyber"
                    className="w-full"
                    onClick={runVFMSimulation}
                    disabled={simLoading || !hasPerm("vfm:simulate")}
                  >
                    <Play className="w-4 h-4" />
                    {hasPerm("vfm:simulate")
                      ? `Run BoundedRidge VFM Prediction for ${selectedWell}`
                      : "🔒 Role Lacks 'vfm:simulate' Permission"}
                  </Button>

                  {simResult && (
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-center">
                        <div className="text-[10px] text-emerald-300 uppercase">Predicted Oil</div>
                        <div className="text-base font-extrabold text-white mt-0.5">
                          {simResult.oil_rate_stbd}
                        </div>
                        <div className="text-[10px] text-slate-400">STB/d</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-center">
                        <div className="text-[10px] text-cyan-300 uppercase">Predicted Water</div>
                        <div className="text-base font-extrabold text-white mt-0.5">
                          {simResult.water_rate_stbd}
                        </div>
                        <div className="text-[10px] text-slate-400">STB/d ({simResult.water_cut_pct}% WC)</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-center">
                        <div className="text-[10px] text-amber-300 uppercase">Predicted Gas</div>
                        <div className="text-base font-extrabold text-white mt-0.5">
                          {simResult.gas_rate_mscfd}
                        </div>
                        <div className="text-[10px] text-slate-400">Mscf/d</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Validation Tables & IPR / Parity Charts */}
              <div className="lg:col-span-7 space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Honest Validation: Held-Out LOTO (85 Tests) vs Time-Ordered Forward Validation (55 Tests)
                    </CardTitle>
                    <CardDescription>
                      Every test is predicted without ever seeing that test; Forward CV uses only strictly earlier tests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-bold text-emerald-400 mb-2">
                          Held-Out LOTO Validation (85 Well Tests)
                        </div>
                        <table className="w-full text-xs">
                          <thead className="text-slate-400 border-b border-slate-800">
                            <tr>
                              <th className="py-1.5 text-left">Target</th>
                              <th className="py-1.5 text-left">Method</th>
                              <th className="py-1.5 text-right">MAPE</th>
                              <th className="py-1.5 text-right">R²</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {(meta?.validation_metrics || []).map((m: any, i: number) => (
                              <tr key={i} className={m.method === "VFM model" ? "font-bold text-white" : "text-slate-400"}>
                                <td className="py-1.5">{m.target.replace("_rate_stbd", "").replace("_rate_mscfd", "")}</td>
                                <td className="py-1.5">{m.method === "VFM model" ? "✅ VFM Model" : "Baseline Interp."}</td>
                                <td className="py-1.5 text-right font-mono text-emerald-400">{m.MAPE_pct?.toFixed(2)}%</td>
                                <td className="py-1.5 text-right font-mono">{m.R2?.toFixed(3)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-cyan-400 mb-2">
                          Forward Validation — Past Tests Only (55 Tests)
                        </div>
                        <table className="w-full text-xs">
                          <thead className="text-slate-400 border-b border-slate-800">
                            <tr>
                              <th className="py-1.5 text-left">Target</th>
                              <th className="py-1.5 text-left">Method</th>
                              <th className="py-1.5 text-right">MAPE</th>
                              <th className="py-1.5 text-right">R²</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {(meta?.forward_validation_metrics || []).map((m: any, i: number) => (
                              <tr key={i} className={m.method === "VFM model" ? "font-bold text-white" : "text-slate-400"}>
                                <td className="py-1.5">{m.target.replace("_rate_stbd", "").replace("_rate_mscfd", "")}</td>
                                <td className="py-1.5">{m.method === "VFM model" ? "✅ VFM Model" : "Carry-Forward"}</td>
                                <td className="py-1.5 text-right font-mono text-cyan-400">{m.MAPE_pct?.toFixed(2)}%</td>
                                <td className="py-1.5 text-right font-mono">{m.R2?.toFixed(3)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Identity-Checked Well-Test Label Repairs (23 Corrupted Entries Fixed) */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Automated Well-Test Label Repairs (23 Corrupted Entries Recovered via Physical Identities)
                    </CardTitle>
                    <CardDescription>
                      5 negative sign errors flipped when liquid = oil + water confirms magnitude; GL-06 Sm³/d converted to Mscf/d (÷ 28.3168)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto max-h-48">
                      <table className="w-full text-xs text-left">
                        <thead className="text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-1.5">Well</th>
                            <th className="py-1.5">Test Start</th>
                            <th className="py-1.5">Column</th>
                            <th className="py-1.5">Detected Issue</th>
                            <th className="py-1.5 text-right">Original</th>
                            <th className="py-1.5 text-right">Repaired</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {(meta?.well_test_corrections || []).map((c: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-800/40">
                              <td className="py-1.5 font-bold text-white">{c.well_name}</td>
                              <td className="py-1.5 text-slate-300">{String(c.test_start).slice(0, 16)}</td>
                              <td className="py-1.5 font-mono text-cyan-300">{c.column}</td>
                              <td className="py-1.5 text-amber-300">{c.issue}</td>
                              <td className="py-1.5 text-right font-mono text-rose-400">{c.original_value}</td>
                              <td className="py-1.5 text-right font-mono font-bold text-emerald-400">
                                {Number(c.corrected_value).toFixed(1)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: PRESSURE TRANSIENT ANALYSIS (AUTO PTA)        */}
        {/* ==================================================== */}
        {activeTab === "pta" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  3 · Automated Pressure Transient Analysis (Bourdet Derivative & Horner IARF Engine)
                </h2>
                <p className="text-xs text-slate-400">
                  Single-phase oil build-up interpretation driven by VFM predicted daily oil rate (Qo) and cumulative Np.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(bootstrap?.ptaEvents || []).map((ev: any) => {
                  const isGood = ev.properties?.iarf_quality === "good";
                  return (
                    <button
                      key={ev.event_id}
                      onClick={() => setSelectedEventId(ev.event_id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        selectedEventId === ev.event_id
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20"
                          : "bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      <span>{isGood ? "🟢" : "🔴"}</span>
                      <span>{ev.well_name}</span>
                      <span className="text-[10px] opacity-75">({String(ev.properties?.shut_in_start).slice(5, 10)})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {ptaDetail && (
              <>
                {/* 12 Reservoir Property Metric Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  <Card className="p-3.5">
                    <div className="text-[11px] text-slate-400">IARF Radial Quality</div>
                    <div className="mt-1">
                      <Badge
                        variant={ptaDetail.properties.iarf_quality === "good" ? "emerald" : "rose"}
                        className="text-xs"
                      >
                        {ptaDetail.properties.iarf_quality === "good"
                          ? "🟢 Radial flow: GOOD"
                          : "🔴 No stable radial flow (Indicative)"}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Slope: {ptaDetail.properties.derivative_log_slope?.toFixed(3)}
                    </div>
                  </Card>

                  <Card className="p-3.5">
                    <div className="text-[11px] text-slate-400">Horner Slope m</div>
                    <div className="text-xl font-extrabold text-white mt-0.5">
                      {ptaDetail.properties.horner_slope_psi_per_cycle?.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-slate-400">psi/cycle</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      R² = {ptaDetail.properties.horner_fit_r2?.toFixed(4)}
                    </div>
                  </Card>

                  <Card className="p-3.5">
                    <div className="text-[11px] text-slate-400">Permeability ko (Oil)</div>
                    <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
                      {ptaDetail.properties.permeability_md?.toFixed(1)}{" "}
                      <span className="text-xs font-normal text-slate-400">md</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Sweep: {ptaDetail.properties.k_min_md?.toFixed(0)}–{ptaDetail.properties.k_max_md?.toFixed(0)} md
                    </div>
                  </Card>

                  <Card className="p-3.5">
                    <div className="text-[11px] text-slate-400">Skin Factor s & ΔPskin</div>
                    <div
                      className={`text-xl font-extrabold mt-0.5 ${
                        ptaDetail.properties.skin > 1 ? "text-amber-400" : "text-cyan-400"
                      }`}
                    >
                      {ptaDetail.properties.skin > 0
                        ? `+${ptaDetail.properties.skin.toFixed(2)}`
                        : ptaDetail.properties.skin?.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-slate-300">
                        ({ptaDetail.properties.delta_p_skin_psi?.toFixed(0)} psi)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Sweep: {ptaDetail.properties.skin_min?.toFixed(2)} to {ptaDetail.properties.skin_max?.toFixed(2)}
                    </div>
                  </Card>

                  <Card className="p-3.5">
                    <div className="text-[11px] text-slate-400">p* vs Last Measured pws</div>
                    <div className="text-lg font-extrabold text-white mt-0.5">
                      {ptaDetail.properties.p_star_semilog_extrapolation_psia?.toFixed(0)} /{" "}
                      <span className="text-emerald-400">
                        {ptaDetail.properties.last_measured_pws_psia?.toFixed(0)}
                      </span>{" "}
                      <span className="text-[10px] font-normal text-slate-400">psia</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Basis: {ptaDetail.properties.pressure_basis}
                    </div>
                  </Card>

                  <Card className="p-3.5">
                    <div className="text-[11px] text-slate-400">Productivity Index & FE</div>
                    <div className="text-xl font-extrabold text-cyan-400 mt-0.5">
                      {ptaDetail.properties.productivity_index_stbd_psi?.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-slate-400">STB/d/psi</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Flow Eff: {((ptaDetail.properties.flow_efficiency || 0) * 100).toFixed(0)}% · Ri:{" "}
                      {ptaDetail.properties.radius_of_investigation_ft?.toFixed(0)} ft
                    </div>
                  </Card>
                </div>

                {/* Diagnostic Plots + Reservoir Engineer Manual Override Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <Card className="lg:col-span-8">
                    <CardHeader className="pb-2 flex flex-row flex-wrap items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {ptaDetail.event_id} — Diagnostic Plots (Fitted Window:{" "}
                          {ptaDetail.properties.iarf_start_hours?.toFixed(2)}–
                          {ptaDetail.properties.iarf_end_hours?.toFixed(2)} h)
                        </CardTitle>
                        <CardDescription>
                          q_oil = {ptaDetail.properties.q_oil_before_shut_in_stbd?.toFixed(1)} STB/d ({ptaDetail.properties.q_source}) ·
                          window_source = {ptaDetail.properties.window_source}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        {[
                          { id: "loglog", label: "Log-Log Diagnostic" },
                          { id: "horner", label: "Horner Semilog" },
                          { id: "mdh", label: "MDH Plot" },
                          { id: "history", label: "Shut-In History" },
                        ].map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setPtaPlotMode(m.id as any)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                              ptaPlotMode === m.id
                                ? "bg-emerald-500 text-slate-950"
                                : "text-slate-300 hover:text-white"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="h-[360px] pt-2">
                      {ptaPlotMode === "loglog" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={ptaDetail.curves?.points || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                              dataKey="dte_hours"
                              scale="log"
                              domain={["auto", "auto"]}
                              type="number"
                              stroke="#64748b"
                              tick={{ fontSize: 11 }}
                              tickFormatter={(v) => Number(v).toFixed(2)}
                              label={{ value: "Agarwal Equivalent Time Δte (hours, log)", position: "insideBottom", offset: -4, fill: "#94a3b8", fontSize: 11 }}
                            />
                            <YAxis
                              scale="log"
                              domain={["auto", "auto"]}
                              type="number"
                              stroke="#64748b"
                              tick={{ fontSize: 11 }}
                              label={{ value: "Δp & Bourdet Derivative Δp' (psi, log)", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }}
                            />
                            <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line
                              type="monotone"
                              dataKey="dp_psi"
                              name="Pressure Change Δp (psi)"
                              stroke="#38bdf8"
                              strokeWidth={2.2}
                              dot={{ r: 2.5 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="derivative_psi"
                              name="Bourdet Derivative Δp' (psi)"
                              stroke="#f43f5e"
                              strokeWidth={2.2}
                              dot={{ r: 2.5 }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}

                      {ptaPlotMode === "horner" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={ptaDetail.curves?.points || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                              dataKey="log10_horner"
                              type="number"
                              reversed
                              domain={["auto", "auto"]}
                              stroke="#64748b"
                              tick={{ fontSize: 11 }}
                              tickFormatter={(v) => `10^${Number(v).toFixed(1)}`}
                              label={{ value: "Horner Time Ratio (tp + Δt)/Δt (reversed log)", position: "insideBottom", offset: -4, fill: "#94a3b8", fontSize: 11 }}
                            />
                            <YAxis
                              domain={["auto", "auto"]}
                              stroke="#64748b"
                              tick={{ fontSize: 11 }}
                              label={{ value: "Shut-in Pressure pws (psia)", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }}
                            />
                            <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <ReferenceLine
                              y={ptaDetail.properties.last_measured_pws_psia}
                              stroke="#10b981"
                              strokeDasharray="4 4"
                              label={{ value: `Last pws = ${ptaDetail.properties.last_measured_pws_psia?.toFixed(0)} psia`, fill: "#10b981", fontSize: 11 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="pws_psia"
                              name="Measured Shut-In pws (psia)"
                              stroke="#a855f7"
                              strokeWidth={2.4}
                              dot={{ r: 3 }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}

                      {ptaPlotMode === "mdh" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={ptaDetail.curves?.points || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                              dataKey="dt_hours"
                              scale="log"
                              domain={["auto", "auto"]}
                              type="number"
                              stroke="#64748b"
                              tick={{ fontSize: 11 }}
                              tickFormatter={(v) => Number(v).toFixed(2)}
                            />
                            <YAxis domain={["auto", "auto"]} stroke="#64748b" tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line
                              type="monotone"
                              dataKey="pws_psia"
                              name="MDH Semilog pws (psia)"
                              stroke="#10b981"
                              strokeWidth={2.2}
                              dot={{ r: 2.5 }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}

                      {ptaPlotMode === "history" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={ptaDetail.curves?.history || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                              dataKey="timestamp"
                              stroke="#64748b"
                              tick={{ fontSize: 10 }}
                              tickFormatter={(v) => String(v).slice(5, 16)}
                              minTickGap={30}
                            />
                            <YAxis yAxisId="left" domain={["auto", "auto"]} stroke="#38bdf8" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="dh_pressure_psia"
                              name="Downhole Pressure (psia)"
                              stroke="#38bdf8"
                              strokeWidth={2.2}
                              dot={false}
                            />
                            <Line
                              yAxisId="right"
                              type="stepAfter"
                              dataKey="gas_lift_rate_mscfd"
                              name="Gas Lift Rate (Mscf/d)"
                              stroke="#f59e0b"
                              strokeWidth={1.6}
                              dot={false}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Right 4 Cols: Reservoir Engineer Override & Automated Interpretation */}
                  <div className="lg:col-span-4 space-y-4">
                    <Card className="border-emerald-500/30">
                      <CardHeader className="pb-3 border-b border-slate-800">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-emerald-400" />
                            Reservoir Engineer Override
                          </CardTitle>
                          <Badge variant={hasPerm("pta:override") ? "emerald" : "rose"}>
                            {hasPerm("pta:override") ? "Authorised" : "Locked (RBAC)"}
                          </Badge>
                        </div>
                        <CardDescription>
                          Override VFM oil rate Qo or radial-flow window [start, end] (logged in MongoDB Atlas)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3 text-xs">
                        <div>
                          <label className="text-slate-300 block mb-1">
                            Oil Rate Before Shut-In Qo (STB/d)
                          </label>
                          <Input
                            type="number"
                            step="10"
                            value={overrideQ}
                            onChange={(e) => setOverrideQ(e.target.value)}
                            disabled={!hasPerm("pta:override")}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-slate-300 block mb-1">IARF Start (hours)</label>
                            <Input
                              type="number"
                              step="0.2"
                              value={overrideStartH}
                              onChange={(e) => setOverrideStartH(e.target.value)}
                              disabled={!hasPerm("pta:override")}
                            />
                          </div>
                          <div>
                            <label className="text-slate-300 block mb-1">IARF End (hours)</label>
                            <Input
                              type="number"
                              step="0.5"
                              value={overrideEndH}
                              onChange={(e) => setOverrideEndH(e.target.value)}
                              disabled={!hasPerm("pta:override")}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            variant="cyber"
                            size="sm"
                            onClick={() => handlePTAOverride(false)}
                            disabled={ptaOverrideLoading || !hasPerm("pta:override")}
                          >
                            Apply Override
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePTAOverride(true)}
                            disabled={ptaOverrideLoading || !hasPerm("pta:override")}
                          >
                            Reset to Auto
                          </Button>
                        </div>
                        {!hasPerm("pta:override") && (
                          <div className="text-[11px] text-amber-300 bg-amber-950/30 border border-amber-500/30 p-2 rounded-lg">
                            🔒 Switch to <strong>RESERVOIR_ENGINEER</strong> or <strong>ADMIN</strong> in the top bar to unlock PTA overrides.
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Automated Reservoir Diagnostic Interpretation</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-slate-300 space-y-2 leading-relaxed">
                        <p>{ptaDetail.interpretation}</p>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400">
                          <div>• Late-time behaviour: {ptaDetail.properties.late_time_behaviour}</div>
                          <div>• Wellbore storage C: {ptaDetail.properties.wellbore_storage_bbl_psi?.toFixed(4)} bbl/psi</div>
                          <div>• Producing time tp: {ptaDetail.properties.horner_producing_time_hours?.toFixed(0)} h</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: LIFT-GAS OPTIMISER (14 JUNE NATURAL EXP.)     */}
        {/* ==================================================== */}
        {activeTab === "gaslift" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">
                💨 Lift-Gas Allocation Optimiser (Built from the 14 June Field-Wide Natural Experiment)
              </h2>
              <p className="text-xs text-slate-400">
                On 14 June 2025 (10:20–15:02), lift gas dropped ~50% across all 10 wells simultaneously.
                Measuring ΔPwf per 100 Mscf/d cut × PTA Oil PI reveals exact marginal oil value per well.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: Bar Chart & Full Ranking Table */}
              <Card className="lg:col-span-7">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Marginal Oil Gain (STB/d) per +100 Mscf/d of Injected Lift Gas
                  </CardTitle>
                  <CardDescription>
                    Emerald = Measured PI from build-up test · Cyan = Estimated PI (field median, needs build-up test)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-[270px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={meta?.lift_gas_ranking || []}
                        layout="vertical"
                        margin={{ left: 10, right: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="well_name" type="category" stroke="#f8fafc" tick={{ fontSize: 12, fontWeight: 700 }} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: 12 }} />
                        <Bar dataKey="oil_gain_stbd_per_100_mscfd" name="Extra Oil (STB/d per +100 Mscf/d)" radius={[0, 6, 6, 0]}>
                          {(meta?.lift_gas_ranking || []).map((entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.confidence.includes("measured") ? "#10b981" : "#38bdf8"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2">Well</th>
                          <th className="py-2 text-right">14 Jun Gas Cut</th>
                          <th className="py-2 text-right">Measured Pwf Rise</th>
                          <th className="py-2 text-right">Leverage (psi/100Mscf)</th>
                          <th className="py-2 text-right">Oil PI</th>
                          <th className="py-2 text-right">Extra Oil / +100 Mscf</th>
                          <th className="py-2">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(meta?.lift_gas_ranking || []).map((r: any) => (
                          <tr key={r.well_name} className="hover:bg-slate-800/40">
                            <td className="py-2 font-bold text-white">{r.well_name}</td>
                            <td className="py-2 text-right font-mono">{r.lift_gas_cut_mscfd} Mscf/d</td>
                            <td className="py-2 text-right font-mono text-amber-300">+{r.pwf_rise_psi} psi</td>
                            <td className="py-2 text-right font-mono">{r.pwf_rise_psi_per_100_mscfd} psi</td>
                            <td className="py-2 text-right font-mono">{r.oil_pi_stbd_psi}</td>
                            <td className="py-2 text-right font-mono font-bold text-emerald-400">
                              +{r.oil_gain_stbd_per_100_mscfd} STB/d
                            </td>
                            <td className="py-2">
                              <Badge variant={r.confidence.includes("measured") ? "emerald" : "cyan"}>
                                {r.confidence}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Right 5 Cols: Interactive Gas Reallocation Trial Calculator */}
              <Card className="lg:col-span-5 border-emerald-500/30">
                <CardHeader className="pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Flame className="w-4 h-4 text-emerald-400" />
                      Zero-CAPEX Gas Reallocation Simulator
                    </CardTitle>
                    <Badge variant={hasPerm("gaslift:allocate") ? "emerald" : "rose"}>
                      {hasPerm("gaslift:allocate") ? "Production Eng" : "Locked (RBAC)"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Redistribute existing lift gas from low-efficiency wells to high-response wells
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1">Donor Well (Cut Gas From)</label>
                      <select
                        value={donorWell}
                        onChange={(e) => setDonorWell(e.target.value)}
                        className="w-full h-9 rounded-lg bg-slate-950 border border-slate-700 px-3 text-slate-100"
                      >
                        {(meta?.lift_gas_ranking || []).map((r: any) => (
                          <option key={r.well_name} value={r.well_name}>
                            {r.well_name} (+{r.oil_gain_stbd_per_100_mscfd} STB/d)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">Receiver Well (Add Gas To)</label>
                      <select
                        value={receiverWell}
                        onChange={(e) => setReceiverWell(e.target.value)}
                        className="w-full h-9 rounded-lg bg-slate-950 border border-slate-700 px-3 text-slate-100"
                      >
                        {(meta?.lift_gas_ranking || []).map((r: any) => (
                          <option key={r.well_name} value={r.well_name}>
                            {r.well_name} (+{r.oil_gain_stbd_per_100_mscfd} STB/d)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Lift-Gas Shift Step (Mscf/d)</span>
                      <span className="font-mono font-bold text-emerald-400">{shiftMscfd} Mscf/d</span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={300}
                      step={25}
                      value={shiftMscfd}
                      onChange={(e) => setShiftMscfd(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Brent Oil Price Assumption ($/bbl)</span>
                      <span className="font-mono font-bold text-cyan-400">${oilPrice}/bbl</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      step={5}
                      value={oilPrice}
                      onChange={(e) => setOilPrice(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <Button
                    variant="cyber"
                    className="w-full"
                    onClick={runGasLiftAllocation}
                    disabled={!hasPerm("gaslift:allocate")}
                  >
                    {hasPerm("gaslift:allocate")
                      ? `Execute Reallocation Trial (${donorWell} → ${receiverWell})`
                      : "🔒 Requires PRODUCTION_ENGINEER or ADMIN Role"}
                  </Button>

                  {glSimResult && (
                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                      <div className="text-xs font-bold text-emerald-300">
                        Trial Outcome: {glSimResult.donorWell} → {glSimResult.receiverWell} ({glSimResult.shiftMscfd} Mscf/d)
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <div className="text-[11px] text-slate-400">Net Oil Gain</div>
                          <div className="text-xl font-extrabold text-emerald-400">
                            +{glSimResult.netOilGainStbd} STB/d
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Annualized Value</div>
                          <div className="text-xl font-extrabold text-white">
                            +${glSimResult.annualRevenueUsd?.toLocaleString()}/yr
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Receiver gain: +{glSimResult.receiverGainStbd} STB/d · Donor loss: −{glSimResult.donorLossStbd} STB/d
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: REPORTS & DELIVERABLES EXPORT                 */}
        {/* ==================================================== */}
        {activeTab === "export" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">
                4 · Official SOCAR Hackathon 2026 Deliverables & Offline Reports
              </h2>
              <p className="text-xs text-slate-400">
                Download the exact required Excel workbooks and standalone offline Plotly HTML reports directly from the Express server.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-emerald-500/30">
                <CardHeader>
                  <Badge variant="emerald" className="w-fit mb-1">Phase 1 Deliverable (50 Points)</Badge>
                  <CardTitle>Virtual Flow Metering Outputs</CardTitle>
                  <CardDescription>
                    2,730 daily predictions (10 wells × 273 days) with exact required columns:
                    date, well_name, oil_rate_stbd, water_rate_stbd, gas_rate_mscfd + 10 validation sheets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href={`${API_URL}/exports/download/vfm_daily_predictions.xlsx`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition"
                  >
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      Download vfm_daily_predictions.xlsx (11 Sheets)
                    </span>
                    <Download className="w-4 h-4" />
                  </a>
                  <a
                    href={`${API_URL}/exports/download/vfm_report.html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-semibold text-sm hover:bg-slate-800 transition"
                  >
                    <span>Download vfm_report.html (Standalone Offline HTML, 6.0 MB)</span>
                    <Download className="w-4 h-4 text-emerald-400" />
                  </a>
                </CardContent>
              </Card>

              <Card className="border-cyan-500/30">
                <CardHeader>
                  <Badge variant="cyan" className="w-fit mb-1">Phase 2 Deliverable (30 Points)</Badge>
                  <CardTitle>Automated Pressure Transient Analysis Outputs</CardTitle>
                  <CardDescription>
                    All 6 shut-in build-up events with Horner slope, skin, effective oil permeability (md),
                    ΔPskin (psi), IARF quality ratings, and all 24 diagnostic plots.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href={`${API_URL}/exports/download/pta_reservoir_properties.xlsx`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400 transition"
                  >
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      Download pta_reservoir_properties.xlsx
                    </span>
                    <Download className="w-4 h-4" />
                  </a>
                  <a
                    href={`${API_URL}/exports/download/pta_report.html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-semibold text-sm hover:bg-slate-800 transition"
                  >
                    <span>Download pta_report.html (Standalone Offline HTML, 8.2 MB)</span>
                    <Download className="w-4 h-4 text-cyan-400" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: RBAC PERMISSIONS MATRIX & ATLAS AUDIT LOGS    */}
        {/* ==================================================== */}
        {activeTab === "rbac" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">
                Enterprise Role-Based Access Control (RBAC) & MongoDB Atlas Audit Trail
              </h2>
              <p className="text-xs text-slate-400">
                Granular permission enforcement across 5 upstream roles with real-time security logging in MongoDB Atlas.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Card className="lg:col-span-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Active Users & Role Assignments (MongoDB Atlas)</CardTitle>
                  <CardDescription>
                    Admins can modify user roles live; use the top bar switcher to test each persona
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {(rbacOverview?.users || demoAccounts).map((u: any) => (
                      <div
                        key={u.email}
                        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{u.avatar}</span>
                          <div>
                            <div className="font-bold text-sm text-white flex items-center gap-2">
                              {u.name}
                              <Badge variant={ROLE_BADGE_MAP[u.role] || "slate"}>{u.role}</Badge>
                            </div>
                            <div className="text-xs text-slate-400">
                              {u.email} · {u.title}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(u.permissions || []).map((p: string) => (
                                <span
                                  key={p}
                                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-300"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickRoleSwitch(u.email)}
                        >
                          Impersonate Role
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Live MongoDB Atlas Security & Engineering Audit Log</CardTitle>
                  <CardDescription>
                    Every login, role switch, VFM simulation, PTA override, and denied RBAC attempt is recorded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-y-auto max-h-[440px] space-y-2">
                    {(rbacOverview?.auditLogs || []).map((log: any) => (
                      <div
                        key={log._id}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={log.status === "FORBIDDEN" ? "rose" : "emerald"}>
                              {log.module} · {log.action}
                            </Badge>
                            <span className="font-semibold text-white">{log.userName}</span>
                            <span className="text-slate-400">({log.userRole})</span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-400">
                            {JSON.stringify(log.details)}
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 whitespace-nowrap">
                          {String(log.createdAt).slice(11, 19)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function CompassIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
