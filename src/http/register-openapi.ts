import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { SWAGGER_UI_ROUTE_PREFIX } from '../config/app.constants.js';

/**
 * Registers OpenAPI document generation and the interactive Swagger UI.
 *
 * **Call order:** invoke this **before** route registrars so every route `schema` is merged
 * into the generated specification (e.g. `GET /documentation/json`; prefix is {@link SWAGGER_UI_ROUTE_PREFIX}).
 *
 * @param app - Bare Fastify instance from {@link FastifyServerFactory#create}.
 */
export async function registerOpenApi(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Restaurant locations API',
        description:
          'Bonial-style API: search restaurants visible from a user point, fetch details, and upsert rows. ' +
          'Coordinates use the first quadrant (non-negative integers).',
        version: '0.1.0',
      },
      tags: [
        { name: 'Health', description: 'Liveness and readiness style checks.' },
        { name: 'Locations', description: 'Search, read, and upsert restaurant locations.' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: SWAGGER_UI_ROUTE_PREFIX,
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
}
