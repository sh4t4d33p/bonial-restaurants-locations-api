import type { RawLocationFileRoot, RawLocationRecord } from './location-json.types.js';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isRawLocationRecord(value: unknown): value is RawLocationRecord {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    isNonEmptyString(record.id) &&
    isNonEmptyString(record.name) &&
    isNonEmptyString(record.type) &&
    isNonEmptyString(record['opening-hours']) &&
    isNonEmptyString(record.image) &&
    isNonEmptyString(record.coordinates) &&
    typeof record.radius === 'number'
  );
}

export function assertRawLocationFileRoot(value: unknown): asserts value is RawLocationFileRoot {
  if (value === null || typeof value !== 'object') {
    throw new Error('Location file root must be a JSON object');
  }
  const root = value as Record<string, unknown>;
  if (!Array.isArray(root.locations)) {
    throw new Error('Location file must contain a "locations" array');
  }
  for (const [index, item] of root.locations.entries()) {
    if (!isRawLocationRecord(item)) {
      throw new Error(`Invalid location record at index ${String(index)}`);
    }
  }
}
