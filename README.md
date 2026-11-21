# 🛢️ WellPerf Enterprise Platform — SOCAR Hackathon 2026

**Intelligent Well Performance Analysis:** Physics-Constrained Virtual Flow Metering (**VFM**) + Automated Pressure Transient Analysis (**PTA**) + **Three.js 3D Subsurface Digital Twin** + **MongoDB Atlas RBAC** + **Lift-Gas Allocation Optimiser**.

---

## 🏗️ Folder Architecture (`wellperf-Platform/`)

- **`client/`** — **Next.js 14 (App Router, TypeScript)** + **Tailwind CSS** + **shadcn/ui primitives** + **Three.js WebGL 3D Caspian Offshore Field Digital Twin** + **Recharts** interactive diagnostics.
- **`server/`** — **Express.js** + **MongoDB Atlas (`mongoose`)** + **JWT Role-Based Access Control (RBAC)** + **Real-time Physics Engine (BoundedRidge VFM & Horner Semilog PTA)** + **Live Python Scientific Engine Bridge**.
- **`seed_data.json`** — Complete pre-extracted dataset from the 3.93M 1-minute sensor rows, 85 repaired well tests, 2,730 daily predictions, 6 shut-in build-up curves, and 14 June natural experiment ranking.

---

## 🔐 Role-Based Access Control (RBAC) Personas

All 5 enterprise personas are seeded into **MongoDB Atlas** (Password for all demo accounts: `Password123!`, or use 1-Click Persona Login / Top-Bar Role Switcher):

| Role | Email | Permissions | Capabilities |
|---|---|---|---|
| **👑 ADMIN** | `admin@socar.az` | All permissions (`rbac:manage`, `vfm:retrain`, `pta:override`, `gaslift:allocate`, etc.) | Full control over VFM retraining, PTA overrides, Lift-Gas allocation, and RBAC user management |
| **🔬 RESERVOIR_ENGINEER** | `reservoir@socar.az` | `field:read`, `vfm:read`, `vfm:simulate`, `pta:read`, `pta:override`, `gaslift:read`, `export:all` | Override PTA oil rate ($q_o$) and radial-flow (IARF) windows `[start_h, end_h]` with live Horner recalculation |
| **💨 PRODUCTION_ENGINEER** | `production@socar.az` | `field:read`, `vfm:read`, `vfm:simulate`, `pta:read`, `gaslift:read`, `gaslift:allocate`, `export:all` | Execute Lift-Gas reallocation trials (`GL-04 → GL-01`) and VFM choke/pressure inflow simulations |
| **🧠 DATA_SCIENTIST** | `datascience@socar.az` | `field:read`, `vfm:read`, `vfm:simulate`, `vfm:retrain`, `pta:read`, `gaslift:read`, `export:all` | Trigger live Python BoundedRidge VFM retraining & inspect LOTO / Forward CV metrics |
| **📡 FIELD_OPERATOR** | `operator@socar.az` | `field:read`, `vfm:read`, `pta:read`, `gaslift:read` | Read-only 3D Digital Twin surveillance, sensor envelopes, and shut-in / upset alerts |

---

## 🚀 Quick Start

### 1. Start the Express + MongoDB Atlas Server (`http://localhost:5000`)
```bash
cd server
cp .env.example .env   # Configure MONGODB_URI
npm install
npm run seed           # Seeds MongoDB Atlas with 5 RBAC roles, 10 wells, 2,730 predictions & 6 PTA build-ups
npm start
```

### 2. Start the Next.js 14 + Three.js Client (`http://localhost:3000`)
```bash
cd client
npm install
npm run dev
```

---

## 📊 Core Engineering Highlights

1. **VFM Accuracy & Separator Routing Trap Solved:**
   - Excludes surface wellhead pressures (`whp_psia`, `whp_downstream_psia`) which drop 4–12% during test-separator routing, reducing test-day bias from **−9.0% to +0.7%**.
   - **2.65% Held-Out Oil MAPE** (85 tests) and **3.72% Forward Oil MAPE** (55 tests, ~38% lower error than carrying the last test forward).
2. **Automated PTA with IARF Quality Sweep:**
   - Evaluates Bourdet derivative flatness across tolerances `0.08–0.20`: **🟢 good** radial flow on `GL-02`, `GL-04`, `GL-06` (**Skin +1.74 → stimulation candidate**), `GL-08`; flags `GL-01` and `GL-10` as **🔴 indicative (no radial flow)**.
3. **Zero-CAPEX Lift-Gas Optimiser (+$485k/yr):**
   - Uses the **14 June 2025 (10:20–15:02)** field-wide 50% lift-gas cut natural experiment ($\Delta P_{wf} \times \text{PI}$) to recommend shifting **100 Mscf/d from `GL-04` to `GL-01`** for **+19 STB/d extra oil**.
