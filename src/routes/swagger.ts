import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export function buildSwaggerRouter(): Router {
  const router = Router();
  const yamlPath = path.join(process.cwd(), 'api', 'openapi.yaml');
  const specDoc = yaml.load(fs.readFileSync(yamlPath, 'utf8')) as any;

  router.get('/openapi.json', (_req, res) => {
    res.json(specDoc);
  });

  router.use('/docs', swaggerUi.serve, swaggerUi.setup(specDoc));

  return router;
}
