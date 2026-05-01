import path from 'node:path';

import {
  DEFAULT_HTTP_PORT,
  DEFAULT_LOCATIONS_FILENAME,
  ENV_LOCATIONS_FILE,
  ENV_PORT,
} from './app.constants.js';

/**
 * Typed **runtime configuration** parsed from `process.env`.
 *
 * For literal defaults and shared strings (Swagger prefix, listen host), see {@link ./app.constants.js}.
 */
export class EnvConfig {
  private constructor(
    public readonly port: number,
    /** Absolute path to the locations JSON file used at runtime. */
    public readonly locationsFileAbsolutePath: string,
  ) {}

  /**
   * Explicit port (e.g. tests or programmatic startup). Same validation as {@link fromProcessEnv}.
   */
  static withPort(
    port: number,
    locationsFileAbsolutePath: string = path.resolve(process.cwd(), DEFAULT_LOCATIONS_FILENAME),
  ): EnvConfig {
    const validatedPort = EnvConfig.validatePort(port);
    return new EnvConfig(validatedPort, locationsFileAbsolutePath);
  }

  static fromProcessEnv(env: NodeJS.ProcessEnv = process.env): EnvConfig {
    const raw = env[ENV_PORT];
    const port =
      raw === undefined || raw === '' ? DEFAULT_HTTP_PORT : Number.parseInt(raw, 10);
    const validatedPort = EnvConfig.validatePort(port);

    const rawLocations = env[ENV_LOCATIONS_FILE]?.trim();
    const relativeOrAbsolute =
      rawLocations !== undefined && rawLocations.length > 0
        ? rawLocations
        : DEFAULT_LOCATIONS_FILENAME;
    const locationsFileAbsolutePath = path.isAbsolute(relativeOrAbsolute)
      ? relativeOrAbsolute
      : path.resolve(process.cwd(), relativeOrAbsolute);

    return new EnvConfig(validatedPort, locationsFileAbsolutePath);
  }

  private static validatePort(port: number): number {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid port: ${String(port)}`);
    }
    return port;
  }
}
