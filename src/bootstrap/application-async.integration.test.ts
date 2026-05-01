import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';

import { ENV_LOCATIONS_FILE, ENV_PORT } from '../config/app.constants.js';
import { createApplicationAsync } from './application-factory.js';

describe('createApplicationAsync', () => {
  it('fails fast when the locations file cannot be loaded', async () => {
    const missingPath = join(tmpdir(), `missing-app-locations-${String(Date.now())}.json`);

    await expect(
      createApplicationAsync(
        {
          [ENV_PORT]: '3044',
          [ENV_LOCATIONS_FILE]: missingPath,
        },
        { enableLogger: false },
      ),
    ).rejects.toThrow(/Failed to load locations catalog/);
  });
});
