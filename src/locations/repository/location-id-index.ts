import type { ParsedLocation } from '../parsed-location.js';

/** Last occurrence wins when the same `id` appears more than once. */
export function buildLocationIdIndex(
  locations: readonly ParsedLocation[],
): ReadonlyMap<string, ParsedLocation> {
  const map = new Map<string, ParsedLocation>();
  for (const location of locations) {
    map.set(location.id, location);
  }
  return map;
}
