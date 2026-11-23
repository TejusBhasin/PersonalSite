import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { buildPrompt, retrieveKnowledge, RESPONSE_SCHEMA, KNOWLEDGE_STATUS } from "../../shared/scadKnowledge.ts";

// AI service adapter: generation, modification and error repair.
// Provider is swappable — this file is the only place that knows how the model is called.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const request = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const code = typeof body.code === "string" ? body.code.slice(0, 60000) : "";
    const diagnostics = Array.isArray(body.diagnostics) ? body.diagnostics.slice(0, 8) : [];
    const parameters = Array.isArray(body.parameters) ? body.parameters.slice(0, 40) : [];
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

    if (!request) return Response.json({ error: "prompt is required" }, { status: 400 });
    if (request.length > 2000) return Response.json({ error: "prompt is too long" }, { status: 400 });

    const knowledge = retrieveKnowledge(`${request} ${code.slice(0, 1500)}`, 4);

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildPrompt({ request, code, history, parameters, diagnostics, knowledge }),
      response_json_schema: RESPONSE_SCHEMA,
    });

    const parsed = typeof llm === "string" ? safeParse(llm) : llm;
    if (!parsed || !parsed.code) {
      return Response.json({ error: "The model did not return usable OpenSCAD source. Try rephrasing." }, { status: 502 });
    }

    return Response.json({
      reply: parsed.reply || "Here is the updated model.",
      title: parsed.title || "",
      code: parsed.code,
      parameters: Array.isArray(parsed.parameters) ? parsed.parameters : [],
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      knowledge: {
        ...KNOWLEDGE_STATUS,
        used: knowledge.map((k) => k.title),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function safeParse(text) {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}