import { InvalidSearchCoordinatesError } from '../errors/invalid-search-coordinates.error.js';

/**
 * Task constraint: user position lives in the first quadrant (non-negative integers).
 */
export class UserSearchCoordinatesValidator {
  validate(x: number, y: number): void {
    if (!Number.isInteger(x) || x < 0 || !Number.isInteger(y) || y < 0) {
      throw new InvalidSearchCoordinatesError();
    }
  }
}
