/**
 * Parses task-style coordinate strings: `x=4,y=5` with non-negative integers.
 */
export class CoordinatesParser {
  /** Strict regex: only non-negative ASCII digits, exactly one `x=` and `y=` pair, no spaces inside. */
  private static readonly pattern = /^x=(\d+),y=(\d+)$/u;

  /**
   * @example `parse("  x=0,y=9  ")` → `{ x: 0, y: 9 }`
   * @example `parse("x=-1,y=0")` throws — negatives are rejected by the pattern, not parsed then clamped.
   */
  parse(input: string): { readonly x: number; readonly y: number } {
    const trimmed = input.trim();
    const match = CoordinatesParser.pattern.exec(trimmed);
    if (match === null) {
      throw new Error(`Invalid coordinates format: ${JSON.stringify(input)}`);
    }
    const x = Number.parseInt(match[1], 10);
    const y = Number.parseInt(match[2], 10);
    return { x, y };
  }
}
