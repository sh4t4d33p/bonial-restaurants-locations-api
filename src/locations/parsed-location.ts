/**
 * Canonical in-memory shape: numeric geometry plus fields needed for HTTP responses.
 */
export type ParsedLocation = Readonly<{
  id: string;
  name: string;
  type: string;
  openingHours: string;
  image: string;
  /** Positive integer; search uses distance ≤ radius. */
  radius: number;
  x: number;
  y: number;
  /** Verbatim `coordinates` string from the data file (API echoes this format). */
  coordinates: string;
}>;
