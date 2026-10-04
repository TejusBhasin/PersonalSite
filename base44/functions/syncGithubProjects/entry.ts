import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const GH_USER = "TejusBhasin";
const GH_HEADERS = { "User-Agent": "tejus-site-sync", "Accept": "application/vnd.github+json" };

async function ghJson(path) {
  try {
    const res = await fetch(`https://api.github.com${path}`, { headers: GH_HEADERS });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function ghText(path) {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: { ...GH_HEADERS, "Accept": "application/vnd.github.raw+json" }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Direct invocations from the app must come from an admin.
    // Scheduled workflow runs have no user context and are allowed.
    try {
      const user = await base44.auth.me();
      if (user && user.role !== "admin") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      // no user context (scheduled run)
    }

    const repos = await ghJson(`/users/${GH_USER}/repos?per_page=100&sort=pushed`);
    if (!Array.isArray(repos)) {
      return Response.json({ error: "Could not reach GitHub" }, { status: 502 });
    }
    const ownRepos = repos;

    // Existing projects, matched by slug or GitHub URL so nothing is duplicated.
    const existing = await base44.asServiceRole.entities.Project.list(500);
    const bySlug = new Map(existing.map((p) => [p.slug, p]));
    const byGithub = new Map(existing.filter((p) => p.github_url).map((p) => [p.github_url, p]));

    const changed = [];
    const newProjects = [];
    let updated = 0;

    for (const repo of ownRepos) {
      const slug = repo.name.toLowerCase();
      const readmeFull = await ghText(`/repos/${GH_USER}/${repo.name}/readme`);
      const readme = readmeFull ? readmeFull.slice(0, 15000) : "";
      const skills = [...new Set([repo.language, ...(repo.topics || [])].filter(Boolean))];
      const existingRec = bySlug.get(slug) || byGithub.get(repo.html_url);

      if (existingRec) {
        const lastPush = existingRec.github_pushed_at || "";
        if (repo.pushed_at && repo.pushed_at > lastPush) {
          const commits = lastPush
            ? await ghJson(`/repos/${GH_USER}/${repo.name}/commits?per_page=20&since=${encodeURIComponent(lastPush)}`)
            : await ghJson(`/repos/${GH_USER}/${repo.name}/commits?per_page=20`);
          changed.push({
            name: repo.name,
            kind: "update",
            description: repo.description || "",
            commits: (commits || []).map((c) => (c.commit && c.commit.message) || "").filter(Boolean)
          });
        }
        await base44.asServiceRole.entities.Project.update(existingRec.id, {
          readme,
          github_pushed_at: repo.pushed_at || "",
          skills: skills.length ? skills : existingRec.skills || [],
          tagline: existingRec.tagline || repo.description || ""
        });
        updated++;
      } else {
        newProjects.push({
          repo,
          slug,
          readme,
          skills,
          readmeExcerpt: readme.slice(0, 4000)
        });
      }
    }

    // Fill every section of brand-new projects (AI-written from the repo + README).
    const generated = {};
    if (newProjects.length > 0) {
      const brief = newProjects.map((p) => ({
        slug: p.slug,
        name: p.repo.name,
        description: p.repo.description || "",
        language: p.repo.language || "",
        topics: p.repo.topics || [],
        homepage: p.repo.homepage || "",
        readme: p.readmeExcerpt
      }));
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt:
          "You are writing portfolio copy for Tejus Bhasin, a student developer. " +
          "For each GitHub repository below, write first-person portfolio sections in Tejus's voice: " +
          "professional, enthusiastic, concise, no em-dashes, no markdown. " +
          "tagline: one punchy sentence. summary: what it does (2-3 sentences). " +
          "why: why Tejus built it (2-3 sentences, first person). " +
          "description: how it works technically (3-5 sentences, first person). " +
          "If a repo has no README, infer from its name, description and topics. " +
          "Repositories: " + JSON.stringify(brief),
        response_json_schema: {
          type: "object",
          properties: {
            projects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  slug: { type: "string" },
                  tagline: { type: "string" },
                  summary: { type: "string" },
                  why: { type: "string" },
                  description: { type: "string" }
                },
                required: ["slug", "tagline", "summary", "why", "description"]
              }
            }
          },
          required: ["projects"]
        }
      });
      for (const p of (res.projects || res)) {
        if (p && p.slug) generated[p.slug] = p;
      }
    }

    for (const p of newProjects) {
      const gen = generated[p.slug] || {};
      await base44.asServiceRole.entities.Project.create({
        slug: p.slug,
        name: p.repo.name,
        url: p.repo.homepage || p.repo.html_url,
        github_url: p.repo.html_url,
        tagline: gen.tagline || p.repo.description || "",
        preview: `https://opengraph.githubassets.com/1/${GH_USER}/${p.repo.name}`,
        skills: p.skills,
        summary: gen.summary || p.repo.description || "",
        why: gen.why || "",
        description: gen.description || "",
        readme: p.readme,
        github_pushed_at: p.repo.pushed_at || "",
        auto_synced: true,
        sort_order: 500
      });
      changed.push({
        name: p.repo.name,
        kind: "new",
        description: p.repo.description || "",
        commits: []
      });
    }

    // Remove auto-synced projects whose repo no longer exists on GitHub.
    const seenSlugs = new Set(ownRepos.map((r) => r.name.toLowerCase()));
    for (const p of existing) {
      if (p.auto_synced && !seenSlugs.has(p.slug)) {
        await base44.asServiceRole.entities.Project.delete(p.id);
      }
    }

    // Weekly devlog: write up the week's changes in Tejus's voice.
    let devlogWritten = false;
    if (changed.length > 0) {
      const devRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt:
          "You are writing the weekly devlog for Tejus Bhasin's personal website, in Tejus's own voice. " +
          "Below are the GitHub changes from this week. Write a fun, sharp markdown devlog: " +
          "a short intro line, then a section per repo (## heading with the repo name) describing what changed " +
          "based on the commit messages, celebrating new launches, and ending with one closing line. " +
          "First person, casual but professional, no em-dashes. Changes: " + JSON.stringify(changed)
      });
      const content = typeof devRes === "string" ? devRes : (devRes.response || devRes.content || JSON.stringify(devRes));
      const today = new Date();
      const weekOf = today.toISOString().slice(0, 10);
      const title = `Week of ${today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
      // One devlog per day: update today's entry instead of duplicating it.
      const todaysLog = await base44.asServiceRole.entities.Devlog.filter({ week_of: weekOf });
      if (todaysLog.length > 0) {
        await base44.asServiceRole.entities.Devlog.update(todaysLog[0].id, { title, content, repos: changed.map((c) => c.name) });
      } else {
        await base44.asServiceRole.entities.Devlog.create({
          title,
          week_of: weekOf,
          content,
          repos: changed.map((c) => c.name)
        });
      }
      devlogWritten = true;
    }

    return Response.json({
      ok: true,
      repos_seen: ownRepos.length,
      projects_created: newProjects.length,
      projects_updated: updated,
      devlog_written: devlogWritten
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}