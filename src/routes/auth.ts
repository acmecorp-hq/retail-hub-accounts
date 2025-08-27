import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../sql/knex';
import { config } from '../config';
import { createUser, findUserByUsernameOrEmail, verifyPassword, mapDbToApi } from '../repositories/usersRepo';

export function buildAuthRouter(): Router {
  const router = Router();

  router.post('/register', async (req, res) => {
    try {
      const { username, email, password, profile } = req.body || {};
      if (!username || !email || !password) {
        return res.status(400).json({
          type: 'https://api.retail-hub.com/problems/validation',
          title: 'Bad Request',
          status: 400,
          detail: 'username, email, and password are required.'
        });
      }

      const db = getDb();
      const exists = await db('users').where({ username }).orWhere({ email }).first();
      if (exists) {
        return res.status(409).json({
          type: 'https://api.retail-hub.com/problems/conflict',
          title: 'Conflict',
          status: 409,
          detail: 'Username or email already exists.'
        });
      }

      const user = await createUser(db, { username, email, password, profile });
      res.status(201)
        .set('Location', `/v1/accounts/users/${user.id}`)
        .json(user);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('register error', err);
      res.status(500).json({
        type: 'https://api.retail-hub.com/problems/server-error',
        title: 'Server Error',
        status: 500,
        detail: 'Unexpected server error'
      });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { usernameOrEmail, password } = req.body || {};
      if (!usernameOrEmail || !password) {
        return res.status(400).json({
          type: 'https://api.retail-hub.com/problems/validation',
          title: 'Bad Request',
          status: 400,
          detail: 'usernameOrEmail and password are required.'
        });
      }

      const db = getDb();
      const dbUser = await findUserByUsernameOrEmail(db, usernameOrEmail);
      if (!dbUser) {
        return res.status(401).json({
          type: 'https://api.retail-hub.com/problems/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'Missing or invalid credentials.'
        });
      }

      const ok = await verifyPassword(dbUser.password_hash, password);
      if (!ok) {
        return res.status(401).json({
          type: 'https://api.retail-hub.com/problems/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'Missing or invalid credentials.'
        });
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const expiresIn = config.jwtExpiresInSeconds;
      const token = jwt.sign({ sub: dbUser.id, iat: nowSec }, config.jwtSecret, {
        algorithm: 'HS256',
        expiresIn
      });

      if (config.sessionCookieEnabled) {
        res.cookie(config.cookieName, token, {
          httpOnly: true,
          secure: config.env !== 'development',
          sameSite: 'lax',
          maxAge: expiresIn * 1000,
          path: '/'
        });
      }

      res.json({
        token,
        tokenType: 'Bearer',
        expiresIn,
        user: mapDbToApi(dbUser)
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('login error', err);
      res.status(500).json({
        type: 'https://api.retail-hub.com/problems/server-error',
        title: 'Server Error',
        status: 500,
        detail: 'Unexpected server error'
      });
    }
  });

  router.post('/logout', async (_req, res) => {
    if (config.sessionCookieEnabled) {
      res.cookie(config.cookieName, '', {
        httpOnly: true,
        secure: config.env !== 'development',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      });
    }
    res.status(204).end();
  });

  return router;
}
