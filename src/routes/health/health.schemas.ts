/** OpenAPI / Fastify JSON Schema for `GET /health`. */

export const healthOkResponseSchema = {
  type: 'object',
  required: ['status'],
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['ok'], description: 'Fixed literal for liveness success.' },
  },
} as const;
