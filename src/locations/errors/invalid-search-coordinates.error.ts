export class InvalidSearchCoordinatesError extends Error {
  constructor(message = 'User coordinates must be non-negative integers') {
    super(message);
    this.name = 'InvalidSearchCoordinatesError';
  }
}
