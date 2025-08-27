import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { getDb } from '../sql/knex';
import { getUserById, updateUser, mapDbToApi } from '../repositories/usersRepo';

export function buildUsersRouter(): Router {
  const router = Router();

  router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const user = req.userId ? await getUserById(db, req.userId) : undefined;
    if (!user) {
      return res.status(404).json({
        type: 'https://api.retail-hub.com/problems/not-found',
        title: 'Not Found',
        status: 404
      });
    }
    res.json(mapDbToApi(user));
  });

  router.put('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const userId = req.userId!;

    try {
      const { username, email, profile } = req.body || {};
      // conflict checks
      if (username) {
        const exists = await db('users').where({ username }).andWhereNot({ id: userId }).first();
        if (exists) {
          return res.status(409).json({
            type: 'https://api.retail-hub.com/problems/conflict',
            title: 'Conflict',
            status: 409,
            detail: 'Email or username conflicts with an existing account'
          });
        }
      }
      if (email) {
        const exists = await db('users').where({ email }).andWhereNot({ id: userId }).first();
        if (exists) {
          return res.status(409).json({
            type: 'https://api.retail-hub.com/problems/conflict',
            title: 'Conflict',
            status: 409,
            detail: 'Email or username conflicts with an existing account'
          });
        }
      }

      const updated = await updateUser(db, userId, { username, email, profile });
      if (!updated) {
        return res.status(404).json({
          type: 'https://api.retail-hub.com/problems/not-found',
          title: 'Not Found',
          status: 404
        });
      }
      res.json(updated);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('updateMe error', err);
      res.status(500).json({
        type: 'https://api.retail-hub.com/problems/server-error',
        title: 'Server Error',
        status: 500,
        detail: 'Unexpected server error'
      });
    }
  });

  return router;
}
