// .claude/skills/chapter-content-validator/lib/setup.ts
/**
 * Setup detection and guidance for first-time users.
 */

import { existsSync } from 'fs';
import { join } from 'path';

export interface SetupCheckResult {
  hasConfig: boolean;
  configPath: string;
  templatePath: string;
  needsSetup: boolean;
}

/**
 * Check if the project has been configured for chapter validation.
 */
export function checkSetup(projectRoot: string): SetupCheckResult {
  const configPath = join(projectRoot, '.chapter-validation', 'config.yaml');
  const hasConfig = existsSync(configPath);
  const templatePath = join(projectRoot, '.claude', 'skills', 'chapter-content-validator', 'templates', 'config-template.yaml');

  return {
    hasConfig,
    configPath,
    templatePath,
    needsSetup: !hasConfig,
  };
}

/**
 * Generate the setup message shown to first-time users.
 */
export function getSetupMessage(check: SetupCheckResult): string {
  return `
## Chapter Content Validator - First-Time Setup

Detected that this project has not been configured for chapter validation yet.

To get started, choose one of the following:

### Option A: Interactive Setup (Recommended)
Run: /chapter-content-validator --setup

This will guide you through:
- Project type detection (agent/algorithm/general)
- Content directory structure
- Dependency configuration
- Seed experience patterns

### Option B: Manual Configuration
1. Copy the template:
   cp ${check.templatePath} ${check.configPath}

2. Edit .chapter-validation/config.yaml to match your project structure

### Option C: Use Defaults
Run validation without setup -- the Skill will use sensible defaults
and generate a suggested config after the first run.

---
`.trim();
}
