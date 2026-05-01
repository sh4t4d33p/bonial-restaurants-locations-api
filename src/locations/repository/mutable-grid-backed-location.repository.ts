import { LocationDataset } from '../location-dataset.js';
import type { ParsedLocation } from '../parsed-location.js';
import type { LocationSearchHit } from '../location-search-hit.js';
import { GridLocationRepository } from './grid-location.repository.js';
import type { UserSearchCoordinatesValidator } from './user-search-coordinates.validator.js';
import type { WritableLocationRepository } from './location.repository.js';

/**
 * **Process-wide mutable catalog** used by HTTP `PUT` and reads.
 *
 * We keep a `Map` for authoritative rows and a {@link GridLocationRepository} snapshot for search.
 * After every {@link upsert}, we **rebuild** the grid from scratch — `O(n)` but simple and always
 * correct when radii (hence `R_max`) change. Example: bumping one restaurant’s radius from `5` to `500`
 * enlarges `R_max`, which changes cell size; rebuilding avoids subtle stale-index bugs.
 */
export class MutableGridBackedLocationRepository implements WritableLocationRepository {
  private readonly locationsById = new Map<string, ParsedLocation>();
  private readonly validator: UserSearchCoordinatesValidator;
  private grid: GridLocationRepository;

  constructor(
    initial: readonly ParsedLocation[],
    validator: UserSearchCoordinatesValidator,
  ) {
    this.validator = validator;
    for (const location of initial) {
      this.locationsById.set(location.id, location);
    }
    this.grid = this.rebuildGrid();
  }

  /** Recomputes {@link LocationDataset} statistics (`maxRadius`) and reconstructs the spatial hash. */
  private rebuildGrid(): GridLocationRepository {
    const list = [...this.locationsById.values()];
    const dataset = LocationDataset.fromLocations(list);
    return new GridLocationRepository(dataset, this.validator);
  }

  /** Reads straight from the map (not the grid) so `getById` stays consistent mid-rebuild. */
  getById(id: string): ParsedLocation | undefined {
    return this.locationsById.get(id);
  }

  /** Delegates to the latest grid snapshot built from the map contents. */
  searchVisible(userX: number, userY: number): LocationSearchHit[] {
    return [...this.grid.searchVisible(userX, userY)];
  }

  /** Inserts or replaces a row, then refreshes the spatial index so search reflects the change immediately. */
  upsert(location: ParsedLocation): void {
    this.locationsById.set(location.id, location);
    this.grid = this.rebuildGrid();
  }
}
