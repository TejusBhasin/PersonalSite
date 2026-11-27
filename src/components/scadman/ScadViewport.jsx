import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Box, Crosshair, Grid3x3, Spline } from "lucide-react";

// Edge overlays cost a full extra copy of the mesh, so they are only built for models small
// enough that the outline still reads as a design aid rather than noise.
const EDGE_LIMIT = 150000;
// Past this size the viewport renders at one device pixel per CSS pixel: a dense model is
// fill-rate bound, and a sharper buffer only makes orbiting stutter.
const DENSE_LIMIT = 300000;

export default function ScadViewport({ result, loading, emptyHint }) {
  const hostRef = useRef(null);
  const ctxRef = useRef(null);
  const [wireframe, setWireframe] = useState(false);
  const [grid, setGrid] = useState(true);
  const [edges, setEdges] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1016);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100000);
    camera.position.set(130, 110, 170);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
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
    controls.minDistance = 0.5;
    controls.maxDistance = 100000;

    const group = new THREE.Group();
    scene.add(group);

    // Draw on demand. A million-triangle model costs the GPU on every frame, and the camera
    // moving is the only thing that needs a new one, so an idle viewport draws nothing.
    let dirty = true;
    const requestRender = () => {
      dirty = true;
    };
    controls.addEventListener("change", requestRender);

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      requestRender();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let frame = 0;
    const tick = () => {
      const moved = controls.update();
      if (moved || dirty) {
        renderer.render(scene, camera);
        dirty = false;
      }
      frame = requestAnimationFrame(tick);
    };
    tick();

    ctxRef.current = {
      scene,
      camera,
      renderer,
      controls,
      group,
      gridHelper,
      axes,
      requestRender,
      fit: null,
      lastSize: null,
      hasFitted: false,
    };

    // `force` is the Fit button: it always recentres. A fresh compile only recentres when the
    // model actually changed shape, so the camera stops jumping while you type.
    ctxRef.current.fit = (force = false) => {
      const box = new THREE.Box3().setFromObject(group);
      if (box.isEmpty()) {
        ctxRef.current.lastSize = null;
        ctxRef.current.hasFitted = false;
        controls.target.set(0, 0, 0);
        camera.position.set(130, 110, 170);
        controls.update();
        requestRender();
        return;
      }
      const size = box.getSize(new THREE.Vector3());
      const previous = ctxRef.current.lastSize;
      const grown = !previous || size.clone().sub(previous).length() > Math.max(previous.length(), 1) * 0.2;
      ctxRef.current.lastSize = size.clone();
      if (!force && ctxRef.current.hasFitted && !grown) {
        requestRender();
        return;
      }
      ctxRef.current.hasFitted = true;
      const center = box.getCenter(new THREE.Vector3());
      const radius = Math.max(size.length() * 0.7, 0.5);
      const distance = (radius / Math.tan((camera.fov * Math.PI) / 360)) * 1.15;
      controls.target.copy(center);
      camera.position.copy(
        center.clone().add(new THREE.Vector3(0.85, 0.7, 1.1).normalize().multiplyScalar(distance))
      );
      camera.near = Math.max(0.05, distance / 5000);
      camera.far = distance * 40;
      camera.updateProjectionMatrix();
      controls.update();
      requestRender();
    };

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.removeEventListener("change", requestRender);
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

    const mesh = result?.mesh;
    if (!mesh || !mesh.positions || mesh.positions.length === 0) {
      ctx.requestRender();
      return;
    }

    const triangles = mesh.triangles || mesh.positions.length / 9;
    ctx.renderer.setPixelRatio(
      triangles > DENSE_LIMIT ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
    );

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(mesh.positions, 3));
    // STL facets carry their own normals: using them skips a costly normal pass on big meshes
    // and gives the flat faceted shading a CAD viewer should show.
    if (mesh.hasNormals && mesh.normals) {
      geometry.setAttribute("normal", new THREE.BufferAttribute(mesh.normals, 3));
    } else {
      geometry.computeVertexNormals();
    }
    geometry.computeBoundingSphere();

    const solid = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0xd9e0ea,
        metalness: 0.16,
        roughness: 0.55,
        side: THREE.DoubleSide,
        wireframe,
      })
    );
    solid.userData.kind = "solid";
    ctx.group.add(solid);

    if (edges && triangles <= EDGE_LIMIT) {
      const outline = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 30),
        new THREE.LineBasicMaterial({ color: 0x93a1b3, transparent: true, opacity: 0.28 })
      );
      outline.userData.kind = "edges";
      ctx.group.add(outline);
    }

    ctx.fit();
  }, [result, edges]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.group.traverse((child) => {
      if (child.isMesh && child.userData.kind === "solid") child.material.wireframe = wireframe;
    });
    ctx.requestRender();
  }, [wireframe, result]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.gridHelper.visible = grid;
    ctx.axes.visible = grid;
    ctx.requestRender();
  }, [grid]);

  const stats = result?.stats;
  const triangles = stats?.triangles || 0;
  const edgesAvailable = triangles > 0 && triangles <= EDGE_LIMIT;

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="h-full w-full" />

      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
        <span className={`scad-chip ${result?.ok ? "scad-chip-ok" : "scad-chip-warn"}`}>
          {result?.engineLabel || "no geometry"}
        </span>
        {triangles > 0 && <span className="scad-chip">{triangles.toLocaleString()} tris</span>}
        {stats?.sizeMm && (
          <span className="scad-chip">
            {stats.sizeMm[0]} × {stats.sizeMm[1]} × {stats.sizeMm[2]} mm
          </span>
        )}
        {result?.durationMs > 0 && <span className="scad-chip">{result.durationMs} ms</span>}
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
          onClick={() => setEdges((v) => !v)}
          disabled={!edgesAvailable}
          className="scad-btn scad-btn-sm"
          title={edgesAvailable ? "Toggle facet edges" : "Facet edges are off for very dense models"}
        >
          <Spline className="h-3.5 w-3.5" />
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
          onClick={() => ctxRef.current?.fit?.(true)}
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
              solving geometry
            </span>
          </div>
        </div>
      )}

      {!loading && !result?.mesh && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="max-w-[34ch] text-[12px] leading-relaxed text-[color:var(--scad-dim)]">
            {emptyHint || "Nothing compiled yet. Edit the source or ask the assistant for a model."}
          </p>
        </div>
      )}
    </div>
  );
}