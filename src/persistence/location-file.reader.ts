import { readFile } from 'node:fs/promises';

/**
 * Thin IO boundary: reads UTF-8 text from disk (JSON parsing stays in the loader).
 */
export class LocationFileReader {
  async readText(absolutePath: string): Promise<string> {
    try {
      return await readFile(absolutePath, 'utf8');
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Unable to read file at "${absolutePath}": ${detail}`);
    }
  }
}
