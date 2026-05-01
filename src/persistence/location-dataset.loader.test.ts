import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { createLocationDatasetLoader } from './location-dataset-loader.factory.js';

describe('LocationDatasetLoader', () => {
  it('throws when the file does not exist', async () => {
    const loader = createLocationDatasetLoader();
    const missingPath = join(tmpdir(), `missing-locations-${String(Date.now())}.json`);

    await expect(loader.load(missingPath)).rejects.toThrow(/Failed to read locations file/);
  });

  it('throws when the file is not valid JSON', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'loc-loader-'));
    const filePath = join(dir, 'bad.json');
    writeFileSync(filePath, '{', 'utf8');

    try {
      const loader = createLocationDatasetLoader();
      await expect(loader.load(filePath)).rejects.toThrow(/not valid JSON/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('throws when the root JSON shape is wrong', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'loc-loader-'));
    const filePath = join(dir, 'root.json');
    writeFileSync(filePath, '[]', 'utf8');

    try {
      const loader = createLocationDatasetLoader();
      await expect(loader.load(filePath)).rejects.toThrow(/invalid structure/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('throws when locations is not an array', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'loc-loader-'));
    const filePath = join(dir, 'not-array.json');
    writeFileSync(filePath, JSON.stringify({ locations: null }), 'utf8');

    try {
      const loader = createLocationDatasetLoader();
      await expect(loader.load(filePath)).rejects.toThrow(/invalid structure/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('throws when a row fails domain parsing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'loc-loader-'));
    const filePath = join(dir, 'row.json');
    writeFileSync(
      filePath,
      JSON.stringify({
        locations: [
          {
            id: 'a',
            name: 'n',
            type: 'Restaurant',
            'opening-hours': '9-5',
            image: 'https://example.com',
            coordinates: 'not-coordinates',
            radius: 1,
          },
        ],
      }),
      'utf8',
    );

    try {
      const loader = createLocationDatasetLoader();
      await expect(loader.load(filePath)).rejects.toThrow(/Invalid location at index 0/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
