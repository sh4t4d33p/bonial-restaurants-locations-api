import { createApplicationAsync } from './bootstrap/application-factory.js';

void (async () => {
  // Serves `/locations/*`, `/health`, OpenAPI at `/documentation/json`, Swagger UI at `/documentation`.
  const application = await createApplicationAsync();
  await application.start();
})().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
