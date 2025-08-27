import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.header('Authorization');
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;
    const tokenFromCookie = req.cookies?.[config.cookieName];
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      return res.status(401).json({
        type: 'https://api.retail-hub.com/problems/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'Missing or invalid credentials.'
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { sub?: string };
    if (!decoded.sub) {
      return res.status(401).json({
        type: 'https://api.retail-hub.com/problems/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'Missing or invalid credentials.'
      });
    }

    req.userId = decoded.sub;
    next();
  } catch {
    return res.status(401).json({
      type: 'https://api.retail-hub.com/problems/unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail: 'Missing or invalid credentials.'
    });
  }
}
