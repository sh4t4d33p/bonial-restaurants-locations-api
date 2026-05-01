import { describe, expect, it } from 'vitest';

import { CoordinatesParser } from './coordinates.parser.js';

describe('CoordinatesParser', () => {
  const parser = new CoordinatesParser();

  it('parses non-negative integer coordinates', () => {
    expect(parser.parse('x=0,y=0')).toEqual({ x: 0, y: 0 });
    expect(parser.parse('x=4,y=5')).toEqual({ x: 4, y: 5 });
    expect(parser.parse('  x=999,y=1  ')).toEqual({ x: 999, y: 1 });
  });

  it('rejects invalid formats', () => {
    expect(() => parser.parse('x=-1,y=0')).toThrow(/Invalid coordinates/);
    expect(() => parser.parse('x=1,y=2,y=3')).toThrow(/Invalid coordinates/);
    expect(() => parser.parse('1,2')).toThrow(/Invalid coordinates/);
    expect(() => parser.parse('')).toThrow(/Invalid coordinates/);
  });
});
