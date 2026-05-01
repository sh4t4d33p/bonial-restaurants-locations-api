import { describe, expect, it } from 'vitest';

import { InvalidSearchCoordinatesError } from '../errors/invalid-search-coordinates.error.js';
import { GridLocationRepository } from './grid-location.repository.js';
import { pdfExampleDataset } from './test-fixtures/pdf-search.dataset.js';
import { UserSearchCoordinatesValidator } from './user-search-coordinates.validator.js';

describe('GridLocationRepository', () => {
  const validator = new UserSearchCoordinatesValidator();

  it('matches task.pdf visibility example at (3, 2)', () => {
    const repository = new GridLocationRepository(pdfExampleDataset(), validator);
    const hits = repository.searchVisible(3, 2);

    expect(hits.map((hit) => hit.id)).toEqual(['loc-2', 'loc-4']);
    expect(hits[0].distance).toBeCloseTo(1, 10);
    expect(hits[1].distance).toBeCloseTo(Math.SQRT2, 5);
  });

  it('getById matches naive behaviour for the PDF fixture', () => {
    const repository = new GridLocationRepository(pdfExampleDataset(), validator);
    expect(repository.getById('loc-2')?.name).toBe('Restaurant #2');
    expect(repository.getById('missing')).toBeUndefined();
  });

  it('rejects invalid user coordinates', () => {
    const repository = new GridLocationRepository(pdfExampleDataset(), validator);
    expect(() => repository.searchVisible(-1, 0)).toThrow(InvalidSearchCoordinatesError);
  });
});
