import type { ParsedLocation } from '../parsed-location.js';
import type { LocationSearchHit } from '../location-search-hit.js';

export function appendHitIfVisible(
  location: ParsedLocation,
  userX: number,
  userY: number,
  hits: LocationSearchHit[],
): void {
  const dx = userX - location.x;
  const dy = userY - location.y;
  const distSq = dx * dx + dy * dy;
  const radiusSq = location.radius * location.radius;
  if (distSq <= radiusSq) {
    hits.push({
      id: location.id,
      name: location.name,
      coordinates: location.coordinates,
      distance: Math.sqrt(distSq),
    });
  }
}

/** Ascending distance; tie-break by `id` for deterministic parity across strategies. */
export function sortHitsByDistance(hits: LocationSearchHit[]): void {
  hits.sort((a, b) => {
    if (a.distance !== b.distance) {
      return a.distance - b.distance;
    }
    return a.id.localeCompare(b.id);
  });
}
