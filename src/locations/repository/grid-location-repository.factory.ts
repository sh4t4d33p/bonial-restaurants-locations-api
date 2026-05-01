import type { LocationDataset } from '../location-dataset.js';
import { GridLocationRepository } from './grid-location.repository.js';
import type { LocationRepository } from './location.repository.js';
import { UserSearchCoordinatesValidator } from './user-search-coordinates.validator.js';

export function createGridLocationRepository(dataset: LocationDataset): LocationRepository {
  return new GridLocationRepository(dataset, new UserSearchCoordinatesValidator());
}
