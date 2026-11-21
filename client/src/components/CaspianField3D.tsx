"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Badge } from "@/components/ui/primitives";
import { Layers, RotateCw, Eye, Compass } from "lucide-react";

interface Well3DProps {
  wells: any[];
  latestPredictions: any[];
  ptaEvents: any[];
  selectedWell: string;
  onSelectWell: (wellName: string) => void;
}

// Spatial coordinates on the Caspian Sea offshore platform cluster (in scene units)
const WELL_POSITIONS: Record<string, [number, number]> = {
  "GL-01": [-14, -8],
  "GL-02": [-8, -11],
  "GL-03": [-2, -7],
  "GL-04": [5, -10],
  "GL-05": [12, -6],
  "GL-06": [-12, 6],
  "GL-07": [-4, 9],
  "GL-08": [3, 7],
  "GL-09": [10, 8],
  "GL-10": [15, 2],
};

export default function CaspianField3D({
  wells,
  latestPredictions,
  ptaEvents,
  selectedWell,
  onSelectWell,
}: Well3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showStrata, setShowStrata] = useState(true);
  const [hoveredWell, setHoveredWell] = useState<string | null>(null);
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040814);
    scene.fog = new THREE.FogExp2(0x040814, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
    camera.position.set(0, 14, 42);
    camera.lookAt(0, -6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0x94a3b8, 1.4);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    dirLight.position.set(25, 40, 30);
    scene.add(dirLight);

    const bottomLight = new THREE.PointLight(0x10b981, 3, 80);
    bottomLight.position.set(0, -16, 0);
    scene.add(bottomLight);

    // Root rotatable group
    const world = new THREE.Group();
    scene.add(world);

    // 1. Caspian Sea Surface Grid (y = 5)
    const seaGrid = new THREE.GridHelper(48, 24, 0x0ea5e9, 0x0f172a);
    seaGrid.position.y = 5;
    world.add(seaGrid);

    const seaGeo = new THREE.PlaneGeometry(48, 36, 32, 24);
    seaGeo.rotateX(-Math.PI / 2);
    const seaMat = new THREE.MeshPhongMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.16,
      shininess: 90,
      side: THREE.DoubleSide,
    });
    const seaMesh = new THREE.Mesh(seaGeo, seaMat);
    seaMesh.position.y = 5;
    world.add(seaMesh);

    // 2. Offshore Manifold Decks (Manifold A & Manifold B)
    const platformGeo = new THREE.BoxGeometry(8, 0.9, 5);
    const platformMatA = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x0f172a,
    });
    const deckA = new THREE.Mesh(platformGeo, platformMatA);
    deckA.position.set(-4, 6.2, -8);
    world.add(deckA);

    const deckB = new THREE.Mesh(platformGeo, platformMatA);
    deckB.position.set(3, 6.2, 7);
    world.add(deckB);

    // 3. Subsurface Reservoir Horizon Mesh (Depth TVD ~ 7,800 to 10,100 ft -> y = -12 to -18)
    const resGeo = new THREE.PlaneGeometry(46, 34, 40, 30);
    resGeo.rotateX(-Math.PI / 2);
    const posAttr = resGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const wave =
        Math.sin(vx * 0.18) * 1.4 +
        Math.cos(vz * 0.22) * 1.1 -
        (vx * vx + vz * vz) * 0.004;
      posAttr.setY(i, wave);
    }
    resGeo.computeVertexNormals();

    const resMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      wireframe: true,
      transparent: true,
      opacity: showStrata ? 0.32 : 0.05,
    });
    const resMesh = new THREE.Mesh(resGeo, resMat);
    resMesh.position.y = -14.5;
    world.add(resMesh);

    // Solid translucent pay zone beneath wireframe
    const payMat = new THREE.MeshPhongMaterial({
      color: 0x065f46,
      transparent: true,
      opacity: showStrata ? 0.22 : 0.0,
      side: THREE.DoubleSide,
    });
    const payMesh = new THREE.Mesh(resGeo, payMat);
    payMesh.position.y = -15.2;
    world.add(payMesh);

    // 4. Build the 10 Gas-Lifted Wells (GL-01 .. GL-10)
    const clickableMeshes: THREE.Object3D[] = [];
    const gasBubbles: { mesh: THREE.Mesh; topY: number; bottomY: number; speed: number }[] = [];
    const drainageRings: THREE.Mesh[] = [];

    const wellNames = Object.keys(WELL_POSITIONS);
    wellNames.forEach((wName) => {
      const [wx, wz] = WELL_POSITIONS[wName];
      const wellObj = wells.find((w) => w.well_name === wName);
      const predObj = latestPredictions.find((p) => p.well_name === wName);
      const ptaObj = ptaEvents.find((e) => e.well_name === wName);

      const datumTvd = wellObj?.pvt?.datum_tvd_ft || 8500;
      const glValveTvd = wellObj?.completion?.gl_valve_tvd_ft || 3800;
      const oilRate = predObj?.oil_rate_stbd || 1100;
      const isSelected = wName === selectedWell;

      // Map TVD (7500 - 10200 ft) to scene y (-12 to -18)
      const bottomY = 5 - (datumTvd / 10000) * 21;
      const valveY = 5 - (glValveTvd / 10000) * 21;
      const topY = 5.8;
      const length = topY - bottomY;

      // Color coding: selected = bright cyan/emerald, GL-06 (skin +1.74) = amber, GL-07 (4000+ stbd) = emerald, others = teal
      let pipeColor = 0x10b981;
      if (wName === "GL-06") pipeColor = 0xf59e0b;
      if (wName === "GL-04") pipeColor = 0xf43f5e;
      if (isSelected) pipeColor = 0x38bdf8;

      // Wellbore tubing cylinder
      const cylGeo = new THREE.CylinderGeometry(isSelected ? 0.38 : 0.22, isSelected ? 0.38 : 0.22, length, 16);
      const cylMat = new THREE.MeshStandardMaterial({
        color: pipeColor,
        emissive: pipeColor,
        emissiveIntensity: isSelected ? 0.85 : 0.3,
        metalness: 0.4,
        roughness: 0.2,
      });
      const cyl = new THREE.Mesh(cylGeo, cylMat);
      cyl.position.set(wx, bottomY + length / 2, wz);
      cyl.userData = { wellName: wName };
      world.add(cyl);
      clickableMeshes.push(cyl);

      // Wellhead beacon sphere at surface
      const headGeo = new THREE.SphereGeometry(isSelected ? 0.85 : 0.55, 20, 20);
      const headMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0x38bdf8 : pipeColor,
        emissive: isSelected ? 0x38bdf8 : pipeColor,
        emissiveIntensity: isSelected ? 1.2 : 0.55,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(wx, topY + 0.4, wz);
      head.userData = { wellName: wName };
      world.add(head);
      clickableMeshes.push(head);

      // Gas-lift injection valve ring at gl_valve_tvd_ft
      const valveGeo = new THREE.TorusGeometry(0.55, 0.12, 12, 24);
      valveGeo.rotateX(Math.PI / 2);
      const valveMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const valveRing = new THREE.Mesh(valveGeo, valveMat);
      valveRing.position.set(wx, valveY, wz);
      world.add(valveRing);

      // Downhole reservoir drainage halo disc (size proportional to oil rate or PTA radius of investigation)
      const haloRadius = Math.max(1.4, Math.min(4.2, (oilRate / 1200) * 1.8));
      const haloGeo = new THREE.RingGeometry(0.4, haloRadius, 32);
      haloGeo.rotateX(-Math.PI / 2);
      const haloMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x38bdf8 : ptaObj ? 0x10b981 : 0x0284c7,
        transparent: true,
        opacity: isSelected ? 0.65 : 0.3,
        side: THREE.DoubleSide,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.set(wx, bottomY + 0.05, wz);
      world.add(halo);
      drainageRings.push(halo);

      // Animated rising gas-lift & oil particles inside each wellbore
      const bubbleCount = 5;
      for (let b = 0; b < bubbleCount; b++) {
        const bGeo = new THREE.SphereGeometry(0.24, 8, 8);
        const bMat = new THREE.MeshBasicMaterial({
          color: b % 2 === 0 ? 0x34d399 : 0x38bdf8,
        });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        const startY = bottomY + ((topY - bottomY) * b) / bubbleCount;
        bMesh.position.set(wx, startY, wz);
        world.add(bMesh);
        gasBubbles.push({
          mesh: bMesh,
          topY,
          bottomY,
          speed: 0.05 + (oilRate / 4800) * 0.09,
        });
      }
    });

    // Mouse interaction (drag to rotate + raycaster to pick well)
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        world.rotation.y += dx * 0.007;
        world.rotation.x = Math.max(-0.4, Math.min(0.5, world.rotation.x + dy * 0.005));
        prevX = e.clientX;
        prevY = e.clientY;
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableMeshes);
      if (hits.length > 0 && hits[0].object.userData?.wellName) {
        setHoveredWell(hits[0].object.userData.wellName);
        renderer.domElement.style.cursor = "pointer";
      } else {
        setHoveredWell(null);
        renderer.domElement.style.cursor = "grab";
      }
    };

    const onPointerUp = (e: MouseEvent) => {
      isDragging = false;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableMeshes);
      if (hits.length > 0 && hits[0].object.userData?.wellName) {
        onSelectWell(hits[0].object.userData.wellName);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    let animId = 0;
    let tick = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      tick += 0.025;

      if (autoRotateRef.current && !isDragging) {
        world.rotation.y += 0.0028;
      }

      // Animate rising multiphase gas-lift bubbles
      gasBubbles.forEach((b) => {
        b.mesh.position.y += b.speed;
        if (b.mesh.position.y > b.topY) {
          b.mesh.position.y = b.bottomY;
        }
      });

      // Pulse drainage rings
      drainageRings.forEach((r, idx) => {
        const s = 1 + 0.06 * Math.sin(tick * 2 + idx);
        r.scale.set(s, s, 1);
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [wells, latestPredictions, ptaEvents, selectedWell, showStrata]);

  const activeWellObj = wells.find((w) => w.well_name === (hoveredWell || selectedWell));
  const activePred = latestPredictions.find((p) => p.well_name === (hoveredWell || selectedWell));

  return (
    <div className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-slate-800 bg-[#040814] shadow-2xl">
      {/* Three.js WebGL Mount */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Top Left Overlay HUD */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-800/90 px-3.5 py-2 rounded-xl backdrop-blur-md">
          <Compass className="w-4 h-4 text-emerald-400 animate-pulse" />
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-slate-200">
              Caspian Subsurface 3D Digital Twin
            </div>
            <div className="text-[11px] text-slate-400">
              10 Gas-Lifted Wells · TVD 7,850–10,110 ft · Interactive WebGL
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="cyan">🔵 Selected: {selectedWell}</Badge>
          <Badge variant="emerald">🟢 Good IARF Wells</Badge>
          <Badge variant="amber">🟠 GL-06 Skin +1.74 (Stimulate)</Badge>
          <Badge variant="rose">🔴 GL-04 Excess Gas Donor</Badge>
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-md transition ${
            autoRotate
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
              : "bg-slate-900/80 border-slate-700 text-slate-300"
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          {autoRotate ? "Orbit: ON" : "Orbit: OFF"}
        </button>
        <button
          onClick={() => setShowStrata(!showStrata)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white backdrop-blur-md transition"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          {showStrata ? "Horizon: ON" : "Horizon: OFF"}
        </button>
      </div>

      {/* Bottom Well Selector Pill Bar & Live Telemetry Telemetry HUD */}
      <div className="absolute bottom-3 inset-x-4 flex flex-wrap items-center justify-between gap-3 bg-slate-950/85 border border-slate-800/90 px-4 py-2.5 rounded-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.keys(WELL_POSITIONS).map((w) => (
            <button
              key={w}
              onClick={() => onSelectWell(w)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedWell === w
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        {activeWellObj && (
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400">Well: </span>
              <span className="font-bold text-cyan-300">{activeWellObj.well_name}</span>
            </div>
            <div>
              <span className="text-slate-400">Gauge / Datum TVD: </span>
              <span className="font-semibold text-slate-200">
                {activeWellObj.completion?.gauge_tvd_ft} / {activeWellObj.pvt?.datum_tvd_ft} ft
              </span>
            </div>
            <div>
              <span className="text-slate-400">GL Valve: </span>
              <span className="font-semibold text-slate-200">
                {activeWellObj.completion?.gl_valve_tvd_ft} ft
              </span>
            </div>
            <div>
              <span className="text-slate-400">Oil Rate: </span>
              <span className="font-bold text-emerald-400">
                {activePred?.oil_rate_stbd?.toFixed(0)} STB/d
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
