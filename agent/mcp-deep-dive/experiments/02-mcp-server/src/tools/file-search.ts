/**
 * File Search Tool
 *
 * Grep-style file search with support for:
 * - Pattern matching (string or regex)
 * - File extension filtering
 * - Path exclusion (node_modules, .git, etc.)
 *
 * #region Zod Schema
 *
 * Input validation using Zod ensures type safety and automatic
 * generation of JSON Schema for the MCP tool definition.
 *
 * #endregion
 */

import { z } from 'zod';
import { promises as fs, Dirent } from 'fs';
import { join, relative } from 'path';

// #region Schema Definition

export const FileSearchInputSchema = z.object({
  path: z.string().describe('Root directory to search in (absolute path)'),
  pattern: z.string().describe('Search pattern (string or regex)'),
  regex: z.boolean().default(false).describe('Treat pattern as regex'),
  filePattern: z.string().optional().describe('Filter files by glob pattern (e.g., "*.ts")'),
  maxResults: z.number().default(50).describe('Maximum number of results to return'),
  caseSensitive: z.boolean().default(false).describe('Case-sensitive search'),
});

export type FileSearchInput = z.infer<typeof FileSearchInputSchema>;

// #endregion

// #region Result Types

export interface FileSearchResult {
  path: string;
  line: number;
  column: number;
  match: string;
  contextBefore?: string[];
  contextAfter?: string[];
}

// #endregion

// #region Implementation

export class FileSearchTool {
  private excludeDirs = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    'target',
    '.next',
    '.cache',
    'coverage',
  ]);

  async execute(input: FileSearchInput): Promise<FileSearchResult[]> {
    const results: FileSearchResult[] = [];
    const searchRegex = this.buildRegex(input.pattern, input.regex, input.caseSensitive);

    await this.searchDirectory(input.path, searchRegex, input, results);

    return results.slice(0, input.maxResults);
  }

  private buildRegex(pattern: string, isRegex: boolean, caseSensitive: boolean): RegExp {
    if (isRegex) {
      return new RegExp(pattern, caseSensitive ? 'g' : 'gi');
    }
    // Escape special regex characters for literal string search
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, caseSensitive ? 'g' : 'gi');
  }

  private async searchDirectory(
    dirPath: string,
    regex: RegExp,
    input: FileSearchInput,
    results: FileSearchResult[]
  ): Promise<void> {
    let entries: Dirent[];

    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch (error) {
      // Skip directories we can't read
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (this.excludeDirs.has(entry.name)) {
          continue;
        }
        await this.searchDirectory(fullPath, regex, input, results);
      } else if (entry.isFile()) {
        if (input.filePattern && !this.matchesFilePattern(entry.name, input.filePattern)) {
          continue;
        }
        await this.searchFile(fullPath, regex, input, results);
      }
    }
  }

  private matchesFilePattern(filename: string, pattern: string): boolean {
    // Simple glob-to-regex conversion
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filename);
  }

  private async searchFile(
    filePath: string,
    regex: RegExp,
    input: FileSearchInput,
    results: FileSearchResult[]
  ): Promise<void> {
    let content: string;

    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      // Skip files we can't read
      return;
    }

    const lines = content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      regex.lastIndex = 0; // Reset regex state

      const match = regex.exec(line);
      if (match) {
        results.push({
          path: relative(input.path, filePath),
          line: lineIdx + 1,
          column: match.index + 1,
          match: match[0],
          contextBefore: lines.slice(Math.max(0, lineIdx - 2), lineIdx),
          contextAfter: lines.slice(lineIdx + 1, lineIdx + 3),
        });
      }
    }
  }
}

// #endregion
