import { describe, expect, it } from 'vitest';

import { Application } from '../../bootstrap/application.js';
import { EnvConfig } from '../../config/env.config.js';
import { FastifyServerFactory } from '../../http/fastify-server.factory.js';
import { HealthController } from './health.controller.js';
import { HealthRouteRegistrar } from './health.route-registrar.js';

describe('Health route', () => {
  it('returns ok for GET /health', async () => {
    const env = EnvConfig.withPort(3000);
    const app = await new Application(
      env,
      new FastifyServerFactory({ enableLogger: false }),
      [new HealthRouteRegistrar(new HealthController())],
    ).buildServer();

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });

    await app.close();
  });
});
