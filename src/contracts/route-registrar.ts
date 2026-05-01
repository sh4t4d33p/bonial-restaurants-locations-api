import type { FastifyInstance } from 'fastify';

/**
 * Pluggable HTTP surface: each registrar mounts a cohesive slice of routes on the shared Fastify instance.
 *
 * Implementations are invoked from {@link Application#buildServer} **after** OpenAPI and the global
 * error handler are registered, so they can safely attach `schema` metadata consumed by `@fastify/swagger`.
 */
export interface RouteRegistrar {
  /** Mutates `app` by registering routes, hooks, or decorators for one bounded context (e.g. `/locations`). */
  register(app: FastifyInstance): void;
}
