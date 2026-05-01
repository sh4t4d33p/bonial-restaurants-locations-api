/**
 * One visible restaurant for {@link LocationRepository.searchVisible}; distances are Euclidean.
 */
export type LocationSearchHit = Readonly<{
  id: string;
  name: string;
  coordinates: string;
  distance: number;
}>;
