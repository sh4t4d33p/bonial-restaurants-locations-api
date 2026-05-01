import type { LocationDataset } from '../location-dataset.js';
import type { ParsedLocation } from '../parsed-location.js';
import type { LocationSearchHit } from '../location-search-hit.js';
import { buildLocationIdIndex } from './location-id-index.js';
import { appendHitIfVisible, sortHitsByDistance } from './location-search-hits.util.js';
import type { LocationRepository } from './location.repository.js';
import type { UserSearchCoordinatesValidator } from './user-search-coordinates.validator.js';

/**
 * **Reference implementation** for {@link LocationRepository}: scans every restaurant (`O(n)`),
 * uses `dist² ≤ r²` to avoid redundant `sqrt` calls during filtering, then sorts hits.
 * Paired with {@link GridLocationRepository} in tests to guarantee identical outputs on random queries.
 */
export class NaiveLocationRepository implements LocationRepository {
  private readonly idIndex: ReadonlyMap<string, ParsedLocation>;

  constructor(
    private readonly dataset: LocationDataset,
    private readonly coordinatesValidator: UserSearchCoordinatesValidator,
  ) {
    this.idIndex = buildLocationIdIndex(dataset.locations);
  }

  getById(id: string): ParsedLocation | undefined {
    return this.idIndex.get(id);
  }

  searchVisible(userX: number, userY: number): LocationSearchHit[] {
    this.coordinatesValidator.validate(userX, userY);

    const hits: LocationSearchHit[] = [];

    // Example: user (3,2), venue (2,2) radius 2 → distance 1 ≤ 2 → included; (5,5) radius 1 → excluded.
    for (const location of this.dataset.locations) {
      appendHitIfVisible(location, userX, userY, hits);
    }

    sortHitsByDistance(hits);
    return hits;
  }
}
