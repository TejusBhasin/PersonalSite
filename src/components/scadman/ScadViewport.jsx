import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Box, Crosshair, Grid3x3 } from "lucide-react";

export default function ScadViewport({ result, loading, emptyHint }) {
  const hostRef = useRef(null);
  const ctxRef = useRef(null);
  const [wireframe, setWireframe] = useState(false);
  const [grid, setGrid] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1016);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 8000);
    camera.position.set(130, 110, 170);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xdfe8f5, 0x1a212b, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(140, 200, 110);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fb4cc, 0.55);
    fill.position.set(-160, -70, -130);
    scene.add(fill);

    const gridHelper = new THREE.GridHelper(400, 40, 0x2f3b4a, 0x1a222c);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.85;
    scene.add(gridHelper);
    const axes = new THREE.AxesHelper(28);
    axes.material.transparent = true;
    axes.material.opacity = 0.6;
    scene.add(axes);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.minDistance = 5;
    controls.maxDistance = 4000;

    const group = new THREE.Group();
    scene.add(group);

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let frame = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();

    ctxRef.current = { scene, camera, renderer, controls, group, gridHelper, axes, fit: null };

    ctxRef.current.fit = () => {
      const box = new THREE.Box3().setFromObject(group);
      if (box.isEmpty()) {
        controls.target.set(0, 0, 0);
        camera.position.set(130, 110, 170);
        controls.update();
        return;
      }
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const radius = Math.max(size.length() * 0.7, 8);
      const distance = (radius / Math.tan((camera.fov * Math.PI) / 360)) * 1.15;
      controls.target.copy(center);
      camera.position.copy(
        center.clone().add(new THREE.Vector3(0.85, 0.7, 1.1).normalize().multiplyScalar(distance))
      );
      camera.near = Math.max(0.1, distance / 2000);
      camera.far = distance * 30;
      camera.updateProjectionMatrix();
      controls.update();
    };

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      ctxRef.current = null;
    };
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    while (ctx.group.children.length) {
      const child = ctx.group.children.pop();
      child.geometry?.dispose?.();
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material?.dispose?.();
    }
    if (!result || !result.solids) return;

    for (const solid of result.solids) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(solid.positions, 3));
      geometry.setIndex(solid.indices);
      geometry.computeVertexNormals();

      if (solid.op === "add") {
        const mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({
            color: 0xd9e0ea,
            metalness: 0.15,
            roughness: 0.55,
            side: THREE.DoubleSide,
          })
        );
        mesh.userData.kind = "solid";
        ctx.group.add(mesh);
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry, 28),
          new THREE.LineBasicMaterial({ color: 0x93a1b3, transparent: true, opacity: 0.35 })
        );
        ctx.group.add(edges);
      } else {
        const cut = new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({
            color: 0xe9b14c,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
          })
        );
        cut.userData.kind = "cut";
        ctx.group.add(cut);
      }
    }
    ctx.fit();
  }, [result]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.group.traverse((child) => {
      if (child.isMesh && child.userData.kind === "solid") child.material.wireframe = wireframe;
    });
  }, [wireframe, result]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.gridHelper.visible = grid;
    ctx.axes.visible = grid;
  }, [grid]);

  const stats = result?.stats;

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="h-full w-full" />

      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
        <span className="scad-chip scad-chip-warn">subset engine</span>
        {stats?.triangles > 0 && <span className="scad-chip">{stats.triangles} tris</span>}
        {stats?.sizeMm && (
          <span className="scad-chip">
            {stats.sizeMm[0]} × {stats.sizeMm[1]} × {stats.sizeMm[2]} mm
          </span>
        )}
      </div>

      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setWireframe((v) => !v)}
          className="scad-btn scad-btn-sm"
          title="Toggle wireframe"
        >
          <Box className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setGrid((v) => !v)}
          className="scad-btn scad-btn-sm"
          title="Toggle grid and axes"
        >
          <Grid3x3 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => ctxRef.current?.fit?.()}
          className="scad-btn scad-btn-sm"
          title="Fit model to view"
        >
          <Crosshair className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--scad-dim)]">
        drag to orbit · scroll to zoom · right-drag to pan
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0c1016]/70">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2e3846] border-t-[#e9b14c]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--scad-muted)]">
              evaluating geometry
            </span>
          </div>
        </div>
      )}

      {!loading && !result && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="max-w-[34ch] text-[12px] leading-relaxed text-[color:var(--scad-dim)]">
            {emptyHint || "Nothing compiled yet. Edit the source or ask the assistant for a model."}
          </p>
        </div>
      )}
    </div>
  );
}