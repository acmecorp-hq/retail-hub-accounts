import { Router } from 'express';
import { getDb } from '../sql/knex';

export function buildHealthRouter(): Router {
  const router = Router();

  router.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', service: 'accounts', time: new Date().toISOString() });
  });

  router.get('/readyz', async (_req, res) => {
    const db = getDb();
    try {
      await db.raw('select 1 as ok');
      res.json({ status: 'ready', service: 'accounts', time: new Date().toISOString() });
    } catch (err: any) {
      res.status(503).json({
        status: 'not_ready',
        service: 'accounts',
        time: new Date().toISOString(),
        details: { db: 'connecting', error: String(err?.message || err) }
      });
    }
  });

  return router;
}
