import type { FastifyInstance } from 'fastify';

import type { RouteRegistrar } from '../../contracts/route-registrar.js';
import type { HealthController } from './health.controller.js';
import { healthOkResponseSchema } from './health.schemas.js';

/**
 * Registers `GET /health` for orchestration probes (Kubernetes/Docker style).
 */
export class HealthRouteRegistrar implements RouteRegistrar {
  constructor(private readonly controller: HealthController) {}

  register(app: FastifyInstance): void {
    app.get(
      '/health',
      {
        schema: {
          tags: ['Health'],
          summary: 'Liveness check',
          description: 'Returns `{ "status": "ok" }` when the process is running.',
          response: {
            200: healthOkResponseSchema,
          },
        },
      },
      (request, reply) => this.controller.getHealth(request, reply),
    );
  }
}
