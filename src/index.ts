import { app } from './server/app';
import { config } from './config';

const port = config.port;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Accounts service listening on http://localhost:${port}${config.basePath}`);
});
