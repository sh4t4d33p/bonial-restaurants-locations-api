import type { ParsedLocation } from '../parsed-location.js';
import type { LocationSearchHit } from '../location-search-hit.js';

/**
 * **Read model** for restaurant catalogs (search + lookup). Implemented by both the naive scanner
 * and the grid-backed index for parity testing.
 */
export interface LocationRepository {
  /** Returns the parsed row for `id`, or `undefined` when unknown. */
  getById(id: string): ParsedLocation | undefined;
  /**
   * Restaurants whose service radius covers `(userX, userY)`, sorted by ascending Euclidean distance.
   * @example At user `(3,2)`, a venue at `(2,2)` with radius `2` is included because distance `1 ≤ 2`.
   */
  searchVisible(userX: number, userY: number): readonly LocationSearchHit[];
}

/** Extends reads with `upsert`, used by `PUT /locations/:id` and backed by `MutableGridBackedLocationRepository`. */
export interface WritableLocationRepository extends LocationRepository {
  /** Inserts or replaces a row by `location.id`. */
  upsert(location: ParsedLocation): void;
}
