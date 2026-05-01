import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { createLocationDatasetLoader } from '../../persistence/location-dataset-loader.factory.js';
import { createGridLocationRepository } from './grid-location-repository.factory.js';
import { createNaiveLocationRepository } from './naive-location-repository.factory.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const bigLocationsPath = join(repoRoot, 'locations_big.json');

describe('Grid vs naive parity (locations_big.json)', () => {
  it('returns identical search results for many random user positions', async () => {
    const dataset = await createLocationDatasetLoader().load(bigLocationsPath);
    const naive = createNaiveLocationRepository(dataset);
    const grid = createGridLocationRepository(dataset);

    const seed = 42;
    let state = seed;
    const next = (): number => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state;
    };

    const iterations = 80;
    for (let index = 0; index < iterations; index += 1) {
      const x = next() % 10001;
      const y = next() % 10001;

      const expected = naive.searchVisible(x, y);
      const actual = grid.searchVisible(x, y);

      expect(actual).toEqual(expected);
    }
  });
});
