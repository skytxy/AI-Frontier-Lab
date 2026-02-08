// .claude/skills/docwise/lib/sandbox-manager.ts

import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SandboxManager {
  private chapterPath: string;
  private basePath: string;

  constructor(projectRoot: string, chapterPath: string) {
    this.chapterPath = chapterPath;
    this.basePath = join(projectRoot, chapterPath, '.docwise', 'sandbox');
  }

  /**
   * Create a new sandbox directory
   */
  async createSandbox(description: string): Promise<string> {
    // Find next available ID
    const existingSandboxIds = await this.getExistingSandboxIds();
    const nextId = existingSandboxIds.length > 0
      ? Math.max(...existingSandboxIds) + 1
      : 1;

    // Create safe directory name from description
    const safeDesc = description.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);

    const sandboxName = `${String(nextId).padStart(3, '0')}-${safeDesc}`;
    const sandboxPath = join(this.basePath, sandboxName);

    await mkdir(sandboxPath, { recursive: true });

    return sandboxName;
  }

  /**
   * Setup language isolation in sandbox
   */
  async setupIsolation(
    sandboxPath: string,
    language: 'python' | 'node' | 'rust' | 'go' | 'java' | 'cpp' | 'none'
  ): Promise<void> {
    if (language === 'python') {
      await this.setupPythonSandbox(sandboxPath);
    } else if (language === 'node') {
      await this.setupNodeSandbox(sandboxPath);
    }
    // Other languages have automatic isolation
  }

  private async setupPythonSandbox(sandboxPath: string): Promise<void> {
    const venvPath = join(sandboxPath, '.venv');

    // Try uv first (faster), fall back to python -m venv
    try {
      await execAsync('uv venv .venv', { cwd: sandboxPath });
    } catch {
      try {
        await execAsync('python3 -m venv .venv', { cwd: sandboxPath });
      } catch {
        // venv creation failed, but continue anyway
        // The sandbox will still be created, just without virtual environment
      }
    }
  }

  private async setupNodeSandbox(sandboxPath: string): Promise<void> {
    // Create package.json if not exists
    const packageJsonPath = join(sandboxPath, 'package.json');

    try {
      await execAsync('npm init -y', { cwd: sandboxPath });
    } catch {
      // npm init might fail if package.json exists, that's OK
    }
  }

  /**
   * Get existing sandbox IDs
   */
  async getExistingSandboxIds(): Promise<number[]> {
    const { readdir } = await import('fs/promises');

    try {
      const entries = await readdir(this.basePath, { withFileTypes: true });
      const ids: number[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const match = entry.name.match(/^(\d+)-/);
          if (match) {
            ids.push(parseInt(match[1], 10));
          }
        }
      }

      return ids.sort((a, b) => a - b);
    } catch {
      return [];
    }
  }

  /**
   * Get sandbox path by ID
   */
  getSandboxPath(id: string | number): string {
    return join(this.basePath, String(id));
  }

  /**
   * Get full sandbox path
   */
  getFullSandboxPath(sandboxName: string): string {
    return join(this.basePath, sandboxName);
  }
}
