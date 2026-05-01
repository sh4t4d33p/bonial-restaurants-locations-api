/**
 * Fastify JSON Schemas for `/locations/*` **requests** (query, params, body).
 * These merge into the OpenAPI document because `registerOpenApi` runs before route registration.
 */

export const locationSearchQuerySchema = {
  type: 'object',
  required: ['x', 'y'],
  additionalProperties: false,
  properties: {
    x: { type: 'string', pattern: '^[0-9]+$' },
    y: { type: 'string', pattern: '^[0-9]+$' },
  },
} as const;

export const locationIdParamSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', minLength: 1 },
  },
} as const;

export const locationPutBodySchema = {
  type: 'object',
  required: ['id', 'name', 'type', 'opening-hours', 'image', 'coordinates', 'radius'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    type: { type: 'string', minLength: 1 },
    'opening-hours': { type: 'string', minLength: 1 },
    image: { type: 'string', minLength: 1 },
    coordinates: { type: 'string', minLength: 1 },
    radius: { type: 'integer', minimum: 1 },
  },
} as const;
