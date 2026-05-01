import type { ParsedLocation } from '../../locations/parsed-location.js';
import type { LocationSearchHit } from '../../locations/location-search-hit.js';

export type LocationSearchResponse = {
  'user-location': string;
  locations: Array<{
    id: string;
    name: string;
    coordinates: string;
    distance: number;
  }>;
};

export type LocationDetailResponse = {
  name: string;
  type: string;
  id: string;
  'opening-hours': string;
  image: string;
  coordinates: string;
};

/**
 * Translates **internal** `ParsedLocation` / `LocationSearchHit` models into **wire JSON** shapes
 * required by the Bonial challenge (notably hyphenated `user-location` and `opening-hours`).
 */
export class LocationHttpMapper {
  /**
   * Builds the `GET /locations/search` payload.
   *
   * @example
   * ```ts
   * mapper.toSearchResponse(3, 2, [{ id: '…', name: 'Fire Tiger', coordinates: 'x=2,y=3', distance: Math.SQRT2 }]);
   * // → { 'user-location': 'x=3,y=2', locations: [{ …, distance: 1.41421 }] }
   * ```
   */
  toSearchResponse(userX: number, userY: number, hits: readonly LocationSearchHit[]): LocationSearchResponse {
    return {
      'user-location': `x=${String(userX)},y=${String(userY)}`,
      locations: hits.map((hit) => ({
        id: hit.id,
        name: hit.name,
        coordinates: hit.coordinates,
        // Example: raw √2 → 1.414213562… → rounded to 1.41421 for stable JSON like task.pdf.
        distance: LocationHttpMapper.roundDistance(hit.distance),
      })),
    };
  }

  /** Builds the `GET /locations/:id` and `PUT /locations/:id` detail payload. */
  toDetailResponse(location: ParsedLocation): LocationDetailResponse {
    return {
      name: location.name,
      type: location.type,
      id: location.id,
      'opening-hours': location.openingHours,
      image: location.image,
      coordinates: location.coordinates,
    };
  }

  /**
   * Rounds to **5** fractional decimal places (half-up via `Math.round`), matching sample values such as `1.41421`.
   * @example `roundDistance(1) === 1`, `roundDistance(Math.SQRT2) === 1.41421`.
   */
  static roundDistance(distance: number): number {
    return Math.round(distance * 100_000) / 100_000;
  }
}
