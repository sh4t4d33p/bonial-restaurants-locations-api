import { describe, expect, it } from 'vitest';

import { LocationDataset } from './location-dataset.js';
import type { ParsedLocation } from './parsed-location.js';

const sample = (radius: number): ParsedLocation => ({
  id: 'id',
  name: 'n',
  type: 'Restaurant',
  openingHours: '9-5',
  image: 'https://example.com',
  radius,
  x: 0,
  y: 0,
  coordinates: 'x=0,y=0',
});

describe('LocationDataset', () => {
  it('computes maxRadius across locations', () => {
    const dataset = LocationDataset.fromLocations([sample(2), sample(10), sample(3)]);
    expect(dataset.maxRadius).toBe(10);
  });

  it('uses maxRadius 0 for an empty list', () => {
    const dataset = LocationDataset.fromLocations([]);
    expect(dataset.maxRadius).toBe(0);
    expect(dataset.locations).toEqual([]);
  });
});
