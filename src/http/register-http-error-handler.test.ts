import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';

import { InvalidSearchCoordinatesError } from '../locations/errors/invalid-search-coordinates.error.js';
import { BadRequestError, HttpError, NotFoundError } from './http-error.js';
import { registerHttpErrorHandler } from './register-http-error-handler.js';

async function buildErrorTestApp() {
  const app = Fastify({ logger: false });
  registerHttpErrorHandler(app);
  return app;
}

describe('registerHttpErrorHandler', () => {
  it('serializes HttpError subclasses', async () => {
    const app = await buildErrorTestApp();
    app.get('/bad-request', async () => {
      throw new BadRequestError('bad');
    });

    const response = await app.inject({ url: '/bad-request' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: { code: 'BAD_REQUEST', message: 'bad' } });

    await app.close();
  });

  it('serializes NotFoundError', async () => {
    const app = await buildErrorTestApp();
    app.get('/missing', async () => {
      throw new NotFoundError('gone');
    });

    const response = await app.inject({ url: '/missing' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'gone' } });

    await app.close();
  });

  it('serializes InvalidSearchCoordinatesError', async () => {
    const app = await buildErrorTestApp();
    app.get('/coords', async () => {
      throw new InvalidSearchCoordinatesError();
    });

    const response = await app.inject({ url: '/coords' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'INVALID_USER_LOCATION' } });

    await app.close();
  });

  it('maps unknown errors to 500', async () => {
    const app = await buildErrorTestApp();
    app.get('/panic', async () => {
      throw new Error('boom');
    });

    const response = await app.inject({ url: '/panic' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' },
    });

    await app.close();
  });

  it('maps Fastify validation failures to 400', async () => {
    const app = await buildErrorTestApp();
    app.get(
      '/validated',
      {
        schema: {
          querystring: {
            type: 'object',
            required: ['q'],
            properties: { q: { type: 'string' } },
          },
        },
      },
      async () => 'ok',
    );

    const response = await app.inject({ url: '/validated' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });

    await app.close();
  });

  it('maps generic HttpError', async () => {
    const app = await buildErrorTestApp();
    app.get('/http', async () => {
      throw new HttpError('Teapot', 418, 'TEAPOT');
    });

    const response = await app.inject({ url: '/http' });

    expect(response.statusCode).toBe(418);
    expect(response.json()).toEqual({ error: { code: 'TEAPOT', message: 'Teapot' } });

    await app.close();
  });

  it('maps invalid JSON bodies to 400 INVALID_JSON', async () => {
    const app = await buildErrorTestApp();
    app.put('/json', async () => 'ok');

    const response = await app.inject({
      method: 'PUT',
      url: '/json',
      headers: { 'content-type': 'application/json' },
      payload: '{',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: { code: 'INVALID_JSON', message: 'Request body contains invalid JSON' },
    });

    await app.close();
  });
});
