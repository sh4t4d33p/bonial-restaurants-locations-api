import type { FastifyInstance } from 'fastify';

import type { RawLocationRecordParser } from '../../locations/raw-location-record.parser.js';
import type { WritableLocationRepository } from '../../locations/repository/location.repository.js';
import type { RouteRegistrar } from '../../contracts/route-registrar.js';
import { LocationDetailHttpHandler } from './location-detail.http-handler.js';
import { LocationHttpMapper } from './location-http.mapper.js';
import { LocationSearchHttpHandler } from './location-search.http-handler.js';
import { LocationUpsertHttpHandler } from './location-upsert.http-handler.js';
import {
  apiErrorResponseSchema,
  locationDetailOkResponseSchema,
  locationSearchOkResponseSchema,
} from './locations.openapi-schemas.js';
import {
  locationIdParamSchema,
  locationPutBodySchema,
  locationSearchQuerySchema,
} from './locations.schemas.js';

/**
 * Mounts all `/locations/*` HTTP routes and attaches **validation + OpenAPI** metadata.
 *
 * **Route order:** `/locations/search` is registered **before** `/locations/:id` so the
 * static segment `search` is not captured as an `:id` parameter.
 */
export class LocationsRouteRegistrar implements RouteRegistrar {
  private readonly searchHandler: LocationSearchHttpHandler;
  private readonly detailHandler: LocationDetailHttpHandler;
  private readonly upsertHandler: LocationUpsertHttpHandler;

  constructor(catalog: WritableLocationRepository, recordParser: RawLocationRecordParser) {
    const mapper = new LocationHttpMapper();
    this.searchHandler = new LocationSearchHttpHandler(catalog, mapper);
    this.detailHandler = new LocationDetailHttpHandler(catalog, mapper);
    this.upsertHandler = new LocationUpsertHttpHandler(catalog, recordParser, mapper);
  }

  register(app: FastifyInstance): void {
    app.get(
      '/locations/search',
      {
        schema: {
          tags: ['Locations'],
          summary: 'Search visible restaurants',
          description:
            'Returns every restaurant whose service radius covers the user point `(x,y)`, ' +
            'sorted by ascending Euclidean distance. Example: user `(3,2)` with nearby small radii returns the two closest venues.',
          querystring: locationSearchQuerySchema,
          response: {
            200: locationSearchOkResponseSchema,
            400: apiErrorResponseSchema,
            500: apiErrorResponseSchema,
          },
        },
      },
      (request, reply) => this.searchHandler.handle(request, reply),
    );

    app.get(
      '/locations/:id',
      {
        schema: {
          tags: ['Locations'],
          summary: 'Get restaurant details',
          description: 'Returns the full detail view for a single restaurant id.',
          params: locationIdParamSchema,
          response: {
            200: locationDetailOkResponseSchema,
            400: apiErrorResponseSchema,
            404: apiErrorResponseSchema,
            500: apiErrorResponseSchema,
          },
        },
      },
      (request, reply) => this.detailHandler.handle(request, reply),
    );

    app.put(
      '/locations/:id',
      {
        schema: {
          tags: ['Locations'],
          summary: 'Create or replace a restaurant',
          description:
            'Upserts by `id` (path must match body `id`). Persists in memory and rebuilds the spatial grid so search stays consistent.',
          params: locationIdParamSchema,
          body: locationPutBodySchema,
          response: {
            200: locationDetailOkResponseSchema,
            400: apiErrorResponseSchema,
            500: apiErrorResponseSchema,
          },
        },
      },
      (request, reply) => this.upsertHandler.handle(request, reply),
    );
  }
}
