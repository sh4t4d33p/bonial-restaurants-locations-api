import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { createLocationDatasetLoader } from './location-dataset-loader.factory.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sampleLocationsPath = join(repoRoot, 'locations.json');

describe('LocationDatasetLoader', () => {
  it('loads sample locations.json and computes maxRadius', async () => {
    const loader = createLocationDatasetLoader();

    const dataset = await loader.load(sampleLocationsPath);

    expect(dataset.locations.length).toBeGreaterThan(0);
    const radii = dataset.locations.map((location) => location.radius);
    expect(dataset.maxRadius).toBe(Math.max(...radii));
  });
});
