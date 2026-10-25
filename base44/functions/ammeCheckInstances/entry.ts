import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { readActiveInstance, persistInstance, probeInstance, selectHealthyInstance } from "../../shared/ammeInstance.ts";

// Daily instance health check for the /amme page. Called by the scheduled
// workflow only: verifies the currently selected public Invidious
// instance, and if it is down switches to another healthy one.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const svc = base44.asServiceRole;
    const current = await readActiveInstance(svc);

    if (current && (await probeInstance(current.baseUrl))) {
      await svc.entities.AmmeInstance.update(current.id, {
        healthy: true,
        checked_date: new Date().toISOString()
      });
      return Response.json({ status: 'healthy', instance: current.baseUrl });
    }

    const picked = await selectHealthyInstance(current ? current.baseUrl : null);
    if (!picked) {
      if (current) {
        await svc.entities.AmmeInstance.update(current.id, {
          healthy: false,
          checked_date: new Date().toISOString()
        });
      }
      return Response.json({ status: 'none_available' });
    }

    await persistInstance(svc, picked);
    return Response.json({ status: 'switched', instance: picked.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}