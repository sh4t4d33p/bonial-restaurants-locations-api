import type { FastifyReply, FastifyRequest } from 'fastify';

import { InvalidSearchCoordinatesError } from '../../locations/errors/invalid-search-coordinates.error.js';
import type { LocationRepository } from '../../locations/repository/location.repository.js';
import { BadRequestError, HttpError } from '../../http/http-error.js';
import { LocationHttpMapper } from './location-http.mapper.js';

/**
 * HTTP adapter for `GET /locations/search`.
 *
 * Performs **defensive parsing** even though Fastify/Ajv already validates the querystring, so we fail
 * with the same `BadRequestError` shape if a future route variant bypasses the schema accidentally.
 */
export class LocationSearchHttpHandler {
  constructor(
    private readonly catalog: LocationRepository,
    private readonly mapper: LocationHttpMapper,
  ) {}

  /** Parses `x`/`y`, delegates to {@link LocationRepository.searchVisible}, maps to the wire DTO. */
  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = request.query as { x?: string; y?: string };
      if (typeof query.x !== 'string' || typeof query.y !== 'string') {
        throw new BadRequestError('Query must include x and y as strings');
      }

      const x = Number.parseInt(query.x, 10);
      const y = Number.parseInt(query.y, 10);
      if (Number.isNaN(x) || Number.isNaN(y)) {
        // Example: schema disabled but query contained `x=1.2` → parseInt yields NaN → 400 instead of 500.
        throw new BadRequestError('x and y must be valid integers');
      }

      const hits = this.catalog.searchVisible(x, y);
      await reply.send(this.mapper.toSearchResponse(x, y, hits));
    } catch (error: unknown) {
      if (
        error instanceof InvalidSearchCoordinatesError ||
        error instanceof BadRequestError ||
        error instanceof HttpError
      ) {
        throw error;
      }

      request.log.error(error);
      throw new HttpError('Internal Server Error', 500, 'INTERNAL_ERROR');
    }
  }
}
