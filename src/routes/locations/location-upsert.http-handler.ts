import type { FastifyReply, FastifyRequest } from 'fastify';

import type { RawLocationRecord } from '../../locations/location-json.types.js';
import type { RawLocationRecordParser } from '../../locations/raw-location-record.parser.js';
import type { WritableLocationRepository } from '../../locations/repository/location.repository.js';
import { BadRequestError, HttpError } from '../../http/http-error.js';
import { LocationHttpMapper } from './location-http.mapper.js';

/**
 * HTTP adapter for `PUT /locations/:id`.
 *
 * Validates **path/body id alignment**, parses the wire DTO into `ParsedLocation`, then calls
 * `WritableLocationRepository#upsert` so search/index stay coherent.
 */
export class LocationUpsertHttpHandler {
  constructor(
    private readonly catalog: WritableLocationRepository,
    private readonly recordParser: RawLocationRecordParser,
    private readonly mapper: LocationHttpMapper,
  ) {}

  /** Upserts the row and echoes the persisted detail JSON (same shape as `GET`). */
  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = request.params as { id?: string };
    const pathId = params.id;
    if (typeof pathId !== 'string' || pathId.length === 0) {
      throw new BadRequestError('Missing location id in path');
    }

    const body = request.body as RawLocationRecord | null | undefined;
    if (body === null || body === undefined) {
      throw new BadRequestError('Request body is required');
    }

    if (body.id !== pathId) {
      throw new BadRequestError('Path id must match body id');
    }

    let parsed;
    try {
      parsed = this.recordParser.parse(body);
    } catch (error: unknown) {
      request.log.warn({ err: error }, 'invalid location payload');
      throw new BadRequestError('Invalid location payload');
    }

    try {
      this.catalog.upsert(parsed);
      await reply.send(this.mapper.toDetailResponse(parsed));
    } catch (error: unknown) {
      if (error instanceof BadRequestError || error instanceof HttpError) {
        throw error;
      }

      request.log.error(error);
      throw new HttpError('Internal Server Error', 500, 'INTERNAL_ERROR');
    }
  }
}
