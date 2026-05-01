import Fastify, { type FastifyInstance } from 'fastify';

export type FastifyServerFactoryOptions = {
  /** Default true in production; disable in tests to reduce noise. */
  enableLogger?: boolean;
};

/**
 * Factory for the root {@link FastifyInstance}. Centralizes cross-cutting Fastify options (logging today;
 * request ids, body limits, etc. tomorrow) so tests and production share one configuration surface.
 */
export class FastifyServerFactory {
  constructor(private readonly options: FastifyServerFactoryOptions = {}) {}

  /** Returns a **bare** app: plugins and routes are registered later by {@link Application.buildServer}. */
  create(): FastifyInstance {
    const enableLogger = this.options.enableLogger ?? true;
    return Fastify({
      logger: enableLogger,
    });
  }
}
