import { LocationDataset } from '../../location-dataset.js';
import type { ParsedLocation } from '../../parsed-location.js';

export function locationRow(
  fields: Pick<ParsedLocation, 'id' | 'name' | 'coordinates' | 'radius' | 'x' | 'y'>,
): ParsedLocation {
  return {
    type: 'Restaurant',
    openingHours: '10:00AM-10:00PM',
    image: 'https://tinyurl.com',
    ...fields,
  };
}

/** Scenario from task.pdf: user (3,2) sees #2 and #4 only. */
export function pdfExampleDataset(): LocationDataset {
  return LocationDataset.fromLocations([
    locationRow({
      id: 'loc-1',
      name: 'Restaurant #1',
      coordinates: 'x=1,y=1',
      x: 1,
      y: 1,
      radius: 1,
    }),
    locationRow({
      id: 'loc-2',
      name: 'Restaurant #2',
      coordinates: 'x=2,y=2',
      x: 2,
      y: 2,
      radius: 2,
    }),
    locationRow({
      id: 'loc-3',
      name: 'Restaurant #3',
      coordinates: 'x=5,y=5',
      x: 5,
      y: 5,
      radius: 1,
    }),
    locationRow({
      id: 'loc-4',
      name: 'Restaurant #4',
      coordinates: 'x=2,y=3',
      x: 2,
      y: 3,
      radius: 5,
    }),
  ]);
}
