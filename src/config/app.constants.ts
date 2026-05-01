/**
 * Application-wide **non-secret** defaults and fixed strings.
 *
 * **Why not only `process.env`?** Operators still set `PORT` / `LOCATIONS_FILE` at deploy time, but code
 * needs single sources of truth for fallbacks (`3000`, `locations.json`) and infra knobs (`0.0.0.0`,
 * Swagger route prefix) so tests and production never drift apart.
 */

/** Environment variable name for the HTTP listen port. */
export const ENV_PORT = 'PORT' as const;

/** Environment variable name for the locations JSON path (relative to cwd or absolute). */
export const ENV_LOCATIONS_FILE = 'LOCATIONS_FILE' as const;

/** Default HTTP port when {@link ENV_PORT} is unset or empty. */
export const DEFAULT_HTTP_PORT = 3000;

/**
 * Default locations file **basename** when {@link ENV_LOCATIONS_FILE} is unset or empty.
 * Resolved with `path.resolve(process.cwd(), …)` in {@link EnvConfig.fromProcessEnv}.
 */
export const DEFAULT_LOCATIONS_FILENAME = 'locations.json';

/** Bind on all interfaces (Docker/Kubernetes/local dev). */
export const HTTP_LISTEN_HOST = '0.0.0.0' as const;

/**
 * Swagger UI base path. OpenAPI JSON is served at `${SWAGGER_UI_ROUTE_PREFIX}/json`
 * (see `@fastify/swagger-ui` conventions).
 */
export const SWAGGER_UI_ROUTE_PREFIX = '/documentation' as const;
