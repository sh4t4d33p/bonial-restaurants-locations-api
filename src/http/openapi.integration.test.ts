import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { createApplicationAsync } from '../bootstrap/application-factory.js';
import { ENV_LOCATIONS_FILE, ENV_PORT, SWAGGER_UI_ROUTE_PREFIX } from '../config/app.constants.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sampleLocationsPath = join(repoRoot, 'locations.json');

describe('OpenAPI', () => {
  it('exposes OpenAPI 3 JSON with documented paths', async () => {
    const application = await createApplicationAsync(
      {
        [ENV_PORT]: '3066',
        [ENV_LOCATIONS_FILE]: sampleLocationsPath,
      },
      { enableLogger: false },
    );
    const app = await application.buildServer();

    const response = await app.inject({
      method: 'GET',
      url: `${SWAGGER_UI_ROUTE_PREFIX}/json`,
    });

    expect(response.statusCode).toBe(200);
    const spec = response.json() as { openapi: string; paths: Record<string, unknown> };
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.paths['/health']).toBeDefined();
    expect(spec.paths['/locations/search']).toBeDefined();
    expect(spec.paths['/locations/{id}']).toBeDefined();

    await app.close();
  });

  it('serves Swagger UI HTML', async () => {
    const application = await createApplicationAsync(
      {
        [ENV_PORT]: '3067',
        [ENV_LOCATIONS_FILE]: sampleLocationsPath,
      },
      { enableLogger: false },
    );
    const app = await application.buildServer();

    const response = await app.inject({ method: 'GET', url: SWAGGER_UI_ROUTE_PREFIX });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');

    await app.close();
  });
});
