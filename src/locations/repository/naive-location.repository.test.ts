import { describe, expect, it } from 'vitest';

import { InvalidSearchCoordinatesError } from '../errors/invalid-search-coordinates.error.js';
import { LocationDataset } from '../location-dataset.js';
import { NaiveLocationRepository } from './naive-location.repository.js';
import { locationRow, pdfExampleDataset } from './test-fixtures/pdf-search.dataset.js';
import { UserSearchCoordinatesValidator } from './user-search-coordinates.validator.js';

describe('NaiveLocationRepository', () => {
  const validator = new UserSearchCoordinatesValidator();

  it('matches task.pdf visibility example at (3, 2)', () => {
    const repository = new NaiveLocationRepository(pdfExampleDataset(), validator);
    const hits = repository.searchVisible(3, 2);

    expect(hits.map((hit) => hit.id)).toEqual(['loc-2', 'loc-4']);
    expect(hits[0].distance).toBeCloseTo(1, 10);
    expect(hits[1].distance).toBeCloseTo(Math.SQRT2, 5);
  });

  it('returns hits sorted by ascending distance', () => {
    const dataset = LocationDataset.fromLocations([
      locationRow({
        id: 'far',
        name: 'Far',
        coordinates: 'x=0,y=0',
        x: 0,
        y: 0,
        radius: 100,
      }),
      locationRow({
        id: 'near',
        name: 'Near',
        coordinates: 'x=3,y=2',
        x: 3,
        y: 2,
        radius: 10,
      }),
    ]);
    const repository = new NaiveLocationRepository(dataset, validator);
    const hits = repository.searchVisible(3, 2);
    expect(hits.map((hit) => hit.id)).toEqual(['near', 'far']);
  });

  it('includes locations when distance equals radius', () => {
    const dataset = LocationDataset.fromLocations([
      locationRow({
        id: 'edge',
        name: 'Edge',
        coordinates: 'x=0,y=0',
        x: 0,
        y: 0,
        radius: 5,
      }),
    ]);
    const repository = new NaiveLocationRepository(dataset, validator);
    const hits = repository.searchVisible(3, 4);
    expect(hits).toHaveLength(1);
    expect(hits[0].distance).toBe(5);
  });

  it('getById returns a row by UUID key', () => {
    const dataset = pdfExampleDataset();
    const repository = new NaiveLocationRepository(dataset, validator);
    expect(repository.getById('loc-2')?.name).toBe('Restaurant #2');
    expect(repository.getById('missing')).toBeUndefined();
  });

  it('rejects non-integer or negative user coordinates', () => {
    const repository = new NaiveLocationRepository(pdfExampleDataset(), validator);
    expect(() => repository.searchVisible(-1, 0)).toThrow(InvalidSearchCoordinatesError);
    expect(() => repository.searchVisible(1.5, 0)).toThrow(InvalidSearchCoordinatesError);
  });

  it('returns an empty list when no restaurant covers the user', () => {
    const dataset = LocationDataset.fromLocations([
      locationRow({
        id: 'tiny',
        name: 'Tiny',
        coordinates: 'x=0,y=0',
        x: 0,
        y: 0,
        radius: 1,
      }),
    ]);
    const repository = new NaiveLocationRepository(dataset, validator);
    expect(repository.searchVisible(10, 10)).toEqual([]);
  });
});
