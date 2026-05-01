import type { LocationDataset } from '../location-dataset.js';
import type { ParsedLocation } from '../parsed-location.js';
import type { LocationSearchHit } from '../location-search-hit.js';
import { buildLocationIdIndex } from './location-id-index.js';
import { appendHitIfVisible, sortHitsByDistance } from './location-search-hits.util.js';
import type { LocationRepository } from './location.repository.js';
import type { UserSearchCoordinatesValidator } from './user-search-coordinates.validator.js';

/**
 * **Spatial index** for fast “visible from user point” queries.
 *
 * ### Idea (uniform grid)
 * - Let `R_max` be the largest restaurant radius in the dataset (see {@link LocationDataset.maxRadius}).
 * - Any restaurant that can cover the user must satisfy `distance(user, center) ≤ radius ≤ R_max`,
 *   hence `distance(user, center) ≤ R_max`. So we only scan centers inside a **square** of side `2·R_max`
 *   around the user (L∞ ball), then apply the exact circle test per restaurant.
 * - Each restaurant center `(xr, yr)` is stored in **one** cell `⌊xr / R_max⌋, ⌊yr / R_max⌋`.
 *
 * ### Example
 * If `R_max = 100` and a restaurant sits at `(250, 450)`, its cell is `(2, 4)` because `⌊250/100⌋ = 2`
 * and `⌊450/100⌋ = 4`. A user at `(260, 440)` searches cells overlapping `[160..360] × [340..540]`,
 * collects ids from those buckets, then keeps rows where `sqrt((xu-xr)²+(yu-yr)²) ≤ radius`.
 */
export class GridLocationRepository implements LocationRepository {
  private readonly idIndex: ReadonlyMap<string, ParsedLocation>;
  /** cellKey -> location ids whose center lies in that cell */
  private readonly grid: ReadonlyMap<string, ReadonlySet<string>>;
  private readonly rMax: number;

  constructor(
    private readonly dataset: LocationDataset,
    private readonly coordinatesValidator: UserSearchCoordinatesValidator,
  ) {
    this.idIndex = buildLocationIdIndex(dataset.locations);
    this.rMax = dataset.maxRadius;
    this.grid = GridLocationRepository.buildGrid(dataset.locations, this.rMax);
  }

  private static cellKey(cx: number, cy: number): string {
    return `${String(cx)},${String(cy)}`;
  }

  /**
   * Places each restaurant id into exactly one grid bucket based on its **center** coordinates.
   *
   * @example
   * `rMax = 50`, center `(75, 20)` → cell `(1, 0)` because `floor(75/50)=1`, `floor(20/50)=0`.
   */
  private static buildGrid(
    locations: readonly ParsedLocation[],
    rMax: number,
  ): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    if (locations.length === 0 || rMax <= 0) {
      return map;
    }

    for (const location of locations) {
      // Integer cell indices: shrink the plane into coarse tiles of width/height = rMax.
      const cx = Math.floor(location.x / rMax);
      const cy = Math.floor(location.y / rMax);
      const key = GridLocationRepository.cellKey(cx, cy);
      let bucket = map.get(key);
      if (bucket === undefined) {
        bucket = new Set<string>();
        map.set(key, bucket);
      }
      bucket.add(location.id);
    }

    return map;
  }

  /** O(1) lookup by primary key (last writer wins if ids collide in source data). */
  getById(id: string): ParsedLocation | undefined {
    return this.idIndex.get(id);
  }

  /**
   * Returns restaurants whose service disk contains `(userX, userY)`, sorted by distance ascending.
   *
   * @throws {InvalidSearchCoordinatesError} when coordinates are not non-negative integers.
   */
  searchVisible(userX: number, userY: number): LocationSearchHit[] {
    this.coordinatesValidator.validate(userX, userY);

    if (this.dataset.locations.length === 0 || this.rMax <= 0) {
      return [];
    }

    const s = this.rMax;
    // Enumerate every cell that could hold a center within R_max of the user (L∞ bounding box).
    // Example: user (30, 40), R_max=25 → x in [5,55], y in [15,65] → cell x indices floor(([5,55])/25) = {0,1,2}.
    const minCx = Math.floor((userX - this.rMax) / s);
    const maxCx = Math.floor((userX + this.rMax) / s);
    const minCy = Math.floor((userY - this.rMax) / s);
    const maxCy = Math.floor((userY + this.rMax) / s);

    const candidateIds = new Set<string>();
    for (let cx = minCx; cx <= maxCx; cx += 1) {
      for (let cy = minCy; cy <= maxCy; cy += 1) {
        const ids = this.grid.get(GridLocationRepository.cellKey(cx, cy));
        if (ids === undefined) {
          continue;
        }
        for (const id of ids) {
          candidateIds.add(id);
        }
      }
    }

    const hits: LocationSearchHit[] = [];
    for (const id of candidateIds) {
      const location = this.idIndex.get(id);
      if (location === undefined) {
        continue;
      }
      // Final exact check: inside the axis-aligned window we can still be outside the Euclidean R_max disk,
      // or outside the restaurant's own (smaller) radius — `appendHitIfVisible` uses dist² ≤ r².
      appendHitIfVisible(location, userX, userY, hits);
    }

    sortHitsByDistance(hits);
    return hits;
  }
}
