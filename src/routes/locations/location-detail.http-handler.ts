import type { FastifyReply, FastifyRequest } from 'fastify';

import type { LocationRepository } from '../../locations/repository/location.repository.js';
import { HttpError, NotFoundError } from '../../http/http-error.js';
import { LocationHttpMapper } from './location-http.mapper.js';

/** HTTP adapter for `GET /locations/:id` (detail view). */
export class LocationDetailHttpHandler {
  constructor(
    private readonly catalog: LocationRepository,
    private readonly mapper: LocationHttpMapper,
  ) {}

  /** Loads a row by path `id`, returning **404** when the catalog has no such key. */
  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const params = request.params as { id?: string };
      if (typeof params.id !== 'string' || params.id.length === 0) {
        throw new NotFoundError('Location not found');
      }

      const location = this.catalog.getById(params.id);
      if (location === undefined) {
        throw new NotFoundError('Location not found');
      }

      await reply.send(this.mapper.toDetailResponse(location));
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if (error instanceof HttpError) {
        throw error;
      }

      request.log.error(error);
      throw new HttpError('Internal Server Error', 500, 'INTERNAL_ERROR');
    }
  }
}
