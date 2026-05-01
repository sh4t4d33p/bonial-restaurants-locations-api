import { assertRawLocationFileRoot } from '../locations/location-json.guard.js';
import type { RawLocationFileRoot } from '../locations/location-json.types.js';
import { LocationDataset } from '../locations/location-dataset.js';
import type { ParsedLocation } from '../locations/parsed-location.js';
import { RawLocationRecordParser } from '../locations/raw-location-record.parser.js';
import type { LocationFileReader } from './location-file.reader.js';

/**
 * End-to-end **file → domain** pipeline: UTF-8 read, JSON parse, structural guard, per-row mapping.
 *
 * Each failure mode is wrapped with context (e.g. which row index failed) so operators can fix data quickly.
 * @example `await loader.load("/data/locations.json")` where the file matches `{ "locations": [ ... ] }`.
 */
export class LocationDatasetLoader {
  constructor(
    private readonly fileReader: LocationFileReader,
    private readonly recordParser: RawLocationRecordParser,
  ) {}

  async load(absolutePath: string): Promise<LocationDataset> {
    let text: string;
    try {
      text = await this.fileReader.readText(absolutePath);
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read locations file: ${detail}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Location file is not valid JSON (${message})`);
    }

    try {
      assertRawLocationFileRoot(parsed);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Location file has invalid structure: ${message}`);
    }

    const root = parsed as RawLocationFileRoot;
    const locations: ParsedLocation[] = [];

    for (const [index, record] of root.locations.entries()) {
      try {
        locations.push(this.recordParser.parse(record));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid location at index ${String(index)}: ${message}`);
      }
    }

    return LocationDataset.fromLocations(locations);
  }
}
