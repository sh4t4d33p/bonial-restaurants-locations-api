import type { LocationDataset } from '../location-dataset.js';
import { NaiveLocationRepository } from './naive-location.repository.js';
import type { LocationRepository } from './location.repository.js';
import { UserSearchCoordinatesValidator } from './user-search-coordinates.validator.js';

export function createNaiveLocationRepository(dataset: LocationDataset): LocationRepository {
  return new NaiveLocationRepository(dataset, new UserSearchCoordinatesValidator());
}
