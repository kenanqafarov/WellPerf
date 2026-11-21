"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Badge } from "@/components/ui/primitives";
import { Compass, RotateCw, Layers, Eye, ZoomIn, ZoomOut, Flame } from "lucide-react";

interface CaspianField3DProps {
  wells: any[];
  latestPredictions: any[];
  ptaEvents: any[];
  selectedWell: string;
  onSelectWell: (wellName: string) => void;
}

// Well surface template positions & reservoir target coordinates (J-type / S-type directional trajectories)
const WELL_TRAJECTORIES: Record<
  string,
  {
    surfX: number;
    surfZ: number;
    kopY: number;
    midX: number;
    midZ: number;
    targetX: number;
    targetZ: number;
    tvd: number;
  }
> = {
  "GL-01": { surfX: -1.8, surfZ: -1.2, kopY: 1.5, midX: -8.5, midZ: -6.5, targetX: -15.5, targetZ: -10.5, tvd: 8920 },
  "GL-02": { surfX: -0.9, surfZ: -1.4, kopY: 1.2, midX: -4.2, midZ: -7.0, targetX: -7.8, targetZ: -11.5, tvd: 8450 },
  "GL-03": { surfX: 0.0, surfZ: -1.5, kopY: 1.0, midX: 0.2, midZ: -7.5, targetX: 0.5, targetZ: -12.2, tvd: 9240 },
  "GL-04": { surfX: 0.9, surfZ: -1.4, kopY: 1.3, midX: 4.8, midZ: -6.8, targetX: 8.5, targetZ: -10.8, tvd: 8120 },
  "GL-05": { surfX: 1.8, surfZ: -1.2, kopY: 0.8, midX: 9.2, midZ: -6.2, targetX: 16.0, targetZ: -9.8, tvd: 9680 },
  "GL-06": { surfX: -1.8, surfZ: 1.2, kopY: 0.9, midX: -7.8, midZ: 5.8, targetX: -13.8, targetZ: 9.6, tvd: 9150 },
  "GL-07": { surfX: -0.9, surfZ: 1.4, kopY: 1.4, midX: -3.6, midZ: 6.4, targetX: -6.2, targetZ: 10.8, tvd: 7850 },
  "GL-08": { surfX: 0.0, surfZ: 1.5, kopY: 1.1, midX: 1.1, midZ: 6.8, targetX: 2.2, targetZ: 11.4, tvd: 8740 },
  "GL-09": { surfX: 0.9, surfZ: 1.4, kopY: 1.2, midX: 5.4, midZ: 6.2, targetX: 9.6, targetZ: 10.2, tvd: 8390 },
  "GL-10": { surfX: 1.8, surfZ: 1.2, kopY: 0.7, midX: 9.8, midZ: 5.5, targetX: 16.5, targetZ: 9.0, tvd: 10110 },
};

type CameraPreset = "full" | "platform" | "reservoir" | "well";

export default function CaspianField3D({
  wells,
  latestPredictions,
  ptaEvents,
  selectedWell,
  onSelectWell,
}: CaspianField3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showStrata, setShowStrata] = useState(true);
  const [showFlowLines, setShowFlowLines] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("full");
  const [zoomDistance, setZoomDistance] = useState(44);
  const [hoveredWell, setHoveredWell] = useState<string | null>(null);

  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;
  const presetRef = useRef<CameraPreset>(cameraPreset);
  presetRef.current = cameraPreset;
  const zoomRef = useRef<number>(zoomDistance);
  zoomRef.current = zoomDistance;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    const isLight = document.documentElement.classList.contains("light");
    const bgHex = isLight ? 0x052e34 : 0x11172e;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.0085);

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 600);
    camera.position.set(0, 13, 44);
    camera.lookAt(0, -4, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Watch theme changes (Light/Dark) to update 3D canvas background
    const themeObserver = new MutationObserver(() => {
      const lightNow = document.documentElement.classList.contains("light");
      const newHex = lightNow ? 0x052e34 : 0x11172e;
      scene.background = new THREE.Color(newHex);
      scene.fog = new THREE.FogExp2(newHex, 0.0085);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Multi-point industrial lighting
    const ambient = new THREE.AmbientLight(0x94a3b8, 1.5);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 2.4);
    sunLight.position.set(32, 48, 35);
    scene.add(sunLight);

    const reservoirGlow = new THREE.PointLight(0x0d9488, 3.5, 95);
    reservoirGlow.position.set(0, -13, 0);
    scene.add(reservoirGlow);

    const flareLight = new THREE.PointLight(0xf97316, 4.0, 28);
    flareLight.position.set(-6.5, 11.2, -3.5);
    scene.add(flareLight);

    const world = new THREE.Group();
    scene.add(world);

    // =========================================================================
    // 1. CASPIAN SEA ANIMATED WAVE SURFACE (y = +5.2) & BATHYMETRIC SEABED (y = -0.5)
    // =========================================================================
    const seaGrid = new THREE.GridHelper(54, 27, 0x0d9488, 0x023f46);
    seaGrid.position.y = 5.2;
    world.add(seaGrid);

    const seaGeo = new THREE.PlaneGeometry(54, 40, 48, 36);
    seaGeo.rotateX(-Math.PI / 2);
    const seaBaseY = new Float32Array(seaGeo.attributes.position.count);
    for (let i = 0; i < seaGeo.attributes.position.count; i++) {
      seaBaseY[i] = seaGeo.attributes.position.getY(i);
    }
    const seaMat = new THREE.MeshPhongMaterial({
      color: 0x0891b2,
      emissive: 0x023f46,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.22,
      shininess: 100,
      side: THREE.DoubleSide,
    });
    const seaMesh = new THREE.Mesh(seaGeo, seaMat);
    seaMesh.position.y = 5.2;
    world.add(seaMesh);

    // =========================================================================
    // 2. COMPLEX OFFSHORE PLATFORM JACKET, TOPSIDE FACILITY, DERRICK & FLARE BOOM
    // =========================================================================
    const platformGroup = new THREE.Group();

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.75,
      roughness: 0.3,
    });
    const yellowSafetyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.4,
      roughness: 0.4,
    });
    const petrolDeckMat = new THREE.MeshStandardMaterial({
      color: 0x023f46,
      metalness: 0.6,
      roughness: 0.35,
    });

    // 4 Jacket Legs from Seabed (y = -0.5) to Topside (y = 6.2)
    const legCoords = [
      [-2.4, -1.8],
      [2.4, -1.8],
      [-2.4, 1.8],
      [2.4, 1.8],
    ];
    legCoords.forEach(([lx, lz]) => {
      const legGeo = new THREE.CylinderGeometry(0.18, 0.28, 6.8, 12);
      const leg = new THREE.Mesh(legGeo, yellowSafetyMat);
      leg.position.set(lx, 2.85, lz);
      platformGroup.add(leg);
    });

    // Horizontal & Diagonal Jacket Cross-Bracing Struts
    const braceLevels = [0.2, 2.4, 4.6];
    braceLevels.forEach((by) => {
      const frontBrace = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.8, 8), steelMat);
      frontBrace.rotation.z = Math.PI / 2;
      frontBrace.position.set(0, by, 1.8);
      platformGroup.add(frontBrace);

      const backBrace = frontBrace.clone();
      backBrace.position.set(0, by, -1.8);
      platformGroup.add(backBrace);

      const leftBrace = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.6, 8), steelMat);
      leftBrace.rotation.x = Math.PI / 2;
      leftBrace.position.set(-2.4, by, 0);
      platformGroup.add(leftBrace);

      const rightBrace = leftBrace.clone();
      rightBrace.position.set(2.4, by, 0);
      platformGroup.add(rightBrace);
    });

    // Cellar Deck (y = 6.2) & Main Production Deck (y = 7.0)
    const cellarDeck = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.3, 4.6), petrolDeckMat);
    cellarDeck.position.set(0, 6.2, 0);
    platformGroup.add(cellarDeck);

    const mainDeck = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.35, 5.0), steelMat);
    mainDeck.position.set(0, 7.0, 0);
    platformGroup.add(mainDeck);

    // 3-Phase Test Separator & Production Separator Horizontal Cylindrical Vessels
    const sepGeo = new THREE.CylinderGeometry(0.38, 0.38, 2.2, 16);
    sepGeo.rotateZ(Math.PI / 2);
    const testSep = new THREE.Mesh(
      sepGeo,
      new THREE.MeshStandardMaterial({ color: 0x14b8a6, metalness: 0.65, roughness: 0.25 })
    );
    testSep.position.set(-1.5, 7.6, 1.2);
    platformGroup.add(testSep);

    const prodSep = new THREE.Mesh(
      sepGeo,
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.65, roughness: 0.25 })
    );
    prodSep.position.set(-1.5, 7.6, -1.1);
    platformGroup.add(prodSep);

    // Gas-Lift Compression Module Skid
    const compSkid = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 2.2), yellowSafetyMat);
    compSkid.position.set(1.6, 7.7, 0.4);
    platformGroup.add(compSkid);

    // Cantilevered Helideck (East Side)
    const helideck = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.45, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.4 })
    );
    helideck.position.set(4.2, 7.35, 0);
    platformGroup.add(helideck);

    const heliRing = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 0.98, 24),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    heliRing.rotation.x = -Math.PI / 2;
    heliRing.position.set(4.2, 7.43, 0);
    platformGroup.add(heliRing);

    // Drilling Derrick Lattice Tower (Center-North)
    const derrickGeo = new THREE.ConeGeometry(1.05, 4.2, 4, 1, true);
    const derrickWire = new THREE.Mesh(
      derrickGeo,
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, wireframe: true })
    );
    derrickWire.position.set(0, 9.2, -0.4);
    derrickWire.rotation.y = Math.PI / 4;
    platformGroup.add(derrickWire);

    // Inclined Flare Boom & Animated Gas Flare Flame
    const boomCurve = new THREE.LineCurve3(
      new THREE.Vector3(-2.8, 7.1, -1.6),
      new THREE.Vector3(-6.5, 10.6, -3.5)
    );
    const boomMesh = new THREE.Mesh(
      new THREE.TubeGeometry(boomCurve, 8, 0.09, 6, false),
      yellowSafetyMat
    );
    platformGroup.add(boomMesh);

    const flareCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 1.35, 12),
      new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.9 })
    );
    flareCone.position.set(-6.5, 11.2, -3.5);
    platformGroup.add(flareCone);

    const flareCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    flareCore.position.set(-6.5, 10.85, -3.5);
    platformGroup.add(flareCore);

    // Subsea Manifold Template on Seabed (y = -0.5)
    const subseaManifold = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.45, 4.0),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.35 })
    );
    subseaManifold.position.set(0, -0.5, 0);
    platformGroup.add(subseaManifold);

    world.add(platformGroup);

    // =========================================================================
    // 3. MULTI-LAYERED 3D SUBSURFACE GEOLOGICAL ANTICLINE HORIZONS & FAULT PLANE
    // =========================================================================
    const strataGroup = new THREE.Group();
    if (showStrata) {
      const layers = [
        { y: -0.5, color: 0x0f766e, opacity: 0.14, amp: 0.35, wire: 0x115e59 }, // Seabed Mudline
        { y: -4.2, color: 0x023f46, opacity: 0.16, amp: 0.85, wire: 0x0d9488 }, // Pliocene Shale Caprock Seal
        { y: -8.2, color: 0x0284c7, opacity: 0.14, amp: 1.25, wire: 0x38bdf8 }, // Upper Balakhany Pay Sand
        { y: -12.0, color: 0x10b981, opacity: 0.20, amp: 1.45, wire: 0x34d399 }, // Fasila Main Oil Reservoir
        { y: -15.2, color: 0x334155, opacity: 0.25, amp: 0.6, wire: 0x475569 }, // Pre-Fasila Basement
      ];

      layers.forEach((layer) => {
        const geo = new THREE.PlaneGeometry(48, 36, 40, 30);
        geo.rotateX(-Math.PI / 2);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const px = pos.getX(i);
          const pz = pos.getZ(i);
          // Realistic structural anticline dome + eastern fault throw
          const dome =
            Math.cos(px * 0.11) * Math.cos(pz * 0.13) * layer.amp +
            Math.sin(px * 0.22 + pz * 0.18) * 0.32;
          const faultThrow = px > 5.5 ? -0.65 : 0;
          pos.setY(i, dome + faultThrow);
        }
        geo.computeVertexNormals();

        const mesh = new THREE.Mesh(
          geo,
          new THREE.MeshPhongMaterial({
            color: layer.color,
            transparent: true,
            opacity: layer.opacity,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        mesh.position.y = layer.y;
        strataGroup.add(mesh);

        const wire = new THREE.Mesh(
          geo,
          new THREE.MeshBasicMaterial({
            color: layer.wire,
            wireframe: true,
            transparent: true,
            opacity: 0.12,
          })
        );
        wire.position.y = layer.y;
        strataGroup.add(wire);
      });

      // Tectonic Sealing Fault Plane (Eastern Flank)
      const faultGeo = new THREE.PlaneGeometry(34, 15, 12, 8);
      faultGeo.rotateY(Math.PI / 2.2);
      faultGeo.rotateZ(0.18);
      const faultPlane = new THREE.Mesh(
        faultGeo,
        new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0.08,
          side: THREE.DoubleSide,
          wireframe: false,
        })
      );
      faultPlane.position.set(5.8, -8.0, 0);
      strataGroup.add(faultPlane);

      const faultWire = new THREE.Mesh(
        faultGeo,
        new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0.22,
          wireframe: true,
        })
      );
      faultWire.position.set(5.8, -8.0, 0);
      strataGroup.add(faultWire);
    }
    world.add(strataGroup);

    // =========================================================================
    // 4. 3D DIRECTIONAL DEVIATED WELLBORES (J-CURVE / S-CURVE) + GLV MANDRELS + DARCY WAVES
    // =========================================================================
    const predMap: Record<string, any> = {};
    latestPredictions.forEach((p) => {
      predMap[p.well_name] = p;
    });
    const ptaMap: Record<string, any> = {};
    ptaEvents.forEach((e) => {
      ptaMap[e.well_name] = e;
    });

    const clickableMeshes: THREE.Mesh[] = [];
    const prodParticles: {
      mesh: THREE.Mesh;
      curve: THREE.CatmullRomCurve3;
      t: number;
      speed: number;
    }[] = [];
    const gasLiftParticles: {
      mesh: THREE.Mesh;
      curve: THREE.CatmullRomCurve3;
      t: number;
      speed: number;
    }[] = [];
    const pressureWaveRings: {
      mesh: THREE.Mesh;
      phase: number;
      maxScale: number;
    }[] = [];

    Object.entries(WELL_TRAJECTORIES).forEach(([wellName, coords]) => {
      const pred = predMap[wellName];
      const pta = ptaMap[wellName];
      const isSelected = wellName === selectedWell;
      const oilRate = pred?.oil_rate_stbd || 1200;
      const skin = pta?.properties?.skin ?? 0;

      // Determine engineering status color
      let wellColor = 0x10b981; // Emerald healthy
      if (wellName === "GL-06" || skin > 1.2) {
        wellColor = 0xf59e0b; // Amber stimulation target
      } else if (wellName === "GL-04") {
        wellColor = 0xf43f5e; // Rose high gas donor
      } else if (pta && pta.properties?.interpretation_quality === "indicative") {
        wellColor = 0x38bdf8; // Cyan indicative
      }

      const bottomY = -5 - ((coords.tvd - 7500) / 2800) * 9.2;

      // Build 5-point realistic directional wellbore trajectory (Platform -> Seabed -> KOP -> Build Section -> Pay Zone Toe)
      const curvePoints = [
        new THREE.Vector3(coords.surfX * 0.6, 6.2, coords.surfZ * 0.6), // Platform wellbay slot
        new THREE.Vector3(coords.surfX, -0.5, coords.surfZ), // Subsea wellhead template
        new THREE.Vector3(coords.surfX * 1.4, -2.5, coords.surfZ * 1.4), // Kick-Off Point (KOP)
        new THREE.Vector3(coords.midX, (bottomY - 2.5) * 0.58, coords.midZ), // Directional tangent build
        new THREE.Vector3(coords.targetX, bottomY, coords.targetZ), // Reservoir perforation landing
      ];
      const wellCurve = new THREE.CatmullRomCurve3(curvePoints);

      // Outer Casing String (Translucent)
      const casingRadius = isSelected ? 0.24 : 0.15;
      const casingGeo = new THREE.TubeGeometry(wellCurve, 44, casingRadius, 12, false);
      const casingMat = new THREE.MeshPhongMaterial({
        color: isSelected ? 0x2dd4bf : wellColor,
        emissive: isSelected ? 0x0d9488 : wellColor,
        emissiveIntensity: isSelected ? 0.85 : 0.35,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.78,
        shininess: 90,
      });
      const casingMesh = new THREE.Mesh(casingGeo, casingMat);
      casingMesh.userData = { wellName };
      world.add(casingMesh);
      clickableMeshes.push(casingMesh);

      // Subsea Christmas Tree Wellhead on Seabed (y = -0.5)
      const xmasTree = new THREE.Mesh(
        new THREE.BoxGeometry(isSelected ? 0.65 : 0.45, isSelected ? 0.75 : 0.55, isSelected ? 0.65 : 0.45),
        new THREE.MeshStandardMaterial({
          color: isSelected ? 0x2dd4bf : wellColor,
          emissive: isSelected ? 0x0d9488 : 0x000000,
          metalness: 0.7,
          roughness: 0.2,
        })
      );
      xmasTree.position.set(coords.surfX, -0.25, coords.surfZ);
      xmasTree.userData = { wellName };
      world.add(xmasTree);
      clickableMeshes.push(xmasTree);

      // Gas-Lift Valve (GLV) Mandrels along the directional wellbore (at t = 0.38, 0.52, 0.66)
      [0.38, 0.52, 0.66].forEach((mandrelT) => {
        const pt = wellCurve.getPointAt(mandrelT);
        const glvMesh = new THREE.Mesh(
          new THREE.SphereGeometry(isSelected ? 0.32 : 0.21, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        glvMesh.position.copy(pt);
        world.add(glvMesh);
      });

      // Reservoir Perforation Interval & Darcy Radial Flow Cone at Bottom-Hole Target
      const perfCenter = new THREE.Vector3(coords.targetX, bottomY, coords.targetZ);

      const perfCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 1.2, 16),
        new THREE.MeshBasicMaterial({
          color: wellColor,
          transparent: true,
          opacity: isSelected ? 0.85 : 0.5,
        })
      );
      perfCylinder.position.copy(perfCenter);
      perfCylinder.userData = { wellName };
      world.add(perfCylinder);
      clickableMeshes.push(perfCylinder);

      // Expanding Concentric Darcy Radial Flow Rings (IARF Pressure Transient Waves)
      const ringCount = isSelected ? 3 : 2;
      for (let r = 0; r < ringCount; r++) {
        const waveRing = new THREE.Mesh(
          new THREE.RingGeometry(0.5, 0.75, 28),
          new THREE.MeshBasicMaterial({
            color: wellColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.65,
          })
        );
        waveRing.rotation.x = -Math.PI / 2;
        waveRing.position.set(coords.targetX, bottomY - 0.3, coords.targetZ);
        world.add(waveRing);
        pressureWaveRings.push({
          mesh: waveRing,
          phase: r * (1 / ringCount) + Math.random() * 0.2,
          maxScale: isSelected ? 5.2 : 3.4,
        });
      }

      // Animated Multiphase Flow Particles along the 3D Curve
      if (showFlowLines) {
        // 1) Produced Oil/Liquid Slugs rising from Perforations (t=1.0) to Platform (t=0.0)
        const pCount = isSelected ? 10 : 6;
        const speed = 0.0022 + (oilRate / 2200) * 0.0038;
        for (let i = 0; i < pCount; i++) {
          const slug = new THREE.Mesh(
            new THREE.SphereGeometry(isSelected ? 0.24 : 0.16, 8, 8),
            new THREE.MeshBasicMaterial({
              color: isSelected ? 0x5eead4 : wellColor,
            })
          );
          world.add(slug);
          prodParticles.push({
            mesh: slug,
            curve: wellCurve,
            t: i / pCount,
            speed,
          });
        }

        // 2) Injected Lift-Gas Bubbles travelling DOWN annulus from Platform (t=0.0) to GLV Mandrel (t=0.66)
        const glCount = isSelected ? 5 : 3;
        for (let j = 0; j < glCount; j++) {
          const gasBubble = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
          );
          world.add(gasBubble);
          gasLiftParticles.push({
            mesh: gasBubble,
            curve: wellCurve,
            t: (j / glCount) * 0.66,
            speed: 0.0032,
          });
        }
      }
    });

    // =========================================================================
    // 5. INTERACTION: ORBIT DRAG, WHEEL ZOOM, RAYCASTER PICKING & CAMERA PRESETS
    // =========================================================================
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let targetRotY = -0.35;
    let targetRotX = 0.08;

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
        targetRotY += dx * 0.007;
        targetRotX = Math.max(-0.55, Math.min(0.65, targetRotX + dy * 0.005));
        prevX = e.clientX;
        prevY = e.clientY;
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableMeshes);
      if (intersects.length > 0) {
        const wName = intersects[0].object.userData?.wellName;
        if (wName) {
          setHoveredWell(wName);
          renderer.domElement.style.cursor = "pointer";
          return;
        }
      }
      setHoveredWell(null);
      renderer.domElement.style.cursor = "grab";
    };

    const onPointerUp = (e: MouseEvent) => {
      const moved = Math.hypot(e.clientX - prevX, e.clientY - prevY);
      isDragging = false;
      if (moved < 5) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(clickableMeshes);
        if (intersects.length > 0) {
          const wName = intersects[0].object.userData?.wellName;
          if (wName) onSelectWell(wName);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomDistance((prev) => Math.max(18, Math.min(72, prev + (e.deltaY > 0 ? 3 : -3))));
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    // =========================================================================
    // 6. ANIMATION LOOP (Waves, Flare Flicker, Multiphase Flow, Darcy IARF Rings)
    // =========================================================================
    let animId: number;
    let clock = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      clock += 0.025;

      if (autoRotateRef.current && !isDragging) {
        targetRotY += 0.0022;
      }
      world.rotation.y += (targetRotY - world.rotation.y) * 0.08;
      world.rotation.x += (targetRotX - world.rotation.x) * 0.08;

      // Smooth Camera Preset & Zoom interpolation
      const preset = presetRef.current;
      const dist = zoomRef.current;
      let desiredCamPos = new THREE.Vector3(0, 12, dist);
      let desiredLookAt = new THREE.Vector3(0, -4.5, 0);

      if (preset === "platform") {
        desiredCamPos.set(0, 11.5, Math.min(dist, 24));
        desiredLookAt.set(0, 5.8, 0);
      } else if (preset === "reservoir") {
        desiredCamPos.set(0, -3.5, Math.min(dist, 34));
        desiredLookAt.set(0, -10.5, 0);
      } else if (preset === "well") {
        const wCoord = WELL_TRAJECTORIES[selectedWell] || WELL_TRAJECTORIES["GL-06"];
        desiredCamPos.set(wCoord.targetX * 0.6, 2, 28);
        desiredLookAt.set(wCoord.targetX * 0.4, -7.5, wCoord.targetZ * 0.4);
      }

      camera.position.lerp(desiredCamPos, 0.06);
      camera.lookAt(desiredLookAt);

      // Animate Caspian Sea surface waves
      const seaPos = seaGeo.attributes.position;
      for (let i = 0; i < seaPos.count; i++) {
        const sx = seaPos.getX(i);
        const sz = seaPos.getZ(i);
        const wave =
          Math.sin(sx * 0.25 + clock * 1.4) * 0.18 +
          Math.cos(sz * 0.3 + clock * 1.1) * 0.14;
        seaPos.setY(i, seaBaseY[i] + wave);
      }
      seaPos.needsUpdate = true;

      // Animate Gas Flare Flicker
      const flicker = 0.88 + Math.sin(clock * 7.5) * 0.16 + Math.cos(clock * 13.0) * 0.1;
      flareCone.scale.set(flicker, 0.9 + Math.sin(clock * 9) * 0.22, flicker);
      flareLight.intensity = 3.5 + Math.sin(clock * 11) * 1.2;

      // Animate Upward Production Slugs along 3D directional curves
      prodParticles.forEach((p) => {
        p.t -= p.speed;
        if (p.t < 0) p.t = 1;
        const pos = p.curve.getPointAt(p.t);
        p.mesh.position.copy(pos);
      });

      // Animate Downward Lift-Gas Injection Bubbles along annulus to GLV mandrels
      gasLiftParticles.forEach((g) => {
        g.t += g.speed;
        if (g.t > 0.66) g.t = 0;
        const pos = g.curve.getPointAt(g.t);
        g.mesh.position.set(pos.x + 0.18, pos.y, pos.z + 0.18);
      });

      // Animate Darcy Radial Pressure Transient (IARF) Rings at Reservoir Toe
      pressureWaveRings.forEach((ring) => {
        ring.phase += 0.008;
        if (ring.phase > 1) ring.phase = 0;
        const sc = 0.8 + ring.phase * ring.maxScale;
        ring.mesh.scale.set(sc, sc, 1);
        (ring.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - ring.phase) * 0.65;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Pixel-Perfect Responsive ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      dom.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      dom.removeEventListener("wheel", onWheel);
      renderer.dispose();
    };
  }, [wells, latestPredictions, ptaEvents, selectedWell, showStrata, showFlowLines]);

  const activeWellName = hoveredWell || selectedWell;
  const activeWellObj = wells.find((w) => w.well_name === activeWellName);
  const activePred = latestPredictions.find((p) => p.well_name === activeWellName);
  const activePta = ptaEvents.find((e) => e.well_name === activeWellName);
  const activeTraj = WELL_TRAJECTORIES[activeWellName] || WELL_TRAJECTORIES["GL-01"];

  return (
    <div className="relative w-full h-[460px] sm:h-[510px] rounded-lg overflow-hidden border border-zinc-800 bg-[#11172E] shadow-lg">
      {/* Three.js WebGL Mount */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Top Left Overlay HUD */}
      <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1.5 max-w-[65%]">
        <div className="flex items-center gap-2.5 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 px-3 py-2 rounded-lg shadow-md">
          <Compass className="w-4 h-4 text-teal-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-tight text-zinc-100 truncate">
              Caspian 3D Offshore Jacket, Directional Wellbores & Darcy Reservoir Twin
            </div>
            <div className="text-[10px] text-zinc-400 font-mono truncate">
              10 Deviated Wells · GLV Mandrels · 5 Anticline Horizons · Fault Seal · IARF Waves
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="cyan">Focus: {activeWellName}</Badge>
          <Badge variant="emerald">IARF Good (4)</Badge>
          <Badge variant="amber">GL-06 Skin +1.74</Badge>
          <Badge variant="rose">GL-04 High Gas Donor</Badge>
        </div>
      </div>

      {/* Top Right Camera Presets & Layer Controls */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
        <div className="flex flex-wrap items-center justify-end gap-1 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 p-1 rounded-lg">
          {(
            [
              { id: "full", label: "Full Field" },
              { id: "platform", label: "Topside & Jacket" },
              { id: "reservoir", label: "Pay Zone" },
              { id: "well", label: "Focus Well" },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setCameraPreset(p.id)}
              className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition ${
                cameraPreset === p.id
                  ? "bg-[#023F46] text-white border border-teal-400/40"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-medium border transition ${
              autoRotate
                ? "bg-[#023F46] border-teal-500/40 text-white"
                : "bg-zinc-950/90 border-zinc-800 text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            <RotateCw className="w-3 h-3" />
            <span>{autoRotate ? "Orbit: ON" : "Orbit: OFF"}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowStrata(!showStrata)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-medium border transition ${
              showStrata
                ? "bg-[#023F46] border-teal-500/40 text-white"
                : "bg-zinc-950/90 border-zinc-800 text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Strata</span>
          </button>
          <button
            type="button"
            onClick={() => setShowFlowLines(!showFlowLines)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-medium border transition ${
              showFlowLines
                ? "bg-[#023F46] border-teal-500/40 text-white"
                : "bg-zinc-950/90 border-zinc-800 text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Multiphase</span>
          </button>
          <button
            type="button"
            title="Zoom In"
            onClick={() => setZoomDistance((d) => Math.max(18, d - 5))}
            className="p-1 rounded border bg-zinc-950/90 border-zinc-800 text-zinc-300 hover:bg-zinc-900"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Zoom Out"
            onClick={() => setZoomDistance((d) => Math.min(70, d + 5))}
            className="p-1 rounded border bg-zinc-950/90 border-zinc-800 text-zinc-300 hover:bg-zinc-900"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Well Selector Bar & Live Directional Telemetry */}
      <div className="absolute bottom-3 inset-x-3 flex flex-wrap items-center justify-between gap-2 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 px-3 py-2 rounded-lg shadow-lg">
        <div className="flex flex-wrap items-center gap-1">
          {Object.keys(WELL_TRAJECTORIES).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onSelectWell(w)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition ${
                selectedWell === w
                  ? "bg-[#023F46] text-white border border-teal-400/50 shadow-sm"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-100 border border-zinc-800"
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <div>
            <span className="text-zinc-500">WELL: </span>
            <span className="font-bold text-zinc-100">{activeWellName}</span>
          </div>
          <div>
            <span className="text-zinc-500">TVD: </span>
            <span className="text-zinc-200">{activeTraj.tvd.toLocaleString()} ft</span>
          </div>
          <div>
            <span className="text-zinc-500">Qo: </span>
            <span className="text-emerald-400 font-semibold">
              {Math.round(activePred?.oil_rate_stbd || 1420).toLocaleString()} STB/d
            </span>
          </div>
          <div>
            <span className="text-zinc-500">WC: </span>
            <span className="text-zinc-300">
              {(((activePred?.water_cut_frac || 0.32) as number) * 100).toFixed(1)}%
            </span>
          </div>
          {activePta?.properties && (
            <div>
              <span className="text-zinc-500">SKIN: </span>
              <span
                className={
                  activePta.properties.skin > 1
                    ? "text-amber-400 font-bold"
                    : "text-emerald-400 font-semibold"
                }
              >
                {activePta.properties.skin >= 0 ? "+" : ""}
                {Number(activePta.properties.skin).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
