/**
 * JSON Schemas for **HTTP responses** and shared OpenAPI fragments for `/locations/*`.
 * Request schemas live in {@link ./locations.schemas.js}.
 */

/** Standard error envelope returned by {@link registerHttpErrorHandler}. */
export const apiErrorResponseSchema = {
  type: 'object',
  required: ['error'],
  additionalProperties: false,
  properties: {
    error: {
      type: 'object',
      required: ['code', 'message'],
      additionalProperties: false,
      properties: {
        code: {
          type: 'string',
          description: 'Machine-readable error code.',
          examples: ['VALIDATION_ERROR', 'INVALID_USER_LOCATION', 'NOT_FOUND', 'BAD_REQUEST', 'INVALID_JSON'],
        },
        message: { type: 'string', description: 'Human-readable explanation.' },
      },
    },
  },
} as const;

/** `GET /locations/search` — 200 body (hyphenated `user-location` per task.pdf). */
export const locationSearchOkResponseSchema = {
  type: 'object',
  required: ['user-location', 'locations'],
  additionalProperties: false,
  properties: {
    'user-location': {
      type: 'string',
      description: 'Echo of the query point in `x=<int>,y=<int>` form.',
      example: 'x=3,y=2',
    },
    locations: {
      type: 'array',
      description: 'Visible restaurants sorted by ascending Euclidean distance.',
      items: {
        type: 'object',
        required: ['id', 'name', 'coordinates', 'distance'],
        additionalProperties: false,
        properties: {
          id: { type: 'string', description: 'Restaurant identifier (UUID in production data).' },
          name: { type: 'string' },
          coordinates: { type: 'string', description: 'Center as `x=<int>,y=<int>`.' },
          distance: { type: 'number', description: 'Euclidean distance from user to center (rounded).' },
        },
      },
    },
  },
} as const;

/** `GET /locations/:id` and `PUT /locations/:id` — 200 detail body. */
export const locationDetailOkResponseSchema = {
  type: 'object',
  required: ['name', 'type', 'id', 'opening-hours', 'image', 'coordinates'],
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    type: { type: 'string', example: 'Restaurant' },
    id: { type: 'string', description: 'Same as path parameter.' },
    'opening-hours': { type: 'string', example: '10:00AM-11:00PM' },
    image: { type: 'string', format: 'uri' },
    coordinates: { type: 'string', example: 'x=5,y=5' },
  },
} as const;
