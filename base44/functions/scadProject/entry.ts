import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// Project operations that need server-side authority:
// favourite toggling, view counting, remix (licence + attribution) and duplication.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const projectId = typeof body.projectId === "string" ? body.projectId : "";
    if (!projectId) return Response.json({ error: "projectId is required" }, { status: 400 });

    const project = await base44.asServiceRole.entities.ScadProject.get(projectId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    const isOwner = project.created_by_id === user.id;
    const readable = project.visibility === "public" || project.visibility === "unlisted" || isOwner;
    if (!readable) return Response.json({ error: "Project not found" }, { status: 404 });

    if (action === "view") {
      if (!isOwner) {
        await base44.asServiceRole.entities.ScadProject.update(projectId, {
          view_count: (project.view_count || 0) + 1,
        });
      }
      return Response.json({ ok: true });
    }

    if (action === "favorite") {
      const existing = await base44.entities.ScadFavorite.filter({ project_id: projectId });
      const rows = Array.isArray(existing) ? existing : existing?.items || [];
      const mine = rows.find((row) => row.created_by_id === user.id);
      let favorited;
      if (mine) {
        await base44.entities.ScadFavorite.delete(mine.id);
        favorited = false;
      } else {
        await base44.entities.ScadFavorite.create({
          project_id: projectId,
          project_title: project.title,
          project_slug: project.slug || "",
        });
        favorited = true;
      }
      const next = Math.max(0, (project.favorite_count || 0) + (favorited ? 1 : -1));
      await base44.asServiceRole.entities.ScadProject.update(projectId, { favorite_count: next });
      return Response.json({ favorited, favorite_count: next });
    }

    if (action === "remix" || action === "duplicate") {
      if (action === "remix") {
        if (!isOwner && project.license === "All-Rights-Reserved") {
          return Response.json({ error: "This licence does not allow remixing." }, { status: 403 });
        }
        if (!isOwner && project.visibility === "private") {
          return Response.json({ error: "Project not found" }, { status: 404 });
        }
      } else if (!isOwner) {
        return Response.json({ error: "You can only duplicate your own projects." }, { status: 403 });
      }

      const title = action === "remix"
        ? `${project.title} (remix)`.slice(0, 90)
        : `${project.title} copy`.slice(0, 90);

      const created = await base44.entities.ScadProject.create({
        title,
        slug: makeSlug(title),
        description: project.description || "",
        source_code: project.source_code || "",
        visibility: "private",
        status: "draft",
        category: project.category || "other",
        tags: Array.isArray(project.tags) ? project.tags.slice(0, 10) : [],
        license: project.license || "CC-BY-4.0",
        print_settings: project.print_settings || "",
        original_project_id: action === "remix" ? projectId : project.original_project_id || "",
        original_title: action === "remix" ? project.title : project.original_title || "",
        original_author: action === "remix" ? await ownerName(base44, project) : project.original_author || "",
      });

      const params = await base44.asServiceRole.entities.ScadParameter.filter({ project_id: projectId });
      const list = Array.isArray(params) ? params : params?.items || [];
      if (list.length) {
        await base44.entities.ScadParameter.bulkCreate(
          list.map((p) => ({
            project_id: created.id,
            name: p.name,
            label: p.label || p.name,
            type: p.type || "number",
            default_value: p.default_value ?? "",
            min_value: p.min_value,
            max_value: p.max_value,
            unit: p.unit || "",
            options: Array.isArray(p.options) ? p.options : [],
            is_exposed: p.is_exposed !== false,
            public: false,
            sort_order: p.sort_order || 0,
          }))
        );
      }

      return Response.json({ project: created });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function ownerName(base44, project) {
  if (!project.created_by_id) return "sample content";
  const owner = await base44.asServiceRole.entities.User.get(project.created_by_id).catch(() => null);
  if (!owner) return "unknown";
  return owner.full_name || owner.email || "unknown";
}

function makeSlug(title) {
  const base = String(title || "model")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "model";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}