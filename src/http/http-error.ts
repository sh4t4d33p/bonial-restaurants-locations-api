/** Base class for application-defined HTTP failures (carries `statusCode` + stable `code`). */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Signals **404** — typically unknown `GET /locations/:id` keys. */
export class NotFoundError extends HttpError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/** Signals **400** — business rule violations such as mismatched PUT ids or malformed domain payloads. */
export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
    this.name = 'BadRequestError';
  }
}
