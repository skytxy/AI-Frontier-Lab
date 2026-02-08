/**
 * Code Statistics Tool
 *
 * Analyzes codebase statistics:
 * - Lines of code (LOC) by language
 * - File counts by extension
 * - Total files and directories
 */

import { z } from 'zod';
import { promises as fs, Dirent } from 'fs';
import { join } from 'path';

// #region Schema Definition

export const CodeStatsInputSchema = z.object({
  path: z.string().describe('Root directory to analyze (absolute path)'),
  includeComments: z.boolean().default(false).describe('Include comments in LOC count'),
});

export type CodeStatsInput = z.infer<typeof CodeStatsInputSchema>;

// #endregion

// #region Result Types

export interface CodeStatsResult {
  summary: {
    totalFiles: number;
    totalDirs: number;
    totalLines: number;
    codeLines: number;
    commentLines: number;
    blankLines: number;
  };
  byLanguage: Record<string, {
    files: number;
    lines: number;
    codeLines: number;
    commentLines: number;
    blankLines: number;
  }>;
  byExtension: Record<string, number>;
}

// #endregion

// #region Language Detection

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.rs': 'Rust',
  '.go': 'Go',
  '.java': 'Java',
  '.c': 'C',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.h': 'C/C++',
  '.hpp': 'C++',
  '.cs': 'C#',
  '.php': 'PHP',
  '.rb': 'Ruby',
  '.kt': 'Kotlin',
  '.swift': 'Swift',
  '.scala': 'Scala',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
  '.fish': 'Shell',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.xml': 'XML',
  '.toml': 'TOML',
  '.md': 'Markdown',
  '.txt': 'Text',
  '.html': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.less': 'Less',
};

function getLanguage(ext: string): string {
  return LANGUAGE_MAP[ext] || 'Other';
}

// #endregion

// #region Comment Patterns

const COMMENT_PATTERNS: Record<string, { single: RegExp[]; multiStart: RegExp; multiEnd: RegExp }> = {
  'C/C++': {
    single: [/^\/\/.*$/],
    multiStart: /\/\*/,
    multiEnd: /\*\//,
  },
  'TypeScript': {
    single: [/^\/\/.*$/],
    multiStart: /\/\*/,
    multiEnd: /\*\//,
  },
  'JavaScript': {
    single: [/^\/\/.*$/],
    multiStart: /\/\*/,
    multiEnd: /\*\//,
  },
  'Python': {
    single: [/^#.*$/],
    multiStart: /"""/,
    multiEnd: /"""/,
  },
  'Shell': {
    single: [/^#.*$/],
    multiStart: /<<\*/,
    multiEnd: /\*>>/,
  },
};

// #endregion

// #region Implementation

export class CodeStatsTool {
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

  async execute(input: CodeStatsInput): Promise<CodeStatsResult> {
    const stats: CodeStatsResult = {
      summary: {
        totalFiles: 0,
        totalDirs: 0,
        totalLines: 0,
        codeLines: 0,
        commentLines: 0,
        blankLines: 0,
      },
      byLanguage: {},
      byExtension: {},
    };

    await this.analyzeDirectory(input.path, input, stats);

    return stats;
  }

  private async analyzeDirectory(
    dirPath: string,
    input: CodeStatsInput,
    stats: CodeStatsResult
  ): Promise<void> {
    let entries: Dirent[];

    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch (error) {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (this.excludeDirs.has(entry.name)) {
          continue;
        }
        stats.summary.totalDirs++;
        await this.analyzeDirectory(fullPath, input, stats);
      } else if (entry.isFile()) {
        await this.analyzeFile(fullPath, input, stats);
      }
    }
  }

  private async analyzeFile(
    filePath: string,
    input: CodeStatsInput,
    stats: CodeStatsResult
  ): Promise<void> {
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    const language = getLanguage(ext);

    stats.summary.totalFiles++;
    stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;

    if (!stats.byLanguage[language]) {
      stats.byLanguage[language] = {
        files: 0,
        lines: 0,
        codeLines: 0,
        commentLines: 0,
        blankLines: 0,
      };
    }

    stats.byLanguage[language].files++;

    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return;
    }

    const lines = content.split('\n');
    const commentPatterns = COMMENT_PATTERNS[language];

    stats.byLanguage[language].lines += lines.length;
    stats.summary.totalLines += lines.length;

    let inMultilineComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === '') {
        stats.byLanguage[language].blankLines++;
        stats.summary.blankLines++;
        continue;
      }

      if (commentPatterns && !inMultilineComment) {
        // Check for single-line comments
        const isSingleComment = commentPatterns.single.some((pattern) => pattern.test(trimmed));
        if (isSingleComment) {
          stats.byLanguage[language].commentLines++;
          stats.summary.commentLines++;
          continue;
        }

        // Check for multi-line comment start
        if (commentPatterns.multiStart.test(trimmed)) {
          inMultilineComment = true;
          stats.byLanguage[language].commentLines++;
          stats.summary.commentLines++;

          if (commentPatterns.multiEnd.test(trimmed)) {
            inMultilineComment = false;
          }
          continue;
        }
      } else if (inMultilineComment && commentPatterns) {
        stats.byLanguage[language].commentLines++;
        stats.summary.commentLines++;

        if (commentPatterns.multiEnd.test(trimmed)) {
          inMultilineComment = false;
        }
        continue;
      }

      stats.byLanguage[language].codeLines++;
      stats.summary.codeLines++;
    }
  }
}

// #endregion
