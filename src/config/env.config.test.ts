import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_HTTP_PORT,
  DEFAULT_LOCATIONS_FILENAME,
  ENV_LOCATIONS_FILE,
  ENV_PORT,
} from './app.constants.js';
import { EnvConfig } from './env.config.js';

describe('EnvConfig', () => {
  it('parses PORT from environment', () => {
    const env = EnvConfig.fromProcessEnv({ [ENV_PORT]: '8080' });
    expect(env.port).toBe(8080);
  });

  it('defaults when PORT is missing or empty', () => {
    expect(EnvConfig.fromProcessEnv({}).port).toBe(DEFAULT_HTTP_PORT);
    expect(EnvConfig.fromProcessEnv({ [ENV_PORT]: '' }).port).toBe(DEFAULT_HTTP_PORT);
  });

  it('rejects invalid ports', () => {
    expect(() => EnvConfig.fromProcessEnv({ [ENV_PORT]: '0' })).toThrow(/Invalid port/);
    expect(() => EnvConfig.fromProcessEnv({ [ENV_PORT]: 'abc' })).toThrow(/Invalid port/);
    expect(() => EnvConfig.withPort(65536)).toThrow(/Invalid port/);
  });

  it('defaults LOCATIONS_FILE to locations.json under cwd', () => {
    const env = EnvConfig.fromProcessEnv({ [ENV_PORT]: '3000' });
    expect(env.locationsFileAbsolutePath).toBe(
      path.resolve(process.cwd(), DEFAULT_LOCATIONS_FILENAME),
    );
  });

  it('resolves relative LOCATIONS_FILE against cwd', () => {
    const env = EnvConfig.fromProcessEnv({
      [ENV_PORT]: '3000',
      [ENV_LOCATIONS_FILE]: 'data/locations.json',
    });
    expect(env.locationsFileAbsolutePath).toBe(path.resolve(process.cwd(), 'data/locations.json'));
  });

  it('preserves absolute LOCATIONS_FILE', () => {
    const absolute = path.resolve('/', 'var', 'locations.json');
    const env = EnvConfig.fromProcessEnv({
      [ENV_PORT]: '3000',
      [ENV_LOCATIONS_FILE]: absolute,
    });
    expect(env.locationsFileAbsolutePath).toBe(absolute);
  });

  it('allows overriding locations path in withPort', () => {
    const custom = path.resolve(process.cwd(), 'custom.json');
    expect(EnvConfig.withPort(3000, custom).locationsFileAbsolutePath).toBe(custom);
  });
});
