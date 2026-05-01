import type { ParsedLocation } from './parsed-location.js';

/**
 * Loaded catalog: immutable list plus {@link maxRadius} (R_max) for spatial indexing.
 */
export class LocationDataset {
  private constructor(
    public readonly locations: readonly ParsedLocation[],
    /** Maximum `radius` across all locations; `0` when {@link locations} is empty. */
    public readonly maxRadius: number,
  ) {}

  static fromLocations(locations: readonly ParsedLocation[]): LocationDataset {
    const maxRadius =
      locations.length === 0 ? 0 : Math.max(...locations.map((location) => location.radius));
    return new LocationDataset(locations, maxRadius);
  }
}
