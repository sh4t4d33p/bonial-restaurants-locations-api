import { CoordinatesParser } from '../locations/coordinates.parser.js';
import { RawLocationRecordParser } from '../locations/raw-location-record.parser.js';
import { LocationDatasetLoader } from './location-dataset.loader.js';
import { LocationFileReader } from './location-file.reader.js';

/** Default wiring for file-backed location catalogs (swap in tests). */
export function createLocationDatasetLoader(): LocationDatasetLoader {
  const coordinatesParser = new CoordinatesParser();
  return new LocationDatasetLoader(
    new LocationFileReader(),
    new RawLocationRecordParser(coordinatesParser),
  );
}
