import { base44 } from "@/api/base44Client";

async function invoke(name, payload) {
  const res = await base44.functions.invoke(name, payload);
  const data = res?.data ?? res;
  if (!data) throw new Error("The service returned an empty response.");
  if (data.error) throw new Error(data.error);
  return data;
}

export function compileSource(source, projectId) {
  return invoke("scadCompile", { source, projectId });
}

export function askAi(payload) {
  return invoke("scadAi", payload);
}

export function projectAction(action, projectId) {
  return invoke("scadProject", { action, projectId });
}

export async function listMyProjects(limit = 40) {
  const res = await base44.entities.ScadProject.filter(
    { is_sample: { $ne: true } },
    { sort: "-updated_date", limit }
  );
  return Array.isArray(res) ? res : res?.items || [];
}

export async function listPublicProjects(limit = 60) {
  const res = await base44.entities.ScadProject.filter(
    { status: "published", visibility: "public" },
    { sort: "-created_date", limit }
  );
  return Array.isArray(res) ? res : res?.items || [];
}

export async function listParameters(projectId) {
  const res = await base44.entities.ScadParameter.filter({ project_id: projectId }, { sort: "sort_order", limit: 60 });
  return Array.isArray(res) ? res : res?.items || [];
}

export async function listVersions(projectId) {
  const res = await base44.entities.ScadProjectVersion.filter(
    { project_id: projectId },
    { sort: "-version_number", limit: 20 }
  );
  return Array.isArray(res) ? res : res?.items || [];
}

export async function getProject(id) {
  return base44.entities.ScadProject.get(id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
}

export async function getProjectBySlug(slug) {
  const res = await base44.entities.ScadProject.filter({ slug }, { limit: 1 });
  const rows = Array.isArray(res) ? res : res?.items || [];
  return rows[0] || null;
}

export async function saveProject(project, code) {
  return base44.entities.ScadProject.update(project.id, {
    source_code: code,
    updated_date: new Date().toISOString(),
  });
}

export async function snapshotVersion(project, code, parameters, description) {
  const existing = await listVersions(project.id);
  const latest = existing[0];
  if (latest && latest.source_code === code) return latest;
  return base44.entities.ScadProjectVersion.create({
    project_id: project.id,
    version_number: (latest?.version_number || 0) + 1,
    source_code: code,
    parameter_snapshot: JSON.stringify(parameters || []),
    change_description: description || "Manual save",
  });
}

export async function replaceParameters(projectId, params) {
  await base44.entities.ScadParameter.deleteMany({ project_id: projectId });
  if (!params.length) return [];
  return base44.entities.ScadParameter.bulkCreate(
    params.map((p, index) => ({
      project_id: projectId,
      name: p.name,
      label: p.label || p.name,
      type: p.type || "number",
      default_value: String(p.default_value ?? p.value ?? ""),
      min_value: p.min_value === null || p.min_value === undefined ? undefined : Number(p.min_value),
      max_value: p.max_value === null || p.max_value === undefined ? undefined : Number(p.max_value),
      unit: p.unit || "",
      options: Array.isArray(p.options) ? p.options : [],
      is_exposed: p.is_exposed !== false,
      public: p.public === true,
      sort_order: index,
    }))
  );
}

export async function setParameterValue(param, value) {
  return base44.entities.ScadParameter.update(param.id, { default_value: String(value) });
}

export async function publishProject(project, params) {
  await base44.entities.ScadProject.update(project.id, {
    status: "published",
    visibility: project.visibility === "private" ? "public" : project.visibility,
    published_at: project.published_at || new Date().toISOString(),
    slug: project.slug || `${(project.title || "model").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${Math.random().toString(36).slice(2, 8)}`,
  });
  await Promise.all(
    (params || []).map((p) => base44.entities.ScadParameter.update(p.id, { public: true }))
  );
}

export async function unpublishProject(project) {
  await base44.entities.ScadProject.update(project.id, { status: "draft", visibility: "private" });
  const params = await listParameters(project.id);
  await Promise.all(params.map((p) => base44.entities.ScadParameter.update(p.id, { public: false })));
}