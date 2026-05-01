import { describe, expect, it } from 'vitest';

import { FastifyServerFactory } from '../../http/fastify-server.factory.js';
import { registerHttpErrorHandler } from '../../http/register-http-error-handler.js';
import { registerOpenApi } from '../../http/register-openapi.js';
import { CoordinatesParser } from '../../locations/coordinates.parser.js';
import { RawLocationRecordParser } from '../../locations/raw-location-record.parser.js';
import { MutableGridBackedLocationRepository } from '../../locations/repository/mutable-grid-backed-location.repository.js';
import { UserSearchCoordinatesValidator } from '../../locations/repository/user-search-coordinates.validator.js';
import { pdfExampleDataset } from '../../locations/repository/test-fixtures/pdf-search.dataset.js';
import { LocationsRouteRegistrar } from './locations.route-registrar.js';

async function buildLocationsTestApp() {
  const factory = new FastifyServerFactory({ enableLogger: false });
  const app = factory.create();
  await registerOpenApi(app);
  registerHttpErrorHandler(app);

  const catalog = new MutableGridBackedLocationRepository(
    pdfExampleDataset().locations,
    new UserSearchCoordinatesValidator(),
  );
  const recordParser = new RawLocationRecordParser(new CoordinatesParser());
  new LocationsRouteRegistrar(catalog, recordParser).register(app);

  return app;
}

describe('Locations HTTP API', () => {
  it('GET /locations/search returns visible restaurants sorted by distance', async () => {
    const app = await buildLocationsTestApp();

    const response = await app.inject({ method: 'GET', url: '/locations/search?x=3&y=2' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      'user-location': 'x=3,y=2',
      locations: [
        {
          id: 'loc-2',
          name: 'Restaurant #2',
          coordinates: 'x=2,y=2',
          distance: 1,
        },
        {
          id: 'loc-4',
          name: 'Restaurant #4',
          coordinates: 'x=2,y=3',
          distance: 1.41421,
        },
      ],
    });

    await app.close();
  });

  it('GET /locations/search rejects invalid query parameters', async () => {
    const app = await buildLocationsTestApp();

    const response = await app.inject({ method: 'GET', url: '/locations/search?x=-1&y=2' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });

    await app.close();
  });

  it('GET /locations/search rejects missing query parameters', async () => {
    const app = await buildLocationsTestApp();

    const response = await app.inject({ method: 'GET', url: '/locations/search?x=1' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });

    await app.close();
  });

  it('GET /locations/search rejects non-numeric coordinates', async () => {
    const app = await buildLocationsTestApp();

    const response = await app.inject({ method: 'GET', url: '/locations/search?x=abc&y=2' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });

    await app.close();
  });

  it('GET /locations/:id returns details', async () => {
    const app = await buildLocationsTestApp();

    const response = await app.inject({ method: 'GET', url: '/locations/loc-2' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: 'loc-2',
      name: 'Restaurant #2',
      type: 'Restaurant',
      coordinates: 'x=2,y=2',
    });

    await app.close();
  });

  it('GET /locations/:id returns 404 when missing', async () => {
    const app = await buildLocationsTestApp();

    const response = await app.inject({ method: 'GET', url: '/locations/does-not-exist' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: { code: 'NOT_FOUND', message: 'Location not found' },
    });

    await app.close();
  });

  it('PUT /locations/:id upserts and returns detail JSON', async () => {
    const app = await buildLocationsTestApp();

    const body = {
      id: 'new-loc',
      name: 'New Place',
      type: 'Restaurant',
      'opening-hours': '9:00AM-9:00PM',
      image: 'https://tinyurl.com',
      coordinates: 'x=3,y=2',
      radius: 10,
    };

    const response = await app.inject({
      method: 'PUT',
      url: '/locations/new-loc',
      headers: { 'content-type': 'application/json' },
      payload: body,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: 'new-loc',
      name: 'New Place',
      coordinates: 'x=3,y=2',
    });

    const search = await app.inject({ method: 'GET', url: '/locations/search?x=3&y=2' });
    const ids = (search.json() as { locations: Array<{ id: string }> }).locations.map((row) => row.id);
    expect(ids).toContain('new-loc');

    await app.close();
  });

  it('PUT /locations/:id rejects mismatched ids', async () => {
    const app = await buildLocationsTestApp();

    const response = await app.inject({
      method: 'PUT',
      url: '/locations/path-id',
      headers: { 'content-type': 'application/json' },
      payload: {
        id: 'other-id',
        name: 'X',
        type: 'Restaurant',
        'opening-hours': '9-5',
        image: 'https://tinyurl.com',
        coordinates: 'x=0,y=0',
        radius: 1,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: { code: 'BAD_REQUEST', message: 'Path id must match body id' },
    });

    await app.close();
  });

  it('PUT /locations/:id rejects invalid JSON payloads', async () => {
    const app = await buildLocationsTestApp();

    const response = await app.inject({
      method: 'PUT',
      url: '/locations/some-id',
      headers: { 'content-type': 'application/json' },
      payload: '{not json',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: { code: 'INVALID_JSON', message: 'Request body contains invalid JSON' },
    });

    await app.close();
  });

  it('PUT /locations/:id rejects bodies missing required fields', async () => {
    const app = await buildLocationsTestApp();

    const response = await app.inject({
      method: 'PUT',
      url: '/locations/some-id',
      headers: { 'content-type': 'application/json' },
      payload: { id: 'some-id' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });

    await app.close();
  });

  it('PUT /locations/:id rejects invalid coordinates in an otherwise valid body', async () => {
    const app = await buildLocationsTestApp();

    const response = await app.inject({
      method: 'PUT',
      url: '/locations/bad-coords',
      headers: { 'content-type': 'application/json' },
      payload: {
        id: 'bad-coords',
        name: 'X',
        type: 'Restaurant',
        'opening-hours': '9-5',
        image: 'https://tinyurl.com',
        coordinates: 'not-valid',
        radius: 2,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: { code: 'BAD_REQUEST', message: 'Invalid location payload' },
    });

    await app.close();
  });

  it('PUT /locations/:id rejects non-integer radius values', async () => {
    const app = await buildLocationsTestApp();

    const response = await app.inject({
      method: 'PUT',
      url: '/locations/bad-radius',
      headers: { 'content-type': 'application/json' },
      payload: {
        id: 'bad-radius',
        name: 'X',
        type: 'Restaurant',
        'opening-hours': '9-5',
        image: 'https://tinyurl.com',
        coordinates: 'x=0,y=0',
        radius: 1.5,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });

    await app.close();
  });

  it('PUT /locations/:id rejects radius below 1', async () => {
    const app = await buildLocationsTestApp();

    const response = await app.inject({
      method: 'PUT',
      url: '/locations/bad-radius-2',
      headers: { 'content-type': 'application/json' },
      payload: {
        id: 'bad-radius-2',
        name: 'X',
        type: 'Restaurant',
        'opening-hours': '9-5',
        image: 'https://tinyurl.com',
        coordinates: 'x=0,y=0',
        radius: 0,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });

    await app.close();
  });
});
