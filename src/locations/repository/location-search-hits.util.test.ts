import { describe, expect, it } from 'vitest';

import type { ParsedLocation } from '../parsed-location.js';
import type { LocationSearchHit } from '../location-search-hit.js';
import { appendHitIfVisible, sortHitsByDistance } from './location-search-hits.util.js';

describe('sortHitsByDistance', () => {
  it('breaks ties by id', () => {
    const hits = [
      { id: 'b', name: '', coordinates: '', distance: 1 },
      { id: 'a', name: '', coordinates: '', distance: 1 },
    ];
    sortHitsByDistance(hits);
    expect(hits.map((hit) => hit.id)).toEqual(['a', 'b']);
  });
});

describe('appendHitIfVisible', () => {
  const loc = (radius: number): ParsedLocation => ({
    id: 'x',
    name: 'n',
    type: 'Restaurant',
    openingHours: '9-5',
    image: 'i',
    radius,
    x: 0,
    y: 0,
    coordinates: 'x=0,y=0',
  });

  it('appends when distance equals radius', () => {
    const hits: LocationSearchHit[] = [];
    appendHitIfVisible(loc(5), 3, 4, hits);
    expect(hits).toHaveLength(1);
    expect(hits[0].distance).toBe(5);
  });
});
