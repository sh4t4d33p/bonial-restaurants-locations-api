import type { FastifyInstance } from 'fastify';

import { InvalidSearchCoordinatesError } from '../locations/errors/invalid-search-coordinates.error.js';
import { HttpError } from './http-error.js';

type FastifyValidationError = Error & { code?: string; validation?: unknown };

/**
 * Installs Fastify’s global `setErrorHandler`, normalizing **all** failures to:
 * `{ "error": { "code": string, "message": string } }` with an appropriate HTTP status.
 *
 * ### Dispatch order (first match wins)
 * 1. **`reply.sent`** — bail out quietly if another layer already wrote the socket.
 * 2. **Invalid JSON body** (`FST_ERR_CTP_INVALID_JSON_BODY`) — client sent `Content-Type: application/json`
 *    but bytes were not JSON, e.g. payload `{not json`.
 * 3. **`HttpError` hierarchy** — `BadRequestError`, `NotFoundError`, or any other `HttpError` subclass.
 * 4. **`InvalidSearchCoordinatesError`** — domain rule: user `(x,y)` must be non-negative integers.
 * 5. **Fastify/Ajv validation** — schema mismatch on query/params/body (`VALIDATION_ERROR`).
 * 6. **Fallback** — log stack and return **500** without leaking internals.
 */
export function registerHttpErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyValidationError, request, reply) => {
    if (reply.sent) {
      return reply;
    }

    // Example failure: PUT with header application/json but body `{` → Fastify content-type parser error.
    if (error.code === 'FST_ERR_CTP_INVALID_JSON_BODY') {
      return reply.status(400).send({
        error: { code: 'INVALID_JSON', message: 'Request body contains invalid JSON' },
      });
    }

    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message },
      });
    }

    if (error instanceof InvalidSearchCoordinatesError) {
      return reply.status(400).send({
        error: { code: 'INVALID_USER_LOCATION', message: error.message },
      });
    }

    if (error.code === 'FST_ERR_VALIDATION' || error.validation !== undefined) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: error.message },
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' },
    });
  });
}
