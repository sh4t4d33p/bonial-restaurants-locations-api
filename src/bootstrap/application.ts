import type { FastifyInstance } from 'fastify';

import type { EnvConfig } from '../config/env.config.js';
import { HTTP_LISTEN_HOST } from '../config/app.constants.js';
import type { RouteRegistrar } from '../contracts/route-registrar.js';
import type { FastifyServerFactory } from '../http/fastify-server.factory.js';
import { registerHttpErrorHandler } from '../http/register-http-error-handler.js';
import { registerOpenApi } from '../http/register-openapi.js';

/**
 * Wires infrastructure and route registrars; owns the lifecycle of the HTTP server.
 *
 * **Startup pipeline:** create Fastify → OpenAPI plugins → global error handler → route modules.
 */
export class Application {
  constructor(
    private readonly env: EnvConfig,
    private readonly serverFactory: FastifyServerFactory,
    private readonly routeRegistrars: readonly RouteRegistrar[],
  ) {}

  /**
   * Builds a configured Fastify instance **without** listening (ideal for `inject` tests).
   *
   * OpenAPI registration is **async** (`@fastify/swagger` uses plugins); callers must `await`.
   */
  async buildServer(): Promise<FastifyInstance> {
    const app = this.serverFactory.create();
    await registerOpenApi(app);
    registerHttpErrorHandler(app);
    for (const registrar of this.routeRegistrars) {
      registrar.register(app);
    }
    return app;
  }

  /** Binds to `0.0.0.0:{@link EnvConfig#port}`. */
  async start(): Promise<void> {
    const app = await this.buildServer();
    await app.listen({ port: this.env.port, host: HTTP_LISTEN_HOST });
  }
}
