import { CoordinatesParser } from './coordinates.parser.js';
import type { ParsedLocation } from './parsed-location.js';
import type { RawLocationRecord } from './location-json.types.js';

/**
 * Maps API/JSON rows into {@link ParsedLocation} with geometry validation.
 */
export class RawLocationRecordParser {
  constructor(private readonly coordinatesParser: CoordinatesParser) {}

  parse(record: RawLocationRecord): ParsedLocation {
    const radius = record.radius;
    if (!Number.isInteger(radius) || radius < 1) {
      throw new Error(`Invalid radius for location ${JSON.stringify(record.id)}`);
    }

    const { x, y } = this.coordinatesParser.parse(record.coordinates);

    return {
      id: record.id,
      name: record.name,
      type: record.type,
      openingHours: record['opening-hours'],
      image: record.image,
      radius,
      x,
      y,
      coordinates: record.coordinates.trim(),
    };
  }
}
