import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { buildAuthRouter } from '../routes/auth';
import { buildUsersRouter } from '../routes/users';
import { buildHealthRouter } from '../routes/health';
import { buildSwaggerRouter } from '../routes/swagger';
import { attachDbAndMigrate } from '../server/db-bootstrap';

export const app = express();

// Request ID middleware
app.use((req, res, next) => {
  const incomingId = req.header('X-Request-Id');
  const id = incomingId && incomingId.trim().length > 0 ? incomingId : uuidv4();
  (req as any).requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
});

// Logging with request id
morgan.token('rid', (req) => (req as any).requestId || '-');
app.use(morgan(':method :url :status :response-time ms rid=:rid'));

// CORS, JSON, cookies
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Attach DB and run migrations on startup
attachDbAndMigrate().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize database', err);
  process.exit(1);
});

// Mount routers under base path
const router = express.Router();
router.use('/auth', buildAuthRouter());
router.use('/users', buildUsersRouter());
router.use('/', buildHealthRouter());
router.use('/', buildSwaggerRouter());

app.use(config.basePath, router);

// Root-level aliases
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'accounts', time: new Date().toISOString() });
});

app.get('/swagger', (_req, res) => {
  res.redirect(302, `${config.basePath}/docs`);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    type: 'https://api.retail-hub.com/problems/not-found',
    title: 'Not Found',
    status: 404,
    detail: 'Resource not found'
  });
});

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error', err);
  res.status(500).json({
    type: 'https://api.retail-hub.com/problems/server-error',
    title: 'Server Error',
    status: 500,
    detail: 'Unexpected server error'
  });
});
