import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { compileScad, hashSource, ENGINE_ID } from "../../shared/scadEngine.ts";

// Compile adapter. The response shape is engine-agnostic so a real OpenSCAD CLI/WASM service can
// replace compileScad() without touching the editor or the viewport.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));

    const body = await req.json().catch(() => ({}));
    const source = typeof body.source === "string" ? body.source : "";
    const projectId = typeof body.projectId === "string" ? body.projectId : null;

    if (!source.trim()) return Response.json({ error: "source is required" }, { status: 400 });
    if (source.length > 200000) return Response.json({ error: "source is too large for the preview engine" }, { status: 413 });

    const result = compileScad(source);

    if (user && projectId && body.record === true) {
      const firstError = result.diagnostics.find((d) => d.severity === "error");
      await base44.entities.ScadRenderJob.create({
        project_id: projectId,
        engine: ENGINE_ID,
        status: result.ok ? "ok" : "error",
        error_message: firstError ? firstError.message : "",
        triangles: result.stats.triangles,
        source_hash: hashSource(source),
        duration_ms: result.durationMs,
      }).catch(() => null);
    }

    return Response.json({ ...result, source_hash: hashSource(source) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}