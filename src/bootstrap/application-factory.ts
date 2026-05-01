import { EnvConfig } from '../config/env.config.js';
import { FastifyServerFactory } from '../http/fastify-server.factory.js';
import { CoordinatesParser } from '../locations/coordinates.parser.js';
import { RawLocationRecordParser } from '../locations/raw-location-record.parser.js';
import { MutableGridBackedLocationRepository } from '../locations/repository/mutable-grid-backed-location.repository.js';
import { UserSearchCoordinatesValidator } from '../locations/repository/user-search-coordinates.validator.js';
import { createLocationDatasetLoader } from '../persistence/location-dataset-loader.factory.js';
import { HealthController } from '../routes/health/health.controller.js';
import { HealthRouteRegistrar } from '../routes/health/health.route-registrar.js';
import { LocationsRouteRegistrar } from '../routes/locations/locations.route-registrar.js';
import { Application } from './application.js';

/**
 * Application composition roots: `createApplication` (health-only smoke) and `createApplicationAsync`
 * (full stack + OpenAPI/Swagger registered inside {@link Application#buildServer}).
 */

/** Optional tuning for {@link createApplicationAsync}. */
export type CreateApplicationAsyncOptions = {
  /**
   * When `false`, disables Fastify’s built-in request logger (handy for noisy Vitest runs).
   * @default true
   */
  enableLogger?: boolean;
};

/**
 * Composition root: assemble services for production-style wiring (tests can build subsets).
 */
export function createApplication(env: NodeJS.ProcessEnv = process.env): Application {
  const envConfig = EnvConfig.fromProcessEnv(env);
  const serverFactory = new FastifyServerFactory();
  const healthController = new HealthController();
  const healthRouteRegistrar = new HealthRouteRegistrar(healthController);

  return new Application(envConfig, serverFactory, [healthRouteRegistrar]);
}

/**
 * Production wiring: loads the locations file from {@link EnvConfig.locationsFileAbsolutePath},
 * builds a mutable grid-backed catalog, and mounts `/locations/*` alongside `/health`.
 * OpenAPI metadata is emitted because `Application` registers `@fastify/swagger` before these routes.
 */
export async function createApplicationAsync(
  env: NodeJS.ProcessEnv = process.env,
  options: CreateApplicationAsyncOptions = {},
): Promise<Application> {
  const envConfig = EnvConfig.fromProcessEnv(env);
  const serverFactory = new FastifyServerFactory({
    enableLogger: options.enableLogger ?? true,
  });

  let dataset;
  try {
    dataset = await createLocationDatasetLoader().load(envConfig.locationsFileAbsolutePath);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load locations catalog from "${envConfig.locationsFileAbsolutePath}": ${message}`);
  }

  const catalog = new MutableGridBackedLocationRepository(
    dataset.locations,
    new UserSearchCoordinatesValidator(),
  );
  const recordParser = new RawLocationRecordParser(new CoordinatesParser());

  const healthController = new HealthController();
  const healthRouteRegistrar = new HealthRouteRegistrar(healthController);
  const locationsRouteRegistrar = new LocationsRouteRegistrar(catalog, recordParser);

  return new Application(envConfig, serverFactory, [healthRouteRegistrar, locationsRouteRegistrar]);
}
