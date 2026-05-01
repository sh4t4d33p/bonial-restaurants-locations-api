import type { FastifyReply, FastifyRequest } from 'fastify';

export type HealthPayload = {
  status: 'ok';
};

/**
 * Stateless handler for **liveness** checks (`GET /health`).
 *
 * Keeps logic trivial on purpose so orchestrators can distinguish “process up” vs heavier readiness probes.
 */
export class HealthController {
  /** Always returns `{ "status": "ok" }` with HTTP 200 when the event loop can serve the route. */
  async getHealth(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body: HealthPayload = { status: 'ok' };
    await reply.send(body);
  }
}
