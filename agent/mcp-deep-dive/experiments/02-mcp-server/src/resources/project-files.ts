/**
 * Project Files Resource
 *
 * Exposes a directory structure as MCP Resources, allowing clients to:
 * - List files in a directory
 * - Read file contents
 * - Subscribe to file changes (via URI templates)
 */

import { z } from 'zod';
import { promises as fs } from 'fs';
import { join, relative, isAbsolute } from 'path';

// #region Schema Definition

export const ProjectFilesListSchema = z.object({
  path: z.string().describe('Directory path to list (absolute)'),
  recursive: z.boolean().default(false).describe('List files recursively'),
  includeHidden: z.boolean().default(false).describe('Include hidden files (.*)'),
});

export const ProjectFilesReadSchema = z.object({
  uri: z.string().describe('Resource URI (e.g., file:///path/to/file)'),
});

export type ProjectFilesListInput = z.infer<typeof ProjectFilesListSchema>;
export type ProjectFilesReadInput = z.infer<typeof ProjectFilesReadSchema>;

// #endregion

// #region Implementation

export class ProjectFilesResource {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  /**
   * List files in a directory
   */
  async list(input: ProjectFilesListInput): Promise<string[]> {
    const basePath = isAbsolute(input.path) ? input.path : join(this.rootPath, input.path);

    const files: string[] = [];

    try {
      await this.listDirectory(basePath, input.recursive, input.includeHidden, files);
    } catch (error) {
      throw new Error(`Failed to list directory: ${error}`);
    }

    return files;
  }

  /**
   * Read file content
   */
  async read(input: ProjectFilesReadInput): Promise<{
    uri: string;
    content: string;
    mimeType?: string;
  }> {
    // Parse URI: file:///path/to/file
    const match = input.uri.match(/^file:\/\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid URI format: ${input.uri}`);
    }

    const filePath = decodeURIComponent(match[1]);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const mimeType = this.getMimeType(filePath);

      return {
        uri: input.uri,
        content,
        mimeType,
      };
    } catch (error) {
      throw new Error(`Failed to read file: ${error}`);
    }
  }

  private async listDirectory(
    dirPath: string,
    recursive: boolean,
    includeHidden: boolean,
    results: string[]
  ): Promise<void> {
    let entries: fs.Dirent[];

    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch (error) {
      throw error;
    }

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      // Skip hidden files if requested
      if (!includeHidden && entry.name.startsWith('.')) {
        continue;
      }

      if (entry.isDirectory()) {
        if (recursive) {
          await this.listDirectory(fullPath, recursive, includeHidden, results);
        }
      } else {
        // Return relative path from root
        const relPath = relative(this.rootPath, fullPath);
        results.push(relPath);
      }
    }
  }

  private getMimeType(filePath: string): string {
    const ext = filePath.substring(filePath.lastIndexOf('.'));

    const MIME_MAP: Record<string, string> = {
      '.ts': 'text/typescript',
      '.tsx': 'text/typescript',
      '.js': 'text/javascript',
      '.jsx': 'text/javascript',
      '.json': 'application/json',
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.xml': 'application/xml',
      '.yaml': 'application/x-yaml',
      '.yml': 'application/x-yaml',
    };

    return MIME_MAP[ext] || 'text/plain';
  }
}

// #endregion
