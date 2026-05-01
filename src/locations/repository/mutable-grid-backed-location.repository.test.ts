import { describe, expect, it } from 'vitest';

import { LocationDataset } from '../location-dataset.js';
import { MutableGridBackedLocationRepository } from './mutable-grid-backed-location.repository.js';
import { locationRow, pdfExampleDataset } from './test-fixtures/pdf-search.dataset.js';
import { UserSearchCoordinatesValidator } from './user-search-coordinates.validator.js';

describe('MutableGridBackedLocationRepository', () => {
  const validator = new UserSearchCoordinatesValidator();

  it('reflects upserts in search and getById', () => {
    const catalog = new MutableGridBackedLocationRepository(
      LocationDataset.fromLocations([
        locationRow({
          id: 'a',
          name: 'A',
          coordinates: 'x=0,y=0',
          x: 0,
          y: 0,
          radius: 1,
        }),
      ]).locations,
      validator,
    );

    expect(catalog.searchVisible(0, 0)).toHaveLength(1);

    catalog.upsert(
      locationRow({
        id: 'b',
        name: 'B',
        coordinates: 'x=0,y=0',
        x: 0,
        y: 0,
        radius: 5,
      }),
    );

    expect(catalog.getById('b')?.name).toBe('B');
    expect(catalog.searchVisible(0, 0).map((hit) => hit.id).sort()).toEqual(['a', 'b']);
  });

  it('updates an existing id in place', () => {
    const catalog = new MutableGridBackedLocationRepository(pdfExampleDataset().locations, validator);
    catalog.upsert(
      locationRow({
        id: 'loc-2',
        name: 'Updated #2',
        coordinates: 'x=2,y=2',
        x: 2,
        y: 2,
        radius: 2,
      }),
    );
    expect(catalog.getById('loc-2')?.name).toBe('Updated #2');
  });
});
