/**
 * Shape of one row in the provided JSON files (snake-case / hyphen keys as on disk).
 */
export type RawLocationRecord = Readonly<{
  id: string;
  name: string;
  type: string;
  'opening-hours': string;
  image: string;
  coordinates: string;
  radius: number;
}>;

export type RawLocationFileRoot = Readonly<{
  locations: readonly RawLocationRecord[];
}>;
