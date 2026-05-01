import { describe, expect, it } from 'vitest';

import { CoordinatesParser } from './coordinates.parser.js';
import type { RawLocationRecord } from './location-json.types.js';
import { RawLocationRecordParser } from './raw-location-record.parser.js';

const baseRecord: RawLocationRecord = {
  id: '51e1545c-8b65-4d83-82f9-7fcad4a23111',
  name: 'Da Jia Le',
  type: 'Restaurant',
  'opening-hours': '10:00AM-11:00PM',
  image: 'https://tinyurl.com',
  coordinates: 'x=5,y=5',
  radius: 3,
};

describe('RawLocationRecordParser', () => {
  const parser = new RawLocationRecordParser(new CoordinatesParser());

  it('maps hyphen keys and coordinates', () => {
    const parsed = parser.parse(baseRecord);
    expect(parsed).toMatchObject({
      id: baseRecord.id,
      name: baseRecord.name,
      openingHours: baseRecord['opening-hours'],
      radius: 3,
      x: 5,
      y: 5,
      coordinates: 'x=5,y=5',
    });
  });

  it('rejects non-positive or non-integer radius', () => {
    expect(() => parser.parse({ ...baseRecord, radius: 0 })).toThrow(/Invalid radius/);
    expect(() => parser.parse({ ...baseRecord, radius: 1.5 })).toThrow(/Invalid radius/);
  });
});
