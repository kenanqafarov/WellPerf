"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as SliderPrimitive from "@radix-ui/react-slider";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  FileSpreadsheet,
  Flame,
  Gauge,
  KeyRound,
  LogOut,
  Play,
  ShieldCheck,
  Sliders,
  Box,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
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
  Label,
  Separator,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/primitives";
import { apiFetch, API_URL } from "@/lib/utils";
import { AppearanceSettings } from "@/components/AppearanceSettings";

const CaspianField3D = dynamic(() => import("@/components/CaspianField3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] rounded-md border border-zinc-800 bg-[rgb(var(--wp-canvas))] flex items-center justify-center text-xs font-mono text-zinc-500">
      Initializing 3D Subsurface Viewport…
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

function ShadcnSlider({
  value,
  min,
  max,
  step,
  onChange,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}) {
  return (
    <SliderPrimitive.Root
      className="relative flex w-full touch-none select-none items-center py-1.5"
      value={[value]}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onValueChange={(vals) => onChange(vals[0])}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-zinc-800">
        <SliderPrimitive.Range className="absolute h-full bg-[#023F46] dark:bg-teal-400" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-3.5 w-3.5 rounded-full border border-[#023F46] dark:border-teal-300 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
}

export default function WellPerfEnterpriseApp() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);
  const [loginEmail, setLoginEmail] = useState("admin@socar.az");
  const [loginPassword, setLoginPassword] = useState("Password123!");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<NavTab>("command");
  const [selectedWell, setSelectedWell] = useState<string>("GL-01");
  const [bootstrap, setBootstrap] = useState<any | null>(null);
  const [wellSeries, setWellSeries] = useState<any | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // VFM Simulator
  const [simPwf, setSimPwf] = useState<number>(3220);
  const [simTemp, setSimTemp] = useState<number>(203.0);
  const [simAnnulus, setSimAnnulus] = useState<number>(1150);
  const [simLiftGas, setSimLiftGas] = useState<number>(820);
  const [simChoke64, setSimChoke64] = useState<number>(48);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [retrainResult, setRetrainResult] = useState<any | null>(null);
  const [retrainLoading, setRetrainLoading] = useState(false);

  // PTA
  const [selectedEventId, setSelectedEventId] = useState<string>("GL-06_20250722_0311");
  const [ptaDetail, setPtaDetail] = useState<any | null>(null);
  const [ptaPlotMode, setPtaPlotMode] = useState<string>("loglog");
  const [overrideQ, setOverrideQ] = useState<string>("");
  const [overrideStartH, setOverrideStartH] = useState<string>("");
  const [overrideEndH, setOverrideEndH] = useState<string>("");
  const [ptaOverrideLoading, setPtaOverrideLoading] = useState(false);

  // Lift-Gas Optimiser
  const [donorWell, setDonorWell] = useState("GL-04");
  const [receiverWell, setReceiverWell] = useState("GL-01");
  const [shiftMscfd, setShiftMscfd] = useState<number>(100);
  const [oilPrice, setOilPrice] = useState<number>(70);
  const [glSimResult, setGlSimResult] = useState<any | null>(null);

  // RBAC
  const [rbacOverview, setRbacOverview] = useState<any | null>(null);

  const showNotice = (text: string, type: "success" | "error" | "info" = "info") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    apiFetch("/auth/demo-accounts")
      .then((res) => setDemoAccounts(res.accounts || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    apiFetch("/field/bootstrap", {}, token)
      .then((data) => {
        setBootstrap(data);
        if (data.ptaEvents?.length && !selectedEventId) {
          setSelectedEventId(data.ptaEvents[0].event_id);
        }
      })
      .catch((err) => showNotice(err.message, "error"));
  }, [token]);

  useEffect(() => {
    if (!token || !selectedWell) return;
    apiFetch(`/wells/${selectedWell}/timeseries`, {}, token)
      .then((data) => {
        setWellSeries(data);
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

  useEffect(() => {
    if (!token || activeTab !== "rbac") return;
    apiFetch("/rbac/overview", {}, token)
      .then(setRbacOverview)
      .catch((err) => showNotice(err.message, "error"));
  }, [token, activeTab, user]);

  // GSAP Staggered Entrance Animation on Tab / View Change
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".gsap-stagger",
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.05,
          ease: "power3.out",
          clearProps: "transform",
        }
      );
    });
    return () => ctx.revert();
  }, [activeTab, token]);

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
      showNotice(`Session active: ${res.user.name} [${res.user.role}]`, "success");
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
      showNotice(`Role switched: ${res.user.role} (${res.user.name})`, "info");
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
        `${selectedWell} VFM: Qo = ${res.oil_rate_stbd} STB/d, Qw = ${res.water_rate_stbd} STB/d`,
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
        `Python VFM verified (${res.elapsed_sec}s): Forward MAPE ${res.oil_forward_mape_pct}%`,
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
      const b = await apiFetch("/field/bootstrap", {}, token);
      setBootstrap(b);
      showNotice(
        reset
          ? `${selectedEventId} reset to automatic IARF window`
          : `${selectedEventId} updated: k = ${res.properties.permeability_md.toFixed(1)} md, s = ${res.properties.skin.toFixed(2)}`,
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
        `Reallocation (${donorWell} → ${receiverWell}): +${res.netOilGainStbd} STB/d (+$${res.annualRevenueUsd.toLocaleString()}/yr)`,
        "success"
      );
    } catch (err: any) {
      showNotice(err.message, "error");
    }
  };

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

  // ==========================================================
  // AUTH SCREEN — Minimalist shadcn/ui Engineering Workbench
  // ==========================================================
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-[rgb(var(--wp-canvas))] text-zinc-100 flex flex-col justify-between">
        <header className="w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-cyan-500 text-zinc-950 flex items-center justify-center font-mono font-bold text-xs shadow-sm">
              WP
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-100">WellPerf</span>
            <Badge variant="cyan" className="font-mono text-[10px]">Enterprise</Badge>
          </div>
          <AppearanceSettings />
        </header>

        <main className="max-w-4xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Quick Workspace Profiles */}
          <div className="lg:col-span-7 space-y-4 gsap-stagger">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                Autonomous Well Surveillance & 3D Twin
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Real-time Virtual Flow Metering, Pressure Transient Diagnostics & Lift-Gas Optimization.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/90">
                <div className="text-[10px] text-zinc-400">VFM Accuracy</div>
                <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">96.3%</div>
              </div>
              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/90">
                <div className="text-[10px] text-zinc-400">Field Production</div>
                <div className="text-base font-mono font-bold text-zinc-100 mt-0.5">14.2k bbl/d</div>
              </div>
              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/90">
                <div className="text-[10px] text-zinc-400">Workover Target</div>
                <div className="text-base font-mono font-bold text-amber-400 mt-0.5">GL-06</div>
              </div>
              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/90">
                <div className="text-[10px] text-zinc-400">Gas-Lift Yield</div>
                <div className="text-base font-mono font-bold text-cyan-400 mt-0.5">+$485k/yr</div>
              </div>
            </div>

            <Card>
              <CardHeader className="py-2.5 px-4 border-b border-zinc-800">
                <CardTitle className="text-xs font-semibold text-zinc-200">
                  Instant Workspace Access
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setLoginEmail(acc.email);
                      handleLogin(acc.email);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/50 hover:border-cyan-500/50 hover:bg-zinc-900 text-left transition"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold text-zinc-100 truncate">{acc.name}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{acc.title}</div>
                    </div>
                    <Badge variant={ROLE_BADGE_MAP[acc.role] || "slate"} className="shrink-0 text-[9px]">
                      {acc.role.split("_")[0]}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Sign-In Card */}
          <div className="lg:col-span-5 gsap-stagger">
            <Card>
              <CardHeader className="space-y-1 border-b border-zinc-800 pb-3">
                <CardTitle className="text-sm font-semibold">Sign In</CardTitle>
                <CardDescription>Enter workspace credentials</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@socar.az"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                {authError && (
                  <div className="p-2 rounded border border-red-900 bg-red-950/50 text-xs text-red-300">
                    {authError}
                  </div>
                )}
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => handleLogin()}
                  disabled={authLoading}
                >
                  {authLoading ? "Signing in…" : "Launch Platform"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="w-full border-t border-zinc-800/80 px-6 py-2.5 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>WellPerf Intelligence Suite</span>
          <span>v2.6 Enterprise</span>
        </footer>
      </div>
    );
  }

  // ==========================================================
  // AUTHENTICATED WORKBENCH — Clean Sidebar + shadcn Layout
  // ==========================================================
  const currentWellProfile = bootstrap?.wells?.find((w: any) => w.well_name === selectedWell);
  const meta = bootstrap?.metadata;

  const navItems: { id: NavTab; label: string; step?: string; icon: any }[] = [
    { id: "command", label: "3D Digital Twin", icon: Box },
    { id: "data", label: "Telemetry & QC", icon: Database },
    { id: "vfm", label: "Virtual Metering", icon: Gauge },
    { id: "pta", label: "Transient PTA", icon: Activity },
    { id: "gaslift", label: "Gas-Lift Optimiser", icon: Flame },
    { id: "export", label: "Reports & Export", icon: FileSpreadsheet },
    { id: "rbac", label: "Access & Audit", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[rgb(var(--wp-canvas))] text-zinc-100 flex flex-col md:flex-row">
      {/* Left Fixed Engineering Sidebar */}
      <aside className="hidden md:flex md:w-56 shrink-0 border-r border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md flex-col justify-between">
        <div>
          {/* Brand Header */}
          <div className="h-12 px-4 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-cyan-500 text-zinc-950 flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                WP
              </div>
              <span className="font-semibold text-sm tracking-tight text-zinc-100">WellPerf</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-400" title="Live Telemetry Connected" />
          </div>

          {/* Well Selector Section */}
          <div className="p-3 border-b border-zinc-800/80">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
              Wells (10)
            </div>
            <div className="grid grid-cols-5 gap-1">
              {(bootstrap?.wells || []).map((w: any) => (
                <button
                  key={w.well_name}
                  onClick={() => setSelectedWell(w.well_name)}
                  className={`py-1 rounded-md text-[11px] font-mono transition ${
                    selectedWell === w.well_name
                      ? "bg-cyan-500 text-zinc-950 font-bold shadow-sm"
                      : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-100 border border-zinc-800"
                  }`}
                >
                  {w.well_name.replace("GL-", "")}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="p-2 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition ${
                    active
                      ? "bg-cyan-500/15 text-cyan-400 font-semibold border border-cyan-500/30"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-cyan-400" : "text-zinc-500"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Box */}
        <div className="p-3 border-t border-zinc-800/80 space-y-2 bg-zinc-950/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-200 truncate">{user.name}</span>
            <Badge variant={ROLE_BADGE_MAP[user.role] || "slate"} className="text-[9px]">
              {user.role.split("_")[0]}
            </Badge>
          </div>
          <select
            aria-label="Workspace Profile"
            value={user.email}
            onChange={(e) => handleQuickRoleSwitch(e.target.value)}
            className="w-full h-7 bg-zinc-900 border border-zinc-800 rounded-md px-2 text-[11px] text-zinc-300 focus:outline-none focus:border-cyan-500"
          >
            {demoAccounts.map((acc) => (
              <option key={acc.email} value={acc.email}>
                {acc.name} ({acc.role.split("_")[0]})
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-[11px]"
            onClick={() => {
              setToken(null);
              setUser(null);
            }}
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-12 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-zinc-200">Caspian Cluster</span>
            <span className="text-zinc-700">/</span>
            <Badge variant="cyan" className="font-mono">{selectedWell}</Badge>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="hidden md:flex items-center gap-4">
              <div>
                <span className="text-zinc-500">Qo </span>
                <span className="text-zinc-100 font-semibold">{fieldTotals.oil.toLocaleString()} bbl/d</span>
              </div>
              <div>
                <span className="text-zinc-500">Qw </span>
                <span className="text-zinc-300">{fieldTotals.water.toLocaleString()} bbl/d</span>
              </div>
              <div>
                <span className="text-zinc-500">MAPE </span>
                <span className="text-emerald-400 font-semibold">3.72%</span>
              </div>
            </div>
            <AppearanceSettings />
          </div>
        </header>

        {/* Toast Banner */}
        {toast && (
          <div
            className={`fixed bottom-4 right-4 z-50 px-3.5 py-2.5 rounded-md border text-xs font-mono shadow-lg ${
              toast.type === "error"
                ? "bg-red-950 border-red-800 text-red-200"
                : toast.type === "success"
                ? "bg-zinc-900 border-emerald-800 text-emerald-300"
                : "bg-zinc-900 border-zinc-700 text-zinc-200"
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* Mobile Navigation Strip */}
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto px-4 py-2 border-b border-zinc-800 bg-zinc-950">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                  active
                    ? "bg-[#023F46] text-white border border-teal-400/40"
                    : "bg-zinc-900 text-zinc-400"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Centralized Workspace Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          <div className="max-w-[1540px] mx-auto w-full space-y-5">
            {/* Compact Awwwards Bento KPI Strip */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5 gsap-stagger">
              <div className="relative overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-950/90 p-3.5 shadow-md">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-500 to-transparent" />
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Oil Production</span>
                  <span className="font-mono text-cyan-400">10 Wells</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-zinc-100">
                    {fieldTotals.oil.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">bbl/d</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-950/90 p-3.5 shadow-md">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 to-transparent" />
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>VFM Accuracy</span>
                  <span className="font-mono text-emerald-400">▲ 38%</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-emerald-400">3.72%</span>
                  <span className="text-[11px] font-mono text-zinc-500">MAPE</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-950/90 p-3.5 shadow-md">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-500 to-transparent" />
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Workover Target</span>
                  <span className="font-mono text-amber-400">292 md</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-amber-400">GL-06</span>
                  <span className="text-[11px] font-mono text-zinc-500">Skin +1.74</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-950/90 p-3.5 shadow-md">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-400 to-emerald-400" />
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Gas-Lift Yield</span>
                  <span className="font-mono text-cyan-400">GL-04→01</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-emerald-400">+$485k</span>
                  <span className="text-[11px] font-mono text-zinc-500">/yr (+19 bbl/d)</span>
                </div>
              </div>
            </div>

          {/* ==================================================== */}
          {/* MODULE 00: 3D SUBSURFACE & OVERVIEW                  */}
          {/* ==================================================== */}
          {activeTab === "command" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  <CaspianField3D
                    wells={bootstrap?.wells || []}
                    latestPredictions={bootstrap?.latestPredictions || []}
                    ptaEvents={bootstrap?.ptaEvents || []}
                    selectedWell={selectedWell}
                    onSelectWell={(w) => setSelectedWell(w)}
                  />
                </div>

                <Card className="lg:col-span-4 flex flex-col justify-between">
                  <CardHeader className="pb-3 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-mono">
                          {selectedWell} — Completion & PVT Properties
                        </CardTitle>
                        <CardDescription>
                          Manifold {currentWellProfile?.completion?.production_manifold || "A"} · Completed{" "}
                          {currentWellProfile?.completion?.first_production_date}
                        </CardDescription>
                      </div>
                      <Badge variant="default" className="font-mono">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 flex-1 flex flex-col justify-between space-y-4">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-zinc-400 py-2">Gauge / Datum TVD</TableCell>
                          <TableCell className="text-right font-mono py-2">
                            {currentWellProfile?.completion?.gauge_tvd_ft} / {currentWellProfile?.pvt?.datum_tvd_ft} ft
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-zinc-400 py-2">Gas-Lift Valve TVD</TableCell>
                          <TableCell className="text-right font-mono py-2">
                            {currentWellProfile?.completion?.gl_valve_tvd_ft} ft ({currentWellProfile?.completion?.gl_valve_port_64ths}/64&quot;)
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-zinc-400 py-2">Net Pay & Porosity</TableCell>
                          <TableCell className="text-right font-mono py-2">
                            {currentWellProfile?.pvt?.net_pay_thickness_ft} ft ·{" "}
                            {((currentWellProfile?.pvt?.porosity_frac || 0) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-zinc-400 py-2">Oil Viscosity & FVF</TableCell>
                          <TableCell className="text-right font-mono py-2">
                            {currentWellProfile?.pvt?.oil_viscosity_cp} cp · {currentWellProfile?.pvt?.oil_fvf_rb_stb} rb/stb
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-zinc-400 py-2">Cum. Oil (1 Jan 2025)</TableCell>
                          <TableCell className="text-right font-mono py-2">
                            {((currentWellProfile?.completion?.cum_oil_at_2025_01_01_stb || 0) / 1e6).toFixed(3)} MMstb
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-zinc-400 py-2">Pwf Sensitivity (+10 psi)</TableCell>
                          <TableCell className="text-right font-mono py-2">
                            {currentWellProfile?.sensitivity?.liquid_pct_per_10psi_pwf?.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-zinc-400 py-2">Marginal Lift-Gas Value</TableCell>
                          <TableCell className="text-right font-mono text-emerald-400 py-2">
                            +{currentWellProfile?.lift_gas_rank?.oil_gain_stbd_per_100_mscfd?.toFixed(1)} STB/d per 100 Mscf
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setActiveTab("vfm")}>
                        VFM Inflow Model
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setActiveTab("data")}>
                        Sensor QC & Events
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-7">
                  <CardHeader className="pb-2 border-b border-zinc-800 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">
                        {selectedWell} — Daily Production Rates (VFM Predictions)
                      </CardTitle>
                      <CardDescription>
                        273 calendar days (Jan–Sep 2025) · Oil & Water (STB/d, left) · Gas (Mscf/d, right)
                      </CardDescription>
                    </div>
                    <Badge variant="default" className="font-mono">P10–P90 Calibrated</Badge>
                  </CardHeader>
                  <CardContent className="h-[300px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={wellSeries?.predictions || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 11 }} minTickGap={28} />
                        <YAxis yAxisId="left" stroke="#a1a1aa" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#71717a" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="oil_rate_stbd"
                          name="Oil Rate (STB/d)"
                          stroke="#10b981"
                          strokeWidth={1.75}
                          dot={false}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="water_rate_stbd"
                          name="Water Rate (STB/d)"
                          stroke="#38bdf8"
                          strokeWidth={1.5}
                          dot={false}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="gas_rate_mscfd"
                          name="Gas Rate (Mscf/d)"
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-5">
                  <CardHeader className="pb-2 border-b border-zinc-800 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">PTA Shut-In Build-Up Summary (6 Events)</CardTitle>
                      <CardDescription>Click any row to open diagnostic plots & Horner analysis</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("pta")}>
                      Open PTA →
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Well</TableHead>
                          <TableHead>IARF Quality</TableHead>
                          <TableHead className="text-right">ko (md)</TableHead>
                          <TableHead className="text-right">Skin s</TableHead>
                          <TableHead className="text-right">ΔPskin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(bootstrap?.ptaEvents || []).map((ev: any) => {
                          const p = ev.properties;
                          const isGood = p.iarf_quality === "good";
                          return (
                            <TableRow
                              key={ev.event_id}
                              className="cursor-pointer"
                              onClick={() => {
                                setSelectedEventId(ev.event_id);
                                setActiveTab("pta");
                              }}
                            >
                              <TableCell className="font-mono font-medium text-zinc-100">{ev.well_name}</TableCell>
                              <TableCell>
                                <Badge variant={isGood ? "emerald" : "rose"}>
                                  {isGood ? "good" : "no_radial_flow"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {p.permeability_md?.toFixed(1)}
                              </TableCell>
                              <TableCell
                                className={`text-right font-mono font-medium ${
                                  p.skin > 1 ? "text-amber-400" : "text-zinc-200"
                                }`}
                              >
                                {p.skin > 0 ? `+${p.skin.toFixed(2)}` : p.skin.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-zinc-400">
                                {p.delta_p_skin_psi?.toFixed(1)} psi
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* MODULE 01: FIELD DATA, SENSOR ENVELOPES & QC         */}
          {/* ==================================================== */}
          {activeTab === "data" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">
                  01 · Field Sensor Telemetry, Data-Quality Checks & Event Classification
                </h2>
                <p className="text-xs text-zinc-400">
                  Per-minute data cleaned for -999.25 sentinels, duplicate/unordered timestamps, 11-minute rolling-median spikes, and ≥60-minute frozen runs.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2 border-b border-zinc-800">
                    <CardTitle className="text-sm">
                      {selectedWell} — Downhole Flowing Pressure (dh_pressure_psia) Envelope
                    </CardTitle>
                    <CardDescription>Daily min / mean / max envelope preserves spikes and build-up peaks</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[270px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={wellSeries?.sensors || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 11 }} minTickGap={25} />
                        <YAxis stroke="#a1a1aa" domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="dh_pressure_psia_max" name="Max Pwf (psia)" stroke="#f43f5e" strokeWidth={1} dot={false} />
                        <Line type="monotone" dataKey="dh_pressure_psia_mean" name="Mean Pwf (psia)" stroke="#e4e4e7" strokeWidth={1.75} dot={false} />
                        <Line type="monotone" dataKey="dh_pressure_psia_min" name="Min Pwf (psia)" stroke="#52525b" strokeWidth={1} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 border-b border-zinc-800">
                    <CardTitle className="text-sm">
                      {selectedWell} — Gas-Lift Injection Rate & Annulus Pressure
                    </CardTitle>
                    <CardDescription>14 June 2025 field-wide gas-lift upset visible across all 10 wells</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[270px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={wellSeries?.sensors || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 11 }} minTickGap={25} />
                        <YAxis yAxisId="left" stroke="#a1a1aa" domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#71717a" domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line yAxisId="left" type="monotone" dataKey="gas_lift_rate_mscfd_mean" name="Mean Gas Lift (Mscf/d)" stroke="#10b981" strokeWidth={1.75} dot={false} />
                        <Line yAxisId="left" type="monotone" dataKey="gas_lift_rate_mscfd_min" name="Min Gas Lift (Mscf/d)" stroke="#f59e0b" strokeWidth={1} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="annulus_pressure_psia_mean" name="Annulus P (psia)" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-7">
                  <CardHeader className="pb-2 border-b border-zinc-800">
                    <CardTitle className="text-sm">Per-Well Sensor Data Quality Control (QC) Table</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Well</TableHead>
                          <TableHead className="text-right">Raw Rows</TableHead>
                          <TableHead className="text-right">Duplicates</TableHead>
                          <TableHead className="text-right">Disordered</TableHead>
                          <TableHead className="text-right">Gaps</TableHead>
                          <TableHead className="text-right">Max Gap</TableHead>
                          <TableHead className="text-right">Missing Min</TableHead>
                          <TableHead className="text-right">% Flagged</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(meta?.sensor_data_quality || []).map((q: any) => (
                          <TableRow key={q.well_name}>
                            <TableCell className="font-mono font-medium text-zinc-100">{q.well_name}</TableCell>
                            <TableCell className="text-right font-mono">{q.rows_raw?.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono">{q.duplicates_removed}</TableCell>
                            <TableCell className="text-right font-mono">{q.out_of_order_rows}</TableCell>
                            <TableCell className="text-right font-mono">{q.gap_count}</TableCell>
                            <TableCell className="text-right font-mono">{q.longest_gap_hours} h</TableCell>
                            <TableCell className="text-right font-mono">{q.missing_minutes}</TableCell>
                            <TableCell className="text-right font-mono text-emerald-400">{q.pct_values_flagged}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-5">
                  <CardHeader className="pb-2 border-b border-zinc-800">
                    <CardTitle className="text-sm">Shut-Ins (6) vs Gas-Lift Upsets (10)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <TabsPrimitive.Root defaultValue="shutins">
                      <TabsPrimitive.List className="flex border-b border-zinc-800 bg-zinc-900/40 px-3 pt-2 gap-2">
                        <TabsPrimitive.Trigger
                          value="shutins"
                          className="px-3 py-1.5 text-xs font-medium border-b-2 border-transparent data-[state=active]:border-zinc-100 data-[state=active]:text-zinc-100 text-zinc-400"
                        >
                          Shut-In Events (6)
                        </TabsPrimitive.Trigger>
                        <TabsPrimitive.Trigger
                          value="upsets"
                          className="px-3 py-1.5 text-xs font-medium border-b-2 border-transparent data-[state=active]:border-zinc-100 data-[state=active]:text-zinc-100 text-zinc-400"
                        >
                          Gas-Lift Upsets (10)
                        </TabsPrimitive.Trigger>
                      </TabsPrimitive.List>
                      <TabsPrimitive.Content value="shutins">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Event ID</TableHead>
                              <TableHead>Start</TableHead>
                              <TableHead className="text-right">Duration</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(meta?.shut_in_events || []).map((e: any) => (
                              <TableRow key={e.event_id}>
                                <TableCell className="font-mono text-zinc-100">{e.event_id}</TableCell>
                                <TableCell className="font-mono text-zinc-400">{String(e.shut_in_start).slice(0, 16)}</TableCell>
                                <TableCell className="text-right font-mono">{Number(e.duration_hours).toFixed(1)} h</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TabsPrimitive.Content>
                      <TabsPrimitive.Content value="upsets">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Well</TableHead>
                              <TableHead>14 Jun Window</TableHead>
                              <TableHead className="text-right">Min Ratio</TableHead>
                              <TableHead className="text-right">Scope</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(meta?.gas_lift_upsets || []).map((u: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono text-zinc-100">{u.well_name}</TableCell>
                                <TableCell className="font-mono text-zinc-400">
                                  {String(u.start).slice(11, 16)}–{String(u.end).slice(11, 16)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-amber-400">
                                  {(u.min_ratio_to_baseline * 100).toFixed(0)}%
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="amber">{u.scope}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TabsPrimitive.Content>
                    </TabsPrimitive.Root>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* MODULE 02: VIRTUAL FLOW METERING (VFM)               */}
          {/* ==================================================== */}
          {activeTab === "vfm" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">
                    02 · Virtual Flow Metering (Physics-Constrained BoundedRidge Regression)
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Per-well centered downhole pressure slope constrained negative (≤ −1/5000 psi⁻¹). Surface WHP excluded to prevent test-separator routing bias.
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={runPythonRetrain}
                  disabled={retrainLoading || !hasPerm("vfm:retrain")}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  {retrainLoading
                    ? "Executing Python Engine…"
                    : hasPerm("vfm:retrain")
                    ? "Run Python VFM Verification"
                    : "Retrain Locked (Requires Data Scientist / Admin)"}
                </Button>
              </div>

              {retrainResult && (
                <Card className="p-3.5 border-zinc-700 bg-zinc-900/50">
                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Python Subprocess Verified ({retrainResult.elapsed_sec}s)
                    </span>
                    <span>Tests: {retrainResult.tests_used}</span>
                    <span>Repairs: {retrainResult.corrections_applied}</span>
                    <span>Ridge α: {retrainResult.alpha}</span>
                    <span>Held-Out Oil MAPE: {retrainResult.oil_held_out_mape_pct}%</span>
                    <span>Forward Oil MAPE: {retrainResult.oil_forward_mape_pct}%</span>
                    <span>Routing Bias: +{retrainResult.test_day_bias_pct}%</span>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 5 Cols: Interactive VFM Simulator */}
                <Card className="lg:col-span-5">
                  <CardHeader className="pb-3 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        VFM Parameter Simulator ({selectedWell})
                      </CardTitle>
                      <Badge variant={hasPerm("vfm:simulate") ? "emerald" : "slate"}>
                        {hasPerm("vfm:simulate") ? "vfm:simulate" : "Read-Only"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Evaluate BoundedRidge design matrix on custom sensor inputs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4 text-xs">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <Label>Downhole Flowing Pressure (Pwf)</Label>
                          <span className="font-mono text-zinc-200">{simPwf} psia</span>
                        </div>
                        <ShadcnSlider
                          value={simPwf}
                          min={1900}
                          max={3800}
                          step={5}
                          onChange={setSimPwf}
                          disabled={!hasPerm("vfm:simulate")}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <Label>Gas-Lift Injection Rate</Label>
                          <span className="font-mono text-zinc-200">{simLiftGas} Mscf/d</span>
                        </div>
                        <ShadcnSlider
                          value={simLiftGas}
                          min={200}
                          max={1800}
                          step={10}
                          onChange={setSimLiftGas}
                          disabled={!hasPerm("vfm:simulate")}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <Label>Choke Size (64ths inch)</Label>
                          <span className="font-mono text-zinc-200">{simChoke64} / 64&quot;</span>
                        </div>
                        <ShadcnSlider
                          value={simChoke64}
                          min={16}
                          max={96}
                          step={2}
                          onChange={setSimChoke64}
                          disabled={!hasPerm("vfm:simulate")}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <Label>Downhole Temp (°F)</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={simTemp}
                            onChange={(e) => setSimTemp(Number(e.target.value))}
                            disabled={!hasPerm("vfm:simulate")}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Annulus Pressure (psia)</Label>
                          <Input
                            type="number"
                            step="10"
                            value={simAnnulus}
                            onChange={(e) => setSimAnnulus(Number(e.target.value))}
                            disabled={!hasPerm("vfm:simulate")}
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="default"
                      className="w-full"
                      onClick={runVFMSimulation}
                      disabled={simLoading || !hasPerm("vfm:simulate")}
                    >
                      <Play className="w-3.5 h-3.5" />
                      {hasPerm("vfm:simulate")
                        ? `Compute VFM Rates for ${selectedWell}`
                        : "Requires 'vfm:simulate' Permission"}
                    </Button>

                    {simResult && (
                      <div className="grid grid-cols-3 border border-zinc-800 rounded-md divide-x divide-zinc-800 bg-zinc-900/40">
                        <div className="p-2.5 text-center">
                          <div className="text-[10px] text-zinc-400">Oil Rate</div>
                          <div className="text-sm font-mono font-semibold text-emerald-400 mt-0.5">
                            {simResult.oil_rate_stbd}
                          </div>
                          <div className="text-[10px] text-zinc-500">STB/d</div>
                        </div>
                        <div className="p-2.5 text-center">
                          <div className="text-[10px] text-zinc-400">Water Rate</div>
                          <div className="text-sm font-mono font-semibold text-zinc-100 mt-0.5">
                            {simResult.water_rate_stbd}
                          </div>
                          <div className="text-[10px] text-zinc-500">STB/d ({simResult.water_cut_pct}%)</div>
                        </div>
                        <div className="p-2.5 text-center">
                          <div className="text-[10px] text-zinc-400">Gas Rate</div>
                          <div className="text-sm font-mono font-semibold text-amber-400 mt-0.5">
                            {simResult.gas_rate_mscfd}
                          </div>
                          <div className="text-[10px] text-zinc-500">Mscf/d</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Right 7 Cols: Validation & Label Repairs Tabs */}
                <Card className="lg:col-span-7">
                  <TabsPrimitive.Root defaultValue="cv">
                    <CardHeader className="pb-0 border-b border-zinc-800">
                      <div className="flex items-center justify-between pb-2">
                        <CardTitle className="text-sm">Model Validation & Well-Test Hygiene</CardTitle>
                        <TabsPrimitive.List className="flex bg-zinc-900 p-0.5 rounded border border-zinc-800">
                          <TabsPrimitive.Trigger
                            value="cv"
                            className="px-2.5 py-1 text-xs rounded-sm data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-950 text-zinc-400"
                          >
                            Validation Metrics
                          </TabsPrimitive.Trigger>
                          <TabsPrimitive.Trigger
                            value="sens"
                            className="px-2.5 py-1 text-xs rounded-sm data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-950 text-zinc-400"
                          >
                            Sensitivities
                          </TabsPrimitive.Trigger>
                          <TabsPrimitive.Trigger
                            value="repairs"
                            className="px-2.5 py-1 text-xs rounded-sm data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-950 text-zinc-400"
                          >
                            23 Test Repairs
                          </TabsPrimitive.Trigger>
                        </TabsPrimitive.List>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      <TabsPrimitive.Content value="cv" className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border border-zinc-800 rounded-md overflow-hidden">
                            <div className="bg-zinc-900/60 px-3 py-2 text-xs font-medium border-b border-zinc-800">
                              Held-Out LOTO Validation (85 Tests)
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Phase</TableHead>
                                  <TableHead>Method</TableHead>
                                  <TableHead className="text-right">MAPE</TableHead>
                                  <TableHead className="text-right">R²</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(meta?.validation_metrics || []).map((m: any, i: number) => (
                                  <TableRow key={i}>
                                    <TableCell className="font-mono">{m.target.split("_")[0]}</TableCell>
                                    <TableCell className={m.method === "VFM model" ? "font-semibold text-zinc-100" : "text-zinc-500"}>
                                      {m.method === "VFM model" ? "VFM Model" : "Interp. Baseline"}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-emerald-400">
                                      {m.MAPE_pct?.toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{m.R2?.toFixed(3)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          <div className="border border-zinc-800 rounded-md overflow-hidden">
                            <div className="bg-zinc-900/60 px-3 py-2 text-xs font-medium border-b border-zinc-800">
                              Forward Validation — Earlier Tests Only (55 Tests)
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Phase</TableHead>
                                  <TableHead>Method</TableHead>
                                  <TableHead className="text-right">MAPE</TableHead>
                                  <TableHead className="text-right">R²</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(meta?.forward_validation_metrics || []).map((m: any, i: number) => (
                                  <TableRow key={i}>
                                    <TableCell className="font-mono">{m.target.split("_")[0]}</TableCell>
                                    <TableCell className={m.method === "VFM model" ? "font-semibold text-zinc-100" : "text-zinc-500"}>
                                      {m.method === "VFM model" ? "VFM Model" : "Carry-Forward"}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-emerald-400">
                                      {m.MAPE_pct?.toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{m.R2?.toFixed(3)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </TabsPrimitive.Content>

                      <TabsPrimitive.Content value="sens">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Well</TableHead>
                              <TableHead className="text-right">Liquid % per +10 psi Pwf</TableHead>
                              <TableHead className="text-right">Liquid % per +10% Lift Gas</TableHead>
                              <TableHead className="text-right">Liquid % per +10% Choke</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(meta?.sensitivities || []).map((s: any) => (
                              <TableRow key={s.well_name}>
                                <TableCell className="font-mono font-medium text-zinc-100">{s.well_name}</TableCell>
                                <TableCell className="text-right font-mono text-emerald-400">
                                  {s.liquid_pct_per_10psi_pwf?.toFixed(3)}%
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  +{s.liquid_pct_per_10pct_lift_gas?.toFixed(3)}%
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  +{s.liquid_pct_per_10pct_choke?.toFixed(3)}%
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TabsPrimitive.Content>

                      <TabsPrimitive.Content value="repairs" className="max-h-[320px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Well</TableHead>
                              <TableHead>Test Start</TableHead>
                              <TableHead>Column</TableHead>
                              <TableHead>Issue Repaired</TableHead>
                              <TableHead className="text-right">Original</TableHead>
                              <TableHead className="text-right">Corrected</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(meta?.well_test_corrections || []).map((c: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono font-medium">{c.well_name}</TableCell>
                                <TableCell className="font-mono text-zinc-400">{String(c.test_start).slice(0, 16)}</TableCell>
                                <TableCell className="font-mono">{c.column}</TableCell>
                                <TableCell className="text-zinc-400">{c.issue}</TableCell>
                                <TableCell className="text-right font-mono text-red-400">{c.original_value}</TableCell>
                                <TableCell className="text-right font-mono text-emerald-400">
                                  {Number(c.corrected_value).toFixed(1)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TabsPrimitive.Content>
                    </CardContent>
                  </TabsPrimitive.Root>
                </Card>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* MODULE 03: PRESSURE TRANSIENT ANALYSIS (AUTO PTA)    */}
          {/* ==================================================== */}
          {activeTab === "pta" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">
                    03 · Automated Pressure Transient Analysis (Bourdet Derivative & Horner Semilog)
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Driven by VFM predicted oil rate Qo before shut-in and cumulative Np. Evaluates radial-flow stability across tolerances 0.08–0.20.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(bootstrap?.ptaEvents || []).map((ev: any) => {
                    const isGood = ev.properties?.iarf_quality === "good";
                    return (
                      <button
                        key={ev.event_id}
                        onClick={() => setSelectedEventId(ev.event_id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono border transition ${
                          selectedEventId === ev.event_id
                            ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold"
                            : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-900"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isGood ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span>{ev.well_name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {ptaDetail && (
                <>
                  {/* 6 PTA Parameter Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border border-zinc-800 rounded-md divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 bg-zinc-950">
                    <div className="p-3">
                      <div className="text-[11px] text-zinc-400">Radial Flow Quality</div>
                      <div className="mt-1">
                        <Badge variant={ptaDetail.properties.iarf_quality === "good" ? "emerald" : "rose"}>
                          {ptaDetail.properties.iarf_quality}
                        </Badge>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-1">
                        d log(Δp&apos;)/d log(t) = {ptaDetail.properties.derivative_log_slope?.toFixed(3)}
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="text-[11px] text-zinc-400">Horner Slope m</div>
                      <div className="text-base font-mono font-semibold text-zinc-100 mt-1">
                        {ptaDetail.properties.horner_slope_psi_per_cycle?.toFixed(2)} psi/cyc
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        R² = {ptaDetail.properties.horner_fit_r2?.toFixed(4)}
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="text-[11px] text-zinc-400">Effective Oil Perm. ko</div>
                      <div className="text-base font-mono font-semibold text-emerald-400 mt-1">
                        {ptaDetail.properties.permeability_md?.toFixed(1)} md
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        Range: {ptaDetail.properties.k_min_md?.toFixed(0)}–{ptaDetail.properties.k_max_md?.toFixed(0)} md
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="text-[11px] text-zinc-400">Skin s & ΔPskin</div>
                      <div className="text-base font-mono font-semibold text-zinc-100 mt-1">
                        {ptaDetail.properties.skin > 0
                          ? `+${ptaDetail.properties.skin.toFixed(2)}`
                          : ptaDetail.properties.skin?.toFixed(2)}{" "}
                        <span className="text-xs font-normal text-zinc-400">
                          ({ptaDetail.properties.delta_p_skin_psi?.toFixed(0)} psi)
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        Range: {ptaDetail.properties.skin_min?.toFixed(2)}..{ptaDetail.properties.skin_max?.toFixed(2)}
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="text-[11px] text-zinc-400">p* / Last Measured pws</div>
                      <div className="text-base font-mono font-semibold text-zinc-100 mt-1">
                        {ptaDetail.properties.p_star_semilog_extrapolation_psia?.toFixed(0)} /{" "}
                        {ptaDetail.properties.last_measured_pws_psia?.toFixed(0)}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        Basis: {ptaDetail.properties.pressure_basis}
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="text-[11px] text-zinc-400">Productivity Index & Ri</div>
                      <div className="text-base font-mono font-semibold text-zinc-100 mt-1">
                        {ptaDetail.properties.productivity_index_stbd_psi?.toFixed(2)} STB/d/psi
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        FE: {((ptaDetail.properties.flow_efficiency || 0) * 100).toFixed(0)}% · Ri:{" "}
                        {ptaDetail.properties.radius_of_investigation_ft?.toFixed(0)} ft
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <Card className="lg:col-span-8">
                      <TabsPrimitive.Root value={ptaPlotMode} onValueChange={setPtaPlotMode}>
                        <CardHeader className="pb-2 border-b border-zinc-800 flex flex-row flex-wrap items-center justify-between gap-2">
                          <div>
                            <CardTitle className="text-sm font-mono">
                              {ptaDetail.event_id} — Window {ptaDetail.properties.iarf_start_hours?.toFixed(2)}–
                              {ptaDetail.properties.iarf_end_hours?.toFixed(2)} h ({ptaDetail.properties.window_source})
                            </CardTitle>
                            <CardDescription>
                              Qo = {ptaDetail.properties.q_oil_before_shut_in_stbd?.toFixed(1)} STB/d ({ptaDetail.properties.q_source})
                            </CardDescription>
                          </div>
                          <TabsPrimitive.List className="flex bg-zinc-900 p-0.5 rounded border border-zinc-800">
                            <TabsPrimitive.Trigger
                              value="loglog"
                              className="px-2.5 py-1 text-xs rounded-sm data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-950 text-zinc-400"
                            >
                              Log-Log
                            </TabsPrimitive.Trigger>
                            <TabsPrimitive.Trigger
                              value="horner"
                              className="px-2.5 py-1 text-xs rounded-sm data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-950 text-zinc-400"
                            >
                              Horner
                            </TabsPrimitive.Trigger>
                            <TabsPrimitive.Trigger
                              value="mdh"
                              className="px-2.5 py-1 text-xs rounded-sm data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-950 text-zinc-400"
                            >
                              MDH
                            </TabsPrimitive.Trigger>
                            <TabsPrimitive.Trigger
                              value="history"
                              className="px-2.5 py-1 text-xs rounded-sm data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-950 text-zinc-400"
                            >
                              History
                            </TabsPrimitive.Trigger>
                          </TabsPrimitive.List>
                        </CardHeader>

                        <CardContent className="h-[340px] pt-4">
                          {ptaPlotMode === "loglog" && (
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={ptaDetail.curves?.points || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis
                                  dataKey="dte_hours"
                                  scale="log"
                                  domain={["auto", "auto"]}
                                  type="number"
                                  stroke="#71717a"
                                  tick={{ fontSize: 11 }}
                                  tickFormatter={(v) => Number(v).toFixed(2)}
                                />
                                <YAxis
                                  scale="log"
                                  domain={["auto", "auto"]}
                                  type="number"
                                  stroke="#71717a"
                                  tick={{ fontSize: 11 }}
                                />
                                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", fontSize: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line type="monotone" dataKey="dp_psi" name="Δp (psi)" stroke="#e4e4e7" strokeWidth={1.75} dot={{ r: 2 }} />
                                <Line type="monotone" dataKey="derivative_psi" name="Bourdet Derivative Δp' (psi)" stroke="#f43f5e" strokeWidth={1.75} dot={{ r: 2 }} />
                              </ComposedChart>
                            </ResponsiveContainer>
                          )}

                          {ptaPlotMode === "horner" && (
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={ptaDetail.curves?.points || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis
                                  dataKey="log10_horner"
                                  type="number"
                                  reversed
                                  domain={["auto", "auto"]}
                                  stroke="#71717a"
                                  tick={{ fontSize: 11 }}
                                  tickFormatter={(v) => `10^${Number(v).toFixed(1)}`}
                                />
                                <YAxis domain={["auto", "auto"]} stroke="#71717a" tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", fontSize: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <ReferenceLine
                                  y={ptaDetail.properties.last_measured_pws_psia}
                                  stroke="#10b981"
                                  strokeDasharray="4 4"
                                />
                                <Line type="monotone" dataKey="pws_psia" name="Shut-in Pressure pws (psia)" stroke="#e4e4e7" strokeWidth={2} dot={{ r: 2.5 }} />
                              </ComposedChart>
                            </ResponsiveContainer>
                          )}

                          {ptaPlotMode === "mdh" && (
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={ptaDetail.curves?.points || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis
                                  dataKey="dt_hours"
                                  scale="log"
                                  domain={["auto", "auto"]}
                                  type="number"
                                  stroke="#71717a"
                                  tick={{ fontSize: 11 }}
                                  tickFormatter={(v) => Number(v).toFixed(2)}
                                />
                                <YAxis domain={["auto", "auto"]} stroke="#71717a" tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", fontSize: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line type="monotone" dataKey="pws_psia" name="MDH Semilog pws (psia)" stroke="#10b981" strokeWidth={1.75} dot={{ r: 2 }} />
                              </ComposedChart>
                            </ResponsiveContainer>
                          )}

                          {ptaPlotMode === "history" && (
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={ptaDetail.curves?.history || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis
                                  dataKey="timestamp"
                                  stroke="#71717a"
                                  tick={{ fontSize: 10 }}
                                  tickFormatter={(v) => String(v).slice(5, 16)}
                                  minTickGap={30}
                                />
                                <YAxis yAxisId="left" domain={["auto", "auto"]} stroke="#a1a1aa" tick={{ fontSize: 11 }} />
                                <YAxis yAxisId="right" orientation="right" stroke="#71717a" tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", fontSize: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line yAxisId="left" type="monotone" dataKey="dh_pressure_psia" name="Downhole P (psia)" stroke="#e4e4e7" strokeWidth={1.75} dot={false} />
                                <Line yAxisId="right" type="stepAfter" dataKey="gas_lift_rate_mscfd" name="Gas Lift (Mscf/d)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                              </ComposedChart>
                            </ResponsiveContainer>
                          )}
                        </CardContent>
                      </TabsPrimitive.Root>
                    </Card>

                    <div className="lg:col-span-4 space-y-4">
                      <Card>
                        <CardHeader className="pb-3 border-b border-zinc-800">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Manual Parameter Override</CardTitle>
                            <Badge variant={hasPerm("pta:override") ? "emerald" : "slate"}>
                              {hasPerm("pta:override") ? "pta:override" : "Locked"}
                            </Badge>
                          </div>
                          <CardDescription>
                            Override Qo or radial-flow window [start, end]
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3 text-xs">
                          <div className="space-y-1">
                            <Label>Pre-Shut-In Oil Rate Qo (STB/d)</Label>
                            <Input
                              type="number"
                              step="10"
                              value={overrideQ}
                              onChange={(e) => setOverrideQ(e.target.value)}
                              disabled={!hasPerm("pta:override")}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                              <Label>IARF Start (h)</Label>
                              <Input
                                type="number"
                                step="0.2"
                                value={overrideStartH}
                                onChange={(e) => setOverrideStartH(e.target.value)}
                                disabled={!hasPerm("pta:override")}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>IARF End (h)</Label>
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
                              variant="default"
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
                              Reset Auto
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2 border-b border-zinc-800">
                          <CardTitle className="text-sm">Engineering Interpretation</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-3 text-xs text-zinc-300 space-y-2 leading-relaxed">
                          <p>{ptaDetail.interpretation}</p>
                          <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900/40 font-mono text-[11px] text-zinc-400 space-y-0.5">
                            <div>Late-time: {ptaDetail.properties.late_time_behaviour}</div>
                            <div>Storage C: {ptaDetail.properties.wellbore_storage_bbl_psi?.toFixed(4)} bbl/psi</div>
                            <div>Horner tp: {ptaDetail.properties.horner_producing_time_hours?.toFixed(0)} h</div>
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
          {/* MODULE 04: LIFT-GAS ALLOCATION OPTIMISER             */}
          {/* ==================================================== */}
          {activeTab === "gaslift" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">
                  04 · Lift-Gas Allocation Optimiser (14 June Field-Wide Natural Experiment)
                </h2>
                <p className="text-xs text-zinc-400">
                  Derived from the 14 June 2025 (10:20–15:02) simultaneous 50% lift-gas cut across all 10 wells (ΔPwf per 100 Mscf/d × PTA Oil PI).
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-7">
                  <CardHeader className="pb-2 border-b border-zinc-800">
                    <CardTitle className="text-sm">
                      Marginal Oil Gain (STB/d per +100 Mscf/d Lift Gas)
                    </CardTitle>
                    <CardDescription>
                      Green = Measured PI from build-up test · Grey = Estimated PI (field median, requires build-up test)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[230px] p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={meta?.lift_gas_ranking || []} layout="vertical" margin={{ left: 10, right: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis type="number" stroke="#71717a" tick={{ fontSize: 11 }} />
                          <YAxis dataKey="well_name" type="category" stroke="#e4e4e7" tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", fontSize: 12 }} />
                          <Bar dataKey="oil_gain_stbd_per_100_mscfd" name="Extra Oil (STB/d per +100 Mscf/d)" radius={[0, 3, 3, 0]}>
                            {(meta?.lift_gas_ranking || []).map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.confidence.includes("measured") ? "#10b981" : "#52525b"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Well</TableHead>
                          <TableHead className="text-right">Gas Cut (14 Jun)</TableHead>
                          <TableHead className="text-right">Pwf Rise</TableHead>
                          <TableHead className="text-right">psi / 100 Mscf</TableHead>
                          <TableHead className="text-right">Oil PI</TableHead>
                          <TableHead className="text-right">Gain / +100 Mscf</TableHead>
                          <TableHead>PI Basis</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(meta?.lift_gas_ranking || []).map((r: any) => (
                          <TableRow key={r.well_name}>
                            <TableCell className="font-mono font-medium text-zinc-100">{r.well_name}</TableCell>
                            <TableCell className="text-right font-mono">{r.lift_gas_cut_mscfd}</TableCell>
                            <TableCell className="text-right font-mono">+{r.pwf_rise_psi} psi</TableCell>
                            <TableCell className="text-right font-mono">{r.pwf_rise_psi_per_100_mscfd}</TableCell>
                            <TableCell className="text-right font-mono">{r.oil_pi_stbd_psi}</TableCell>
                            <TableCell className="text-right font-mono font-semibold text-emerald-400">
                              +{r.oil_gain_stbd_per_100_mscfd} STB/d
                            </TableCell>
                            <TableCell>
                              <Badge variant={r.confidence.includes("measured") ? "emerald" : "slate"}>
                                {r.confidence}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-5">
                  <CardHeader className="pb-3 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Reallocation Trial Calculator</CardTitle>
                      <Badge variant={hasPerm("gaslift:allocate") ? "emerald" : "slate"}>
                        {hasPerm("gaslift:allocate") ? "gaslift:allocate" : "Locked"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Simulate zero-CAPEX lift-gas transfer between wells
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Donor Well (Reduce Gas)</Label>
                        <select
                          value={donorWell}
                          onChange={(e) => setDonorWell(e.target.value)}
                          className="w-full h-9 rounded-md bg-zinc-950 border border-zinc-800 px-2.5 text-xs text-zinc-100"
                        >
                          {(meta?.lift_gas_ranking || []).map((r: any) => (
                            <option key={r.well_name} value={r.well_name}>
                              {r.well_name} (+{r.oil_gain_stbd_per_100_mscfd} STB/d)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Receiver Well (Add Gas)</Label>
                        <select
                          value={receiverWell}
                          onChange={(e) => setReceiverWell(e.target.value)}
                          className="w-full h-9 rounded-md bg-zinc-950 border border-zinc-800 px-2.5 text-xs text-zinc-100"
                        >
                          {(meta?.lift_gas_ranking || []).map((r: any) => (
                            <option key={r.well_name} value={r.well_name}>
                              {r.well_name} (+{r.oil_gain_stbd_per_100_mscfd} STB/d)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <Label>Gas Shift Rate (Mscf/d)</Label>
                        <span className="font-mono text-zinc-200">{shiftMscfd} Mscf/d</span>
                      </div>
                      <ShadcnSlider
                        value={shiftMscfd}
                        min={25}
                        max={300}
                        step={25}
                        onChange={setShiftMscfd}
                        disabled={!hasPerm("gaslift:allocate")}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <Label>Oil Price Assumption ($/bbl)</Label>
                        <span className="font-mono text-zinc-200">${oilPrice}/bbl</span>
                      </div>
                      <ShadcnSlider
                        value={oilPrice}
                        min={50}
                        max={100}
                        step={5}
                        onChange={setOilPrice}
                        disabled={!hasPerm("gaslift:allocate")}
                      />
                    </div>

                    <Button
                      variant="default"
                      className="w-full"
                      onClick={runGasLiftAllocation}
                      disabled={!hasPerm("gaslift:allocate")}
                    >
                      {hasPerm("gaslift:allocate")
                        ? `Simulate Transfer (${donorWell} → ${receiverWell})`
                        : "Requires 'gaslift:allocate' Permission"}
                    </Button>

                    {glSimResult && (
                      <div className="p-3.5 rounded-md border border-zinc-800 bg-zinc-900/50 space-y-2">
                        <div className="text-xs font-mono text-zinc-300">
                          {glSimResult.donorWell} → {glSimResult.receiverWell} ({glSimResult.shiftMscfd} Mscf/d)
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <div className="text-[11px] text-zinc-400">Net Oil Gain</div>
                            <div className="text-lg font-mono font-semibold text-emerald-400">
                              +{glSimResult.netOilGainStbd} STB/d
                            </div>
                          </div>
                          <div>
                            <div className="text-[11px] text-zinc-400">Annualized Cashflow</div>
                            <div className="text-lg font-mono font-semibold text-zinc-100">
                              +${glSimResult.annualRevenueUsd?.toLocaleString()}/yr
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* MODULE 05: DELIVERABLES & OFFLINE REPORTS            */}
          {/* ==================================================== */}
          {activeTab === "export" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">
                  05 · Hackathon Deliverables & Standalone Offline HTML Reports
                </h2>
                <p className="text-xs text-zinc-400">
                  All 4 required files match the exact schema specification in task.pdf.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="border-b border-zinc-800">
                    <Badge variant="default" className="w-fit mb-1 font-mono">Phase 1 · 50 Points</Badge>
                    <CardTitle className="text-sm">Virtual Flow Metering Deliverables</CardTitle>
                    <CardDescription>
                      Sheet `predictions` contains date, well_name, oil_rate_stbd, water_rate_stbd, gas_rate_mscfd (2,730 rows) + 10 audit sheets.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2.5">
                    <a
                      href={`${API_URL}/exports/download/vfm_daily_predictions.xlsx`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-md bg-zinc-100 text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition"
                    >
                      <span className="flex items-center gap-2 font-mono">
                        <FileSpreadsheet className="w-4 h-4" />
                        vfm_daily_predictions.xlsx
                      </span>
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`${API_URL}/exports/download/vfm_report.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-200 font-medium text-xs hover:bg-zinc-800 transition"
                    >
                      <span className="font-mono">vfm_report.html (Offline Plotly Bundle)</span>
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="border-b border-zinc-800">
                    <Badge variant="default" className="w-fit mb-1 font-mono">Phase 2 · 30 Points</Badge>
                    <CardTitle className="text-sm">Automated PTA Deliverables</CardTitle>
                    <CardDescription>
                      Horner slope, skin, effective oil permeability (md), ΔPskin (psi), IARF quality ratings, and all diagnostic curves for 6 shut-ins.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2.5">
                    <a
                      href={`${API_URL}/exports/download/pta_reservoir_properties.xlsx`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-md bg-zinc-100 text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition"
                    >
                      <span className="flex items-center gap-2 font-mono">
                        <FileSpreadsheet className="w-4 h-4" />
                        pta_reservoir_properties.xlsx
                      </span>
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`${API_URL}/exports/download/pta_report.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-200 font-medium text-xs hover:bg-zinc-800 transition"
                    >
                      <span className="font-mono">pta_report.html (Offline Plotly Bundle)</span>
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* MODULE 06: RBAC & MONGODB ATLAS AUDIT LOGS           */}
          {/* ==================================================== */}
          {activeTab === "rbac" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">
                  06 · Role-Based Access Control (RBAC) & MongoDB Atlas Audit Log
                </h2>
                <p className="text-xs text-zinc-400">
                  Every user session, role switch, VFM simulation, PTA override, and denied permission attempt is logged in MongoDB Atlas.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-6">
                  <CardHeader className="pb-2 border-b border-zinc-800">
                    <CardTitle className="text-sm">Registered Accounts & Permissions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Scopes</TableHead>
                          <TableHead className="text-right">Switch</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(rbacOverview?.users || demoAccounts).map((u: any) => (
                          <TableRow key={u.email}>
                            <TableCell>
                              <div className="font-medium text-zinc-100">{u.name}</div>
                              <div className="text-[11px] font-mono text-zinc-500">{u.email}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={ROLE_BADGE_MAP[u.role] || "slate"}>{u.role}</Badge>
                            </TableCell>
                            <TableCell className="text-[11px] font-mono text-zinc-400">
                              {(u.permissions || []).length} scopes
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickRoleSwitch(u.email)}
                              >
                                Activate
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-6">
                  <CardHeader className="pb-2 border-b border-zinc-800">
                    <CardTitle className="text-sm">MongoDB Atlas Audit Trail</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 max-h-[420px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Module / Action</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(rbacOverview?.auditLogs || []).map((log: any) => (
                          <TableRow key={log._id}>
                            <TableCell className="font-mono text-[11px] text-zinc-500">
                              {String(log.createdAt).slice(11, 19)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={log.status === "FORBIDDEN" ? "rose" : "default"} className="font-mono">
                                {log.module}:{log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-zinc-300">{log.userName}</TableCell>
                            <TableCell className="font-mono text-[11px] text-zinc-400 max-w-[220px] truncate">
                              {JSON.stringify(log.details)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
