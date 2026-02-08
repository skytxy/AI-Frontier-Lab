# Chapter Content Validator - Full Rewrite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the Chapter Content Validator Skill from scratch as an experience-driven collaboration engine supporting validate/generate/optimize modes, dynamic agent collaboration selection, and cross-platform execution.

**Architecture:** The Skill is a generic, project-agnostic collaboration engine with three layers: Paradigm (project methodology) -> Skill (engine) -> Config (project-specific). It reads project config to understand chapter structure, uses an experience store to recommend collaboration modes, and coordinates agents (Learner/Author/Reviewer) through a mode-aware executor. All state is persisted in YAML for human readability and git-friendliness.

**Tech Stack:** TypeScript (Skill logic), YAML (config/experience/logs), Claude Code SubAgent API (agent coordination), Astro 5 (site build for web verification)

---

## Phase 0: First-Time Setup Detection

### Task 0: Implement setup detection and guidance

When a new project uses this Skill without configuration, guide the user to set up.

**Files:**
- Create: `.claude/skills/chapter-content-validator/lib/setup.ts`
- Modify: `.claude/skills/chapter-content-validator/skill.md` (add --setup parameter)

**Step 1: Write setup helper**

```typescript
// .claude/skills/chapter-content-validator/lib/setup.ts

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
```

**Step 2: Update skill.md to add --setup parameter**

Add to parameters section:
```yaml
  setup:
    description: "Run interactive setup to create .chapter-validation/config.yaml"
    type: boolean
    default: false
```

Add to skill body:
```markdown
## First-Time Setup

If .chapter-validation/config.yaml does not exist, the Skill will:
1. Detect the missing configuration
2. Show setup instructions (copy template OR run --setup)
3. Offer to run with defaults if user continues

### Interactive Setup (--setup flag)

When `--setup=true`, the Skill guides through configuration:

1. **Project Type**: What kind of content does this project have?
   - Agent/Infrastructure (MCP, Skills, Workflows)
   - Algorithms & Papers (CNN, Transformer, RL)
   - General/Other

2. **Content Structure**: Which directories contain chapter content?
   - Default: [concepts/, experiments/, implementation/]
   - User can specify custom directories

3. **Dependencies**: Do chapters have prerequisite relationships?
   - If yes: Prompt to define dependency graph
   - If no: Skip dependency handling

4. **Complexity**: Does your project include complex content requiring triple-agent?
   - Academic papers with math formulas
   - Proof-heavy algorithms
   - If yes: Add triple-agent seed patterns
```

**Step 3: Commit**

```bash
git add .claude/skills/chapter-content-validator/lib/setup.ts .claude/skills/chapter-content-validator/skill.md
git commit -m "feat(validator): add first-time setup detection and interactive guidance"
```

---

## Phase 1: Clean Slate + Core Types

### Task 1: Remove old implementation and set up fresh structure

**Files:**
- Delete: `.claude/skills/chapter-content-validator/lib/learner.ts`
- Delete: `.claude/skills/chapter-content-validator/lib/author.ts`
- Delete: `.claude/skills/chapter-content-validator/lib/coordinator.ts`
- Delete: `.claude/skills/chapter-content-validator/lib/feedback-processor.ts`
- Delete: `.claude/skills/chapter-content-validator/lib/validator.py`
- Delete: `.claude/skills/chapter-content-validator/lib/validator.sh`
- Delete: `.claude/skills/chapter-content-validator/api.ts`
- Delete: `.claude/skills/chapter-content-validator/index.ts`
- Delete: `.claude/skills/chapter-content-validator/templates/chapter-config.yaml`

**Step 1: Remove old files**

Run: `rm -f .claude/skills/chapter-content-validator/lib/*.ts .claude/skills/chapter-content-validator/lib/*.py .claude/skills/chapter-content-validator/lib/*.sh .claude/skills/chapter-content-validator/api.ts .claude/skills/chapter-content-validator/index.ts .claude/skills/chapter-content-validator/templates/chapter-config.yaml`
Expected: Files removed, directory structure preserved.

**Step 2: Create new directory structure**

Run: `mkdir -p .claude/skills/chapter-content-validator/{lib,templates}`
Expected: Directories exist. (NOTE: no `data/` dir - experience data lives at project level in `.chapter-validation/`)

**Step 3: Commit**

```bash
git add -A .claude/skills/chapter-content-validator/
git commit -m "chore: remove old chapter-content-validator implementation for full rewrite"
```

---

### Task 2: Define core TypeScript types

**Files:**
- Create: `.claude/skills/chapter-content-validator/lib/types.ts`

**Step 1: Write the types file**

```typescript
// .claude/skills/chapter-content-validator/lib/types.ts

/**
 * Core types for the Chapter Content Validator Skill.
 *
 * Design principle: Skill is generic and project-agnostic.
 * All project-specific knowledge comes from Config and Paradigm.
 */

// --- Work Modes ---

export type WorkMode = 'validate' | 'generate' | 'optimize';

// --- Collaboration Modes ---

export type CollaborationMode =
  | 'single-agent'
  | 'dual-agent'
  | 'triple-agent'
  | 'parallel-agents';

export interface CollaborationModeConfig {
  mode: CollaborationMode;
  agents: AgentRole[];
  description: string;
}

export type AgentRole = 'learner' | 'author' | 'reviewer' | 'validator';

// --- Experience Store ---

export interface ExperiencePattern {
  id: string;
  signature: ScenarioSignature;
  recommended_mode: CollaborationMode;
  stats: {
    success_rate: number;
    usage_count: number;
    avg_iterations: number;
  };
  feedback: ExperienceFeedback[];
}

export interface ScenarioSignature {
  content_type: string;      // e.g. 'academic_paper', 'technical_guide'
  complexity: 'low' | 'medium' | 'high';
  keywords: string[];
  work_mode: WorkMode;
}

export interface ExperienceFeedback {
  timestamp: string;
  success: boolean;
  iterations: number;
  notes: string;
}

// --- Config (project-specific, read from .chapter-validation/config.yaml) ---

export interface ProjectConfig {
  version: string;
  chapters: Record<string, ChapterConfig>;
  defaults: ChapterDefaults;
  seed_patterns?: ExperiencePattern[];  // initial experience rules from project config
}

export interface ChapterConfig {
  type: string;                        // 'academic_paper' | 'technical_guide' | ...
  sections?: string[];                 // content directories to validate
  prerequisites?: string[];            // dependency chapter paths
  scenarios?: Record<string, ScenarioTemplate>;
  collaboration_mode?: CollaborationMode;  // override default
}

export interface ChapterDefaults {
  max_iterations: number;
  collaboration_mode: CollaborationMode;
  sections: string[];
}

export interface ScenarioTemplate {
  type: string;
  description: string;
  requirements?: string[];
  verify?: string;
}

// --- Paradigm (project methodology, parsed from paradigm.md) ---

export interface DependencyGraph {
  nodes: string[];                     // chapter paths
  edges: Array<{ from: string; to: string }>;  // from depends on to
}

export interface ParadigmConfig {
  dependencies: DependencyGraph;
  quality_standards: QualityStandards;
  isolation: IsolationConfig;
}

export interface QualityStandards {
  learner_must_complete: boolean;
  max_iterations: number;
  require_web_verification: boolean;
}

export interface IsolationConfig {
  dev_port: number;
  validation_port_start: number;
  build_dir: string;
}

// --- Execution ---

export interface ExecutionContext {
  work_mode: WorkMode;
  chapter_path: string;
  scenario: string;
  scenario_mode: 'template' | 'freeform' | 'brainstorming';
  collaboration_mode: CollaborationMode;
  config: ChapterConfig;
  paradigm: ParadigmConfig;
  max_iterations: number;
}

export interface ExecutionResult {
  success: boolean;
  work_mode: WorkMode;
  collaboration_mode: CollaborationMode;
  iterations: number;
  chapter_path: string;
  scenario: string;
  gaps_found: number;
  gaps_resolved: number;
  files_modified: string[];
  files_created: string[];
  feedback: FeedbackEntry[];
  duration_ms: number;
}

// --- Feedback ---

export type FeedbackLevel = 1 | 2 | 3 | 4;

export interface FeedbackEntry {
  level: FeedbackLevel;
  target: string;           // file path or component name
  description: string;
  category: string;         // gap category
  applied: boolean;
  priority: 'low' | 'medium' | 'high';
}

// --- Agent Communication ---

export interface GapReport {
  iteration: number;
  gaps: Gap[];
  completion: 'success' | 'partial' | 'failed';
  blockers: string[];
}

export interface Gap {
  category: string;
  description: string;
  location: string;         // file path or section
  severity: 'minor' | 'major' | 'critical';
  suggested_fix?: string;
}

export interface FixResult {
  gaps_fixed: number;
  files_modified: string[];
  files_created: string[];
  new_categories: string[];
  difficult_types: string[];
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd .claude/skills/chapter-content-validator && npx tsc lib/types.ts --noEmit --strict --moduleResolution node --module es2022 --target es2022`
Expected: No errors.

**Step 3: Commit**

```bash
git add .claude/skills/chapter-content-validator/lib/types.ts
git commit -m "feat(validator): define core types for experience-driven collaboration engine"
```

---

## Phase 2: Experience Store

### Task 3: Implement Experience Store

The experience store is the heart of the "learning from experience" design. It persists patterns to YAML and provides matching/recommendation logic.

**Files:**
- Create: `.claude/skills/chapter-content-validator/lib/experience-store.ts`

NOTE: No seed data file in Skill directory. Seed patterns are defined in project config
(`.chapter-validation/config.yaml` -> `seed_patterns`). Runtime experience data is stored
at `.chapter-validation/experience.yaml` (project-level, grows over time).

**Step 1: (Seed data moved to Task 11 - project config)**

Seed patterns are now part of `.chapter-validation/config.yaml` under `seed_patterns:`.
The ExperienceStore reads from project-level `.chapter-validation/experience.yaml`,
bootstrapping from seed_patterns on first run.
```

**Step 2: Write experience store implementation**

```typescript
// .claude/skills/chapter-content-validator/lib/experience-store.ts

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type {
  ExperiencePattern,
  ScenarioSignature,
  CollaborationMode,
  ExperienceFeedback,
  ExecutionResult,
} from './types.js';

/**
 * Experience Store - learns from executions to recommend collaboration modes.
 *
 * Persists to YAML for human readability and git-friendliness.
 * The store grows over time: every execution adds feedback,
 * and new patterns can emerge from repeated scenarios.
 */
export class ExperienceStore {
  private patterns: ExperiencePattern[] = [];
  private filePath: string;

  /**
   * @param projectRoot - project root directory (NOT skill directory)
   * @param seedPatterns - initial patterns from project config (used on first run)
   */
  constructor(projectRoot: string, seedPatterns?: ExperiencePattern[]) {
    this.filePath = join(projectRoot, '.chapter-validation', 'experience.yaml');
    this.load();
    // Bootstrap from seed patterns if experience file is empty/missing
    if (this.patterns.length === 0 && seedPatterns && seedPatterns.length > 0) {
      this.patterns = seedPatterns;
      this.save();
    }
  }

  /**
   * Find the best matching pattern for a scenario signature.
   * Returns null if no match exceeds the minimum similarity threshold.
   */
  recommend(signature: ScenarioSignature): {
    pattern: ExperiencePattern;
    confidence: number;
  } | null {
    let bestMatch: ExperiencePattern | null = null;
    let bestScore = 0;

    for (const pattern of this.patterns) {
      const score = this.similarity(signature, pattern.signature);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = pattern;
      }
    }

    // Minimum threshold: 0.3
    if (!bestMatch || bestScore < 0.3) return null;

    return { pattern: bestMatch, confidence: bestScore };
  }

  /**
   * Record the result of an execution, updating stats and feedback.
   */
  async record(result: ExecutionResult): Promise<void> {
    const signature: ScenarioSignature = {
      content_type: this.inferContentType(result),
      complexity: this.inferComplexity(result),
      keywords: this.extractKeywords(result.scenario),
      work_mode: result.work_mode,
    };

    const match = this.recommend(signature);

    if (match && match.confidence > 0.5) {
      // Update existing pattern
      this.updatePattern(match.pattern, result);
    } else {
      // Create new pattern from this execution
      this.addPattern(signature, result);
    }

    this.save();
  }

  /**
   * Compute similarity between two scenario signatures (0-1).
   */
  private similarity(a: ScenarioSignature, b: ScenarioSignature): number {
    let score = 0;
    let weights = 0;

    // Work mode match (weight: 3)
    if (a.work_mode === b.work_mode) score += 3;
    weights += 3;

    // Content type match (weight: 2)
    if (a.content_type === b.content_type || b.content_type === 'any') score += 2;
    weights += 2;

    // Complexity match (weight: 1)
    if (a.complexity === b.complexity) score += 1;
    weights += 1;

    // Keyword overlap (weight: 2)
    const overlap = a.keywords.filter(k =>
      b.keywords.some(bk => k.toLowerCase().includes(bk.toLowerCase()) || bk.toLowerCase().includes(k.toLowerCase()))
    ).length;
    const maxKeywords = Math.max(a.keywords.length, b.keywords.length, 1);
    score += 2 * (overlap / maxKeywords);
    weights += 2;

    return score / weights;
  }

  private updatePattern(pattern: ExperiencePattern, result: ExecutionResult): void {
    const count = pattern.stats.usage_count;
    const newCount = count + 1;

    // Rolling average for success rate
    pattern.stats.success_rate =
      (pattern.stats.success_rate * count + (result.success ? 1 : 0)) / newCount;

    // Rolling average for iterations
    pattern.stats.avg_iterations =
      (pattern.stats.avg_iterations * count + result.iterations) / newCount;

    pattern.stats.usage_count = newCount;

    // Add feedback entry
    pattern.feedback.push({
      timestamp: new Date().toISOString(),
      success: result.success,
      iterations: result.iterations,
      notes: this.summarizeResult(result),
    });

    // Keep last 20 feedback entries
    if (pattern.feedback.length > 20) {
      pattern.feedback = pattern.feedback.slice(-20);
    }
  }

  private addPattern(signature: ScenarioSignature, result: ExecutionResult): void {
    const id = `${signature.content_type}-${signature.complexity}-${Date.now()}`;
    this.patterns.push({
      id,
      signature,
      recommended_mode: result.collaboration_mode,
      stats: {
        success_rate: result.success ? 1 : 0,
        usage_count: 1,
        avg_iterations: result.iterations,
      },
      feedback: [{
        timestamp: new Date().toISOString(),
        success: result.success,
        iterations: result.iterations,
        notes: this.summarizeResult(result),
      }],
    });
  }

  private inferContentType(result: ExecutionResult): string {
    const scenario = result.scenario.toLowerCase();
    if (scenario.match(/paper|arxiv|math|formula|proof/)) return 'academic_paper';
    if (scenario.match(/guide|tutorial|setup|quickstart/)) return 'technical_guide';
    if (scenario.match(/api|integration|protocol/)) return 'technical_integration';
    return 'general';
  }

  private inferComplexity(result: ExecutionResult): 'low' | 'medium' | 'high' {
    if (result.iterations <= 1) return 'low';
    if (result.iterations <= 3) return 'medium';
    return 'high';
  }

  private extractKeywords(scenario: string): string[] {
    // Simple keyword extraction - split by spaces, filter short words
    return scenario
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 10);
  }

  private summarizeResult(result: ExecutionResult): string {
    const status = result.success ? 'Success' : 'Failed';
    return `${status} in ${result.iterations} iterations, ${result.gaps_resolved}/${result.gaps_found} gaps resolved`;
  }

  // --- Persistence (simple YAML serialization) ---

  private load(): void {
    if (!existsSync(this.filePath)) {
      this.patterns = [];
      return;
    }
    try {
      const content = readFileSync(this.filePath, 'utf-8');
      this.patterns = this.parseYaml(content);
    } catch {
      this.patterns = [];
    }
  }

  private save(): void {
    const yaml = this.toYaml();
    writeFileSync(this.filePath, yaml, 'utf-8');
  }

  /**
   * Minimal YAML parser for experience.yaml format.
   * Only handles the specific structure we write.
   * For production, use a proper YAML library.
   */
  private parseYaml(content: string): ExperiencePattern[] {
    // Simple line-by-line parser for our specific YAML structure
    const patterns: ExperiencePattern[] = [];
    let current: Partial<ExperiencePattern> | null = null;
    let inSignature = false;
    let inStats = false;
    let inFeedback = false;
    let inFeedbackEntry = false;
    let currentFeedback: Partial<ExperienceFeedback> | null = null;
    let inKeywords = false;

    for (const rawLine of content.split('\n')) {
      const line = rawLine.trimEnd();
      if (line.startsWith('#') || line.trim() === '' || line.startsWith('version:')) continue;

      const indent = line.length - line.trimStart().length;
      const trimmed = line.trim();

      if (trimmed.startsWith('- id:')) {
        if (current && current.id) {
          patterns.push(current as ExperiencePattern);
        }
        current = {
          id: trimmed.split(':').slice(1).join(':').trim(),
          signature: { content_type: '', complexity: 'medium', keywords: [], work_mode: 'validate' },
          recommended_mode: 'dual-agent',
          stats: { success_rate: 0, usage_count: 0, avg_iterations: 0 },
          feedback: [],
        };
        inSignature = false; inStats = false; inFeedback = false;
        continue;
      }

      if (!current) continue;

      if (trimmed === 'signature:') { inSignature = true; inStats = false; inFeedback = false; continue; }
      if (trimmed === 'stats:') { inStats = true; inSignature = false; inFeedback = false; continue; }
      if (trimmed === 'feedback: []') { inFeedback = false; inSignature = false; inStats = false; continue; }
      if (trimmed === 'feedback:') { inFeedback = true; inSignature = false; inStats = false; continue; }
      if (trimmed.startsWith('recommended_mode:')) {
        current.recommended_mode = trimmed.split(':').slice(1).join(':').trim() as CollaborationMode;
        inSignature = false;
        continue;
      }

      if (inSignature && current.signature) {
        const [key, ...valParts] = trimmed.split(':');
        const val = valParts.join(':').trim();
        const k = key.trim();
        if (k === 'content_type') current.signature.content_type = val;
        if (k === 'complexity') current.signature.complexity = val as 'low' | 'medium' | 'high';
        if (k === 'work_mode') current.signature.work_mode = val as any;
        if (k === 'keywords') {
          const match = val.match(/\[(.+)\]/);
          if (match) {
            current.signature.keywords = match[1].split(',').map(s => s.trim());
          }
        }
      }

      if (inStats && current.stats) {
        const [key, ...valParts] = trimmed.split(':');
        const val = valParts.join(':').trim();
        const k = key.trim();
        if (k === 'success_rate') current.stats.success_rate = parseFloat(val);
        if (k === 'usage_count') current.stats.usage_count = parseInt(val);
        if (k === 'avg_iterations') current.stats.avg_iterations = parseFloat(val);
      }

      if (inFeedback) {
        if (trimmed.startsWith('- timestamp:')) {
          if (currentFeedback) current.feedback!.push(currentFeedback as ExperienceFeedback);
          currentFeedback = { timestamp: trimmed.split('timestamp:')[1].trim() };
        } else if (currentFeedback) {
          const [key, ...valParts] = trimmed.split(':');
          const val = valParts.join(':').trim();
          const k = key.trim();
          if (k === 'success') currentFeedback.success = val === 'true';
          if (k === 'iterations') currentFeedback.iterations = parseInt(val);
          if (k === 'notes') currentFeedback.notes = val.replace(/^"|"$/g, '');
        }
      }
    }

    // Push last pattern
    if (current && current.id) {
      if (currentFeedback && current.feedback) {
        current.feedback.push(currentFeedback as ExperienceFeedback);
      }
      patterns.push(current as ExperiencePattern);
    }

    return patterns;
  }

  private toYaml(): string {
    const lines: string[] = [
      '# Experience store for the Chapter Content Validator.',
      '# Auto-generated. Manual edits may be overwritten.',
      '',
      'version: "1.0"',
      'patterns:',
    ];

    for (const p of this.patterns) {
      lines.push(`  - id: ${p.id}`);
      lines.push('    signature:');
      lines.push(`      content_type: ${p.signature.content_type}`);
      lines.push(`      complexity: ${p.signature.complexity}`);
      lines.push(`      keywords: [${p.signature.keywords.join(', ')}]`);
      lines.push(`      work_mode: ${p.signature.work_mode}`);
      lines.push(`    recommended_mode: ${p.recommended_mode}`);
      lines.push('    stats:');
      lines.push(`      success_rate: ${p.stats.success_rate}`);
      lines.push(`      usage_count: ${p.stats.usage_count}`);
      lines.push(`      avg_iterations: ${p.stats.avg_iterations}`);
      if (p.feedback.length === 0) {
        lines.push('    feedback: []');
      } else {
        lines.push('    feedback:');
        for (const f of p.feedback) {
          lines.push(`      - timestamp: ${f.timestamp}`);
          lines.push(`        success: ${f.success}`);
          lines.push(`        iterations: ${f.iterations}`);
          lines.push(`        notes: "${f.notes}"`);
        }
      }
    }

    return lines.join('\n') + '\n';
  }

  // --- Public accessors for testing ---

  getPatterns(): readonly ExperiencePattern[] {
    return this.patterns;
  }

  getPatternById(id: string): ExperiencePattern | undefined {
    return this.patterns.find(p => p.id === id);
  }
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd .claude/skills/chapter-content-validator && npx tsc lib/experience-store.ts lib/types.ts --noEmit --strict --moduleResolution node --module es2022 --target es2022 --skipLibCheck`
Expected: No errors (or only minor FS-related type issues that are expected without full tsconfig).

**Step 4: Commit**

```bash
git add .claude/skills/chapter-content-validator/lib/experience-store.ts
git commit -m "feat(validator): add experience store with pattern matching and project-level persistence"
```

---

## Phase 3: Config Loader

### Task 4: Implement Config Loader

Reads project config from `.chapter-validation/config.yaml` and paradigm from `docs/frameworks/chapter-validation-paradigm.md`. Provides defaults for missing fields.

**Files:**
- Create: `.claude/skills/chapter-content-validator/lib/config-loader.ts`

**Step 1: Write the config loader**

```typescript
// .claude/skills/chapter-content-validator/lib/config-loader.ts

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import type {
  ProjectConfig,
  ChapterConfig,
  ChapterDefaults,
  ParadigmConfig,
  DependencyGraph,
  QualityStandards,
  IsolationConfig,
} from './types.js';

/**
 * Config Loader - reads project-specific configuration.
 *
 * Searches for config in this order:
 * 1. .chapter-validation/config.yaml (centralized, recommended)
 * 2. Individual chapter .chapter-validator.yaml (legacy, per-chapter)
 *
 * All fields have sensible defaults. Users only override what they need.
 */
export class ConfigLoader {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = resolve(projectRoot);
  }

  /**
   * Load the full project config with defaults applied.
   */
  loadProjectConfig(): ProjectConfig {
    const configPath = join(this.projectRoot, '.chapter-validation', 'config.yaml');

    if (existsSync(configPath)) {
      const raw = readFileSync(configPath, 'utf-8');
      return this.parseProjectConfig(raw);
    }

    // Return defaults if no config file exists
    return {
      version: '1.0',
      chapters: {},
      defaults: this.getDefaults(),
    };
  }

  /**
   * Load config for a specific chapter, merging with defaults.
   */
  loadChapterConfig(chapterPath: string): ChapterConfig {
    const project = this.loadProjectConfig();
    const defaults = project.defaults;

    // Check centralized config first
    const centralConfig = project.chapters[chapterPath];

    // Check per-chapter config as fallback
    const perChapterPath = join(this.projectRoot, chapterPath, '.chapter-validator.yaml');
    let perChapterConfig: Partial<ChapterConfig> = {};
    if (existsSync(perChapterPath)) {
      const raw = readFileSync(perChapterPath, 'utf-8');
      perChapterConfig = this.parseChapterConfig(raw);
    }

    // Merge: per-chapter overrides central overrides defaults
    return {
      type: perChapterConfig.type || centralConfig?.type || 'technical_guide',
      sections: perChapterConfig.sections || centralConfig?.sections || defaults.sections,
      prerequisites: perChapterConfig.prerequisites || centralConfig?.prerequisites || [],
      scenarios: { ...centralConfig?.scenarios, ...perChapterConfig.scenarios },
      collaboration_mode: perChapterConfig.collaboration_mode || centralConfig?.collaboration_mode || defaults.collaboration_mode,
    };
  }

  /**
   * Parse paradigm document for dependency graph and quality standards.
   */
  loadParadigm(): ParadigmConfig {
    const paradigmPath = join(this.projectRoot, 'docs', 'frameworks', 'chapter-validation-paradigm.md');

    if (!existsSync(paradigmPath)) {
      return this.getDefaultParadigm();
    }

    const content = readFileSync(paradigmPath, 'utf-8');
    return this.parseParadigm(content);
  }

  // --- Defaults ---

  private getDefaults(): ChapterDefaults {
    return {
      max_iterations: 5,
      collaboration_mode: 'dual-agent',
      sections: ['concepts/', 'experiments/'],
    };
  }

  private getDefaultParadigm(): ParadigmConfig {
    return {
      dependencies: { nodes: [], edges: [] },
      quality_standards: {
        learner_must_complete: true,
        max_iterations: 5,
        require_web_verification: false,
      },
      isolation: {
        dev_port: 3000,
        validation_port_start: 3001,
        build_dir: 'site',
      },
    };
  }

  // --- Parsers ---

  /**
   * Minimal parser for our project config YAML.
   * Handles the specific structure we define.
   */
  private parseProjectConfig(content: string): ProjectConfig {
    const config: ProjectConfig = {
      version: '1.0',
      chapters: {},
      defaults: this.getDefaults(),
    };

    let section: 'root' | 'chapters' | 'defaults' = 'root';
    let currentChapter: string | null = null;
    let currentChapterConfig: Partial<ChapterConfig> = {};

    for (const rawLine of content.split('\n')) {
      const line = rawLine.trimEnd();
      if (line.startsWith('#') || line.trim() === '') continue;

      const trimmed = line.trim();
      const indent = line.length - line.trimStart().length;

      if (trimmed.startsWith('version:')) {
        config.version = trimmed.split(':').slice(1).join(':').trim().replace(/"/g, '');
        continue;
      }
      if (trimmed === 'chapters:') { section = 'chapters'; continue; }
      if (trimmed === 'defaults:') { section = 'defaults'; continue; }

      if (section === 'chapters') {
        // Chapter key detection: ends with ':'
        if (indent === 2 && trimmed.endsWith(':') && !trimmed.includes(' ')) {
          if (currentChapter) {
            config.chapters[currentChapter] = currentChapterConfig as ChapterConfig;
          }
          currentChapter = trimmed.slice(0, -1);
          currentChapterConfig = {};
          continue;
        }

        if (currentChapter && indent >= 4) {
          this.parseConfigLine(trimmed, currentChapterConfig);
        }
      }

      if (section === 'defaults' && indent >= 2) {
        const [key, ...valParts] = trimmed.split(':');
        const val = valParts.join(':').trim();
        const k = key.trim();
        if (k === 'max_iterations') config.defaults.max_iterations = parseInt(val);
        if (k === 'collaboration_mode') config.defaults.collaboration_mode = val as any;
      }
    }

    // Push last chapter
    if (currentChapter) {
      config.chapters[currentChapter] = currentChapterConfig as ChapterConfig;
    }

    return config;
  }

  private parseConfigLine(trimmed: string, config: Partial<ChapterConfig>): void {
    const [key, ...valParts] = trimmed.split(':');
    const val = valParts.join(':').trim();
    const k = key.trim();

    if (k === 'type') config.type = val;
    if (k === 'collaboration_mode') config.collaboration_mode = val as any;
    if (k === 'sections') {
      const match = val.match(/\[(.+)\]/);
      if (match) config.sections = match[1].split(',').map(s => s.trim());
    }
    if (k === 'prerequisites') {
      const match = val.match(/\[(.+)\]/);
      if (match) config.prerequisites = match[1].split(',').map(s => s.trim());
    }
  }

  private parseChapterConfig(content: string): Partial<ChapterConfig> {
    const config: Partial<ChapterConfig> = {};

    for (const rawLine of content.split('\n')) {
      const trimmed = rawLine.trim();
      if (trimmed.startsWith('#') || trimmed === '') continue;
      this.parseConfigLine(trimmed, config);
    }

    return config;
  }

  /**
   * Parse paradigm Markdown for dependency graph.
   * Looks for a specific section with dependency definitions.
   */
  private parseParadigm(content: string): ParadigmConfig {
    const paradigm = this.getDefaultParadigm();

    // Extract dependency edges from lines like "# 依赖: chapter-path"
    const depRegex = /^\s*[├└│─\s]*(\S+)\/?\s+#\s*依赖:\s*(.+)$/gm;
    let match: RegExpExecArray | null;
    const nodes = new Set<string>();

    while ((match = depRegex.exec(content)) !== null) {
      const chapter = match[1].replace(/\/$/, '');
      const deps = match[2].split(',').map(s => s.trim().replace(/\/$/, ''));
      nodes.add(chapter);
      for (const dep of deps) {
        if (dep.endsWith('/*')) {
          // Wildcard: all chapters in directory
          const dir = dep.replace('/*', '');
          nodes.add(dir);
          paradigm.dependencies.edges.push({ from: chapter, to: dir });
        } else {
          nodes.add(dep);
          paradigm.dependencies.edges.push({ from: chapter, to: dep });
        }
      }
    }

    paradigm.dependencies.nodes = Array.from(nodes);
    return paradigm;
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd .claude/skills/chapter-content-validator && npx tsc lib/config-loader.ts lib/types.ts --noEmit --strict --moduleResolution node --module es2022 --target es2022 --skipLibCheck`
Expected: No errors.

**Step 3: Commit**

```bash
git add .claude/skills/chapter-content-validator/lib/config-loader.ts
git commit -m "feat(validator): add config loader with three-layer merge and paradigm parsing"
```

---

## Phase 4: Mode Recommender

### Task 5: Implement Mode Recommender

Connects experience store + config to produce a collaboration mode recommendation.

**Files:**
- Create: `.claude/skills/chapter-content-validator/lib/mode-recommender.ts`

**Step 1: Write the mode recommender**

```typescript
// .claude/skills/chapter-content-validator/lib/mode-recommender.ts

import type {
  CollaborationMode,
  WorkMode,
  ScenarioSignature,
  ChapterConfig,
} from './types.js';
import type { ExperienceStore } from './experience-store.js';

export interface ModeRecommendation {
  mode: CollaborationMode;
  confidence: number;
  source: 'experience' | 'config' | 'heuristic';
  reasoning: string;
}

/**
 * Mode Recommender - decides which collaboration mode to use.
 *
 * Priority order:
 * 1. Config override (user explicitly set collaboration_mode)
 * 2. Experience match (high confidence pattern from store)
 * 3. Heuristic fallback (rules based on work mode and content type)
 */
export class ModeRecommender {
  constructor(private experienceStore: ExperienceStore) {}

  recommend(
    workMode: WorkMode,
    scenario: string,
    chapterConfig: ChapterConfig
  ): ModeRecommendation {
    // 1. Config override takes precedence
    if (chapterConfig.collaboration_mode) {
      return {
        mode: chapterConfig.collaboration_mode,
        confidence: 1.0,
        source: 'config',
        reasoning: `Config explicitly sets collaboration_mode to ${chapterConfig.collaboration_mode}`,
      };
    }

    // 2. Experience-based recommendation
    const signature = this.buildSignature(workMode, scenario, chapterConfig);
    const experienceMatch = this.experienceStore.recommend(signature);

    if (experienceMatch && experienceMatch.confidence > 0.6) {
      const p = experienceMatch.pattern;
      return {
        mode: p.recommended_mode,
        confidence: experienceMatch.confidence,
        source: 'experience',
        reasoning: `Experience pattern "${p.id}" (${p.stats.usage_count} uses, ${(p.stats.success_rate * 100).toFixed(0)}% success) recommends ${p.recommended_mode}`,
      };
    }

    // 3. Heuristic fallback
    return this.heuristicRecommend(workMode, chapterConfig);
  }

  /**
   * Build a scenario signature for experience matching.
   */
  private buildSignature(
    workMode: WorkMode,
    scenario: string,
    config: ChapterConfig
  ): ScenarioSignature {
    return {
      content_type: config.type || 'general',
      complexity: this.estimateComplexity(scenario, config),
      keywords: this.extractKeywords(scenario),
      work_mode: workMode,
    };
  }

  private estimateComplexity(scenario: string, config: ChapterConfig): 'low' | 'medium' | 'high' {
    const lower = scenario.toLowerCase();
    if (lower.match(/paper|arxiv|math|formula|proof|derivation|reproduce/)) return 'high';
    if (lower.match(/integration|api|protocol|implementation/)) return 'medium';
    if (lower.match(/setup|quickstart|hello|basic|simple/)) return 'low';
    // Default based on content type
    if (config.type === 'academic_paper') return 'high';
    return 'medium';
  }

  private extractKeywords(scenario: string): string[] {
    return scenario
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 10);
  }

  private heuristicRecommend(workMode: WorkMode, config: ChapterConfig): ModeRecommendation {
    let mode: CollaborationMode;
    let reasoning: string;

    switch (workMode) {
      case 'generate':
        mode = 'dual-agent';
        reasoning = 'Generate mode defaults to dual-agent (Author generates, Learner validates)';
        break;
      case 'optimize':
        mode = 'dual-agent';
        reasoning = 'Optimize mode defaults to dual-agent (Author improves, Learner re-validates)';
        break;
      case 'validate':
      default:
        if (config.type === 'academic_paper') {
          mode = 'triple-agent';
          reasoning = 'Academic papers default to triple-agent for math/formula verification';
        } else {
          mode = 'dual-agent';
          reasoning = 'Standard validation defaults to dual-agent (Learner + Author)';
        }
        break;
    }

    return { mode, confidence: 0.5, source: 'heuristic', reasoning };
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd .claude/skills/chapter-content-validator && npx tsc lib/mode-recommender.ts lib/experience-store.ts lib/types.ts --noEmit --strict --moduleResolution node --module es2022 --target es2022 --skipLibCheck`
Expected: No errors.

**Step 3: Commit**

```bash
git add .claude/skills/chapter-content-validator/lib/mode-recommender.ts
git commit -m "feat(validator): add mode recommender with experience/config/heuristic fallback"
```

---

## Phase 5: Execution Engine

### Task 6: Implement Feedback Processor

Handles the 4-level feedback classification and log generation.

**Files:**
- Create: `.claude/skills/chapter-content-validator/lib/feedback-processor.ts`

**Step 1: Write the feedback processor**

```typescript
// .claude/skills/chapter-content-validator/lib/feedback-processor.ts

import type { FeedbackEntry, FeedbackLevel, GapReport, Gap } from './types.js';

export interface IterationRecord {
  iteration: number;
  scenario: string;
  gaps_found: Gap[];
  feedback: FeedbackEntry[];
  outcome: 'success' | 'partial' | 'failed';
}

/**
 * Feedback Processor - classifies and routes feedback by impact level.
 *
 * Level 1: Chapter content files -> apply directly
 * Level 2: Chapter config -> apply directly
 * Level 3: Paradigm document -> record, prompt if significant
 * Level 4: Skill code -> record, prompt if significant
 */
export class FeedbackProcessor {
  private iterations: IterationRecord[] = [];

  /**
   * Process a gap report from a single iteration.
   * Returns classified feedback entries.
   */
  processGapReport(
    iteration: number,
    scenario: string,
    report: GapReport,
    chapterSections: string[]
  ): FeedbackEntry[] {
    const entries: FeedbackEntry[] = [];

    for (const gap of report.gaps) {
      const entry = this.classifyGap(gap, chapterSections);
      entries.push(entry);
    }

    this.iterations.push({
      iteration,
      scenario,
      gaps_found: report.gaps,
      feedback: entries,
      outcome: report.completion,
    });

    return entries;
  }

  /**
   * Classify a single gap into the appropriate feedback level.
   */
  private classifyGap(gap: Gap, chapterSections: string[]): FeedbackEntry {
    const cat = gap.category.toLowerCase();

    // Level 2: config-related gaps
    if (cat.includes('validation_criteria') || cat.includes('config')) {
      return {
        level: 2,
        target: '.chapter-validation/config.yaml',
        description: gap.description,
        category: gap.category,
        applied: false,
        priority: gap.severity === 'critical' ? 'high' : 'medium',
      };
    }

    // Level 3: paradigm-related gaps
    if (cat.includes('new_gap_type') || cat.includes('paradigm') || cat.includes('methodology')) {
      return {
        level: 3,
        target: 'docs/frameworks/chapter-validation-paradigm.md',
        description: gap.description,
        category: gap.category,
        applied: false,
        priority: gap.severity === 'critical' ? 'high' : 'medium',
      };
    }

    // Level 4: skill-related gaps
    if (cat.includes('prompt') || cat.includes('skill_code') || cat.includes('agent_behavior')) {
      return {
        level: 4,
        target: '.claude/skills/chapter-content-validator/',
        description: gap.description,
        category: gap.category,
        applied: false,
        priority: gap.severity === 'critical' ? 'high' : 'medium',
      };
    }

    // Level 1: content gaps (default)
    return {
      level: 1,
      target: gap.location,
      description: gap.description,
      category: gap.category,
      applied: false,
      priority: gap.severity === 'critical' ? 'high' : gap.severity === 'major' ? 'medium' : 'low',
    };
  }

  /**
   * Get all significant (high priority) Level 3-4 suggestions.
   */
  getSignificantSuggestions(): FeedbackEntry[] {
    return this.iterations
      .flatMap(i => i.feedback)
      .filter(f => f.level >= 3 && f.priority === 'high');
  }

  /**
   * Generate a complete validation log as Markdown.
   * Called ONCE at end of process (not incrementally).
   */
  generateLog(): string {
    const lines: string[] = [
      '# Chapter Validation Log',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
    ];

    for (const iter of this.iterations) {
      lines.push(`## Iteration ${iter.iteration}: ${iter.scenario}`);
      lines.push('');
      lines.push(`**Outcome**: ${iter.outcome}`);
      lines.push('');

      if (iter.gaps_found.length > 0) {
        lines.push('### Gaps Found');
        for (const gap of iter.gaps_found) {
          lines.push(`- [${gap.severity}] ${gap.description} (${gap.location})`);
        }
        lines.push('');
      }

      const applied = iter.feedback.filter(f => f.applied);
      if (applied.length > 0) {
        lines.push('### Fixes Applied (Level 1-2)');
        for (const f of applied) {
          lines.push(`- [x] ${f.target}: ${f.description}`);
        }
        lines.push('');
      }

      const recorded = iter.feedback.filter(f => !f.applied && f.level >= 3);
      if (recorded.length > 0) {
        lines.push('### Suggestions Recorded (Level 3-4)');
        for (const f of recorded) {
          lines.push(`- [ ] [L${f.level}] ${f.target}: ${f.description}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Get a summary of all processed feedback.
   */
  getSummary(): string {
    const all = this.iterations.flatMap(i => i.feedback);
    const l1 = all.filter(f => f.level === 1);
    const l2 = all.filter(f => f.level === 2);
    const l3 = all.filter(f => f.level === 3);
    const l4 = all.filter(f => f.level === 4);
    const applied = all.filter(f => f.applied);

    return [
      `Iterations: ${this.iterations.length}`,
      `Total feedback: ${all.length}`,
      `  L1 (content): ${l1.length}, L2 (config): ${l2.length}`,
      `  L3 (paradigm): ${l3.length}, L4 (skill): ${l4.length}`,
      `Applied: ${applied.length}`,
    ].join('\n');
  }

  getIterations(): readonly IterationRecord[] {
    return this.iterations;
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd .claude/skills/chapter-content-validator && npx tsc lib/feedback-processor.ts lib/types.ts --noEmit --strict --moduleResolution node --module es2022 --target es2022 --skipLibCheck`
Expected: No errors.

**Step 3: Commit**

```bash
git add .claude/skills/chapter-content-validator/lib/feedback-processor.ts
git commit -m "feat(validator): add feedback processor with 4-level classification"
```

---

### Task 7: Implement Dependency Resolver

Topological sort for chapter execution order. Used by batch/parallel execution.

**Files:**
- Create: `.claude/skills/chapter-content-validator/lib/dependency-resolver.ts`

**Step 1: Write the dependency resolver**

```typescript
// .claude/skills/chapter-content-validator/lib/dependency-resolver.ts

import type { DependencyGraph } from './types.js';

export interface ExecutionPlan {
  /** Batches of chapters that can be executed in parallel within each batch */
  batches: string[][];
  /** Chapters skipped because dependencies are not met */
  skipped: Array<{ chapter: string; missing: string[] }>;
}

/**
 * Dependency Resolver - topological sort for chapter execution order.
 *
 * Given a dependency graph and a set of already-completed chapters,
 * produces batches of chapters that can be executed in parallel.
 */
export class DependencyResolver {

  /**
   * Resolve execution order for chapters.
   *
   * @param graph - dependency graph from paradigm
   * @param completed - set of already completed chapter paths
   * @param targets - chapters to execute (empty = all)
   * @returns execution plan with parallel batches
   */
  resolve(
    graph: DependencyGraph,
    completed: Set<string>,
    targets: string[] = []
  ): ExecutionPlan {
    // Build adjacency list: chapter -> its dependencies
    const deps = new Map<string, Set<string>>();
    for (const node of graph.nodes) {
      deps.set(node, new Set());
    }
    for (const edge of graph.edges) {
      if (!deps.has(edge.from)) deps.set(edge.from, new Set());
      deps.get(edge.from)!.add(edge.to);
    }

    // Filter to targets if specified
    const candidates = targets.length > 0
      ? targets
      : Array.from(deps.keys());

    // Remove already completed from candidates
    const remaining = candidates.filter(c => !completed.has(c));

    // Kahn's algorithm for topological sort with batching
    const batches: string[][] = [];
    const skipped: Array<{ chapter: string; missing: string[] }> = [];
    const done = new Set(completed);

    let changed = true;
    const pending = new Set(remaining);

    while (changed && pending.size > 0) {
      changed = false;
      const batch: string[] = [];

      for (const chapter of pending) {
        const chapterDeps = deps.get(chapter) || new Set();
        const unmet = Array.from(chapterDeps).filter(d => !done.has(d));

        if (unmet.length === 0) {
          batch.push(chapter);
        }
      }

      if (batch.length > 0) {
        changed = true;
        for (const c of batch) {
          pending.delete(c);
          done.add(c);
        }
        batches.push(batch);
      }
    }

    // Any remaining chapters have unresolvable dependencies
    for (const chapter of pending) {
      const chapterDeps = deps.get(chapter) || new Set();
      const missing = Array.from(chapterDeps).filter(d => !done.has(d));
      skipped.push({ chapter, missing });
    }

    return { batches, skipped };
  }

  /**
   * Check if a single chapter's dependencies are met.
   */
  canExecute(
    chapter: string,
    graph: DependencyGraph,
    completed: Set<string>
  ): { ready: boolean; missing: string[] } {
    const chapterDeps = graph.edges
      .filter(e => e.from === chapter)
      .map(e => e.to);

    const missing = chapterDeps.filter(d => !completed.has(d));
    return { ready: missing.length === 0, missing };
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd .claude/skills/chapter-content-validator && npx tsc lib/dependency-resolver.ts lib/types.ts --noEmit --strict --moduleResolution node --module es2022 --target es2022 --skipLibCheck`
Expected: No errors.

**Step 3: Commit**

```bash
git add .claude/skills/chapter-content-validator/lib/dependency-resolver.ts
git commit -m "feat(validator): add dependency resolver with topological sort and batching"
```

---

### Task 8: Implement Executor (core orchestration)

The main execution engine that coordinates agents based on the recommended collaboration mode.

**Files:**
- Create: `.claude/skills/chapter-content-validator/lib/executor.ts`

**Step 1: Write the executor**

```typescript
// .claude/skills/chapter-content-validator/lib/executor.ts

import { writeFileSync } from 'fs';
import { join } from 'path';
import type {
  ExecutionContext,
  ExecutionResult,
  CollaborationMode,
  GapReport,
  Gap,
  FixResult,
  FeedbackEntry,
  WorkMode,
} from './types.js';
import { FeedbackProcessor } from './feedback-processor.js';

/**
 * Executor - the core orchestration engine.
 *
 * Coordinates agents based on the selected collaboration mode.
 * This is the "inner loop" that runs validate/generate/optimize cycles.
 *
 * IMPORTANT: This class defines the orchestration logic.
 * The actual agent invocations are done via Claude Code's SubAgent/Task API
 * at the skill.md prompt level. This class structures the data flow.
 */
export class Executor {
  private feedbackProcessor: FeedbackProcessor;

  constructor() {
    this.feedbackProcessor = new FeedbackProcessor();
  }

  /**
   * Execute a validation/generation/optimization cycle.
   */
  async execute(ctx: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    const allFeedback: FeedbackEntry[] = [];
    let totalGapsFound = 0;
    let totalGapsResolved = 0;
    const filesModified: string[] = [];
    const filesCreated: string[] = [];
    let success = false;

    for (let iteration = 1; iteration <= ctx.max_iterations; iteration++) {
      // Phase 1: Agent work based on mode
      const report = await this.runAgents(ctx, iteration);
      totalGapsFound += report.gaps.length;

      // Phase 2: Process feedback
      const feedback = this.feedbackProcessor.processGapReport(
        iteration,
        ctx.scenario,
        report,
        ctx.config.sections || []
      );
      allFeedback.push(...feedback);

      // Phase 3: Check completion
      if (report.completion === 'success') {
        success = true;
        break;
      }

      // Phase 4: Apply fixes (Level 1-2)
      const fixes = this.applyFixes(feedback, ctx);
      totalGapsResolved += fixes.applied;
      filesModified.push(...fixes.filesModified);
      filesCreated.push(...fixes.filesCreated);
    }

    // Generate validation log
    const logContent = this.feedbackProcessor.generateLog();
    const logPath = join(ctx.chapter_path, 'validation-log.md');
    writeFileSync(logPath, logContent, 'utf-8');

    return {
      success,
      work_mode: ctx.work_mode,
      collaboration_mode: ctx.collaboration_mode,
      iterations: Math.min(
        this.feedbackProcessor.getIterations().length,
        ctx.max_iterations
      ),
      chapter_path: ctx.chapter_path,
      scenario: ctx.scenario,
      gaps_found: totalGapsFound,
      gaps_resolved: totalGapsResolved,
      files_modified: [...new Set(filesModified)],
      files_created: [...new Set(filesCreated)],
      feedback: allFeedback,
      duration_ms: Date.now() - startTime,
    };
  }

  /**
   * Run agents based on the collaboration mode.
   *
   * NOTE: In the actual Claude Code Skill, these "agent runs" are
   * instructions in skill.md that use SubAgent/Task tool calls.
   * Here we define the data contract each agent must fulfill.
   */
  private async runAgents(ctx: ExecutionContext, iteration: number): Promise<GapReport> {
    switch (ctx.collaboration_mode) {
      case 'single-agent':
        return this.runSingleAgent(ctx, iteration);
      case 'dual-agent':
        return this.runDualAgent(ctx, iteration);
      case 'triple-agent':
        return this.runTripleAgent(ctx, iteration);
      case 'parallel-agents':
        return this.runParallelAgents(ctx, iteration);
      default:
        return this.runDualAgent(ctx, iteration);
    }
  }

  /**
   * Single agent: validator reads and checks content.
   */
  private async runSingleAgent(ctx: ExecutionContext, iteration: number): Promise<GapReport> {
    // Placeholder: actual implementation dispatches via skill.md prompt
    return {
      iteration,
      gaps: [],
      completion: 'success',
      blockers: [],
    };
  }

  /**
   * Dual agent: Learner attempts scenario, Author fixes gaps.
   */
  private async runDualAgent(ctx: ExecutionContext, iteration: number): Promise<GapReport> {
    // Placeholder: actual implementation dispatches via skill.md prompt
    return {
      iteration,
      gaps: [],
      completion: 'success',
      blockers: [],
    };
  }

  /**
   * Triple agent: Learner + Author + Reviewer for academic/math content.
   */
  private async runTripleAgent(ctx: ExecutionContext, iteration: number): Promise<GapReport> {
    // Placeholder: actual implementation dispatches via skill.md prompt
    return {
      iteration,
      gaps: [],
      completion: 'success',
      blockers: [],
    };
  }

  /**
   * Parallel agents: multiple Learners for independent scenarios.
   */
  private async runParallelAgents(ctx: ExecutionContext, iteration: number): Promise<GapReport> {
    // Placeholder: actual implementation dispatches via skill.md prompt
    return {
      iteration,
      gaps: [],
      completion: 'success',
      blockers: [],
    };
  }

  /**
   * Apply Level 1-2 fixes.
   * Returns summary of what was applied.
   */
  private applyFixes(
    feedback: FeedbackEntry[],
    ctx: ExecutionContext
  ): { applied: number; filesModified: string[]; filesCreated: string[] } {
    const level12 = feedback.filter(f => f.level <= 2);
    const filesModified: string[] = [];
    const filesCreated: string[] = [];

    for (const entry of level12) {
      entry.applied = true;
      filesModified.push(entry.target);
    }

    return { applied: level12.length, filesModified, filesCreated };
  }

  getFeedbackProcessor(): FeedbackProcessor {
    return this.feedbackProcessor;
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd .claude/skills/chapter-content-validator && npx tsc lib/executor.ts lib/feedback-processor.ts lib/types.ts --noEmit --strict --moduleResolution node --module es2022 --target es2022 --skipLibCheck`
Expected: No errors.

**Step 3: Commit**

```bash
git add .claude/skills/chapter-content-validator/lib/executor.ts
git commit -m "feat(validator): add executor with mode-aware agent orchestration"
```

---

## Phase 6: Public API + Skill Prompt

### Task 9: Implement public API and index

Wire everything together into the public entry point.

**Files:**
- Create: `.claude/skills/chapter-content-validator/index.ts`
- Create: `.claude/skills/chapter-content-validator/api.ts`

**Step 1: Write index.ts**

```typescript
// .claude/skills/chapter-content-validator/index.ts

/**
 * Chapter Content Validator Skill
 *
 * Experience-driven collaboration engine for validating,
 * generating, and optimizing educational content.
 */

export { runValidator } from './api.js';
export { checkSetup, getSetupMessage } from './lib/setup.js';
export { ExperienceStore } from './lib/experience-store.js';
export { ConfigLoader } from './lib/config-loader.js';
export { ModeRecommender } from './lib/mode-recommender.js';
export { Executor } from './lib/executor.js';
export { FeedbackProcessor } from './lib/feedback-processor.js';
export { DependencyResolver } from './lib/dependency-resolver.js';

export type {
  WorkMode,
  CollaborationMode,
  ExecutionContext,
  ExecutionResult,
  GapReport,
  Gap,
  FeedbackEntry,
  FeedbackLevel,
  ProjectConfig,
  ChapterConfig,
  ParadigmConfig,
  ExperiencePattern,
} from './lib/types.js';
```

**Step 2: Write api.ts**

```typescript
// .claude/skills/chapter-content-validator/api.ts

/**
 * Public API for the Chapter Content Validator Skill.
 *
 * This is the programmatic entry point. The skill.md prompt
 * invokes this logic through Claude Code's skill execution.
 */

import { resolve } from 'path';
import { ExperienceStore } from './lib/experience-store.js';
import { ConfigLoader } from './lib/config-loader.js';
import { ModeRecommender } from './lib/mode-recommender.js';
import { Executor } from './lib/executor.js';
import { DependencyResolver } from './lib/dependency-resolver.js';
import type {
  WorkMode,
  ExecutionContext,
  ExecutionResult,
  CollaborationMode,
} from './lib/types.js';

export interface ValidatorParams {
  /** Chapter path relative to project root (e.g. 'agent/mcp-deep-dive') */
  chapter: string;
  /** Work mode: validate, generate, or optimize */
  mode?: WorkMode;
  /** Scenario description or template name */
  scenario?: string;
  /** Scenario mode: template, freeform, brainstorming */
  scenario_mode?: 'template' | 'freeform' | 'brainstorming';
  /** Override collaboration mode */
  collaboration_mode?: CollaborationMode;
  /** Max iterations (default: from config or 5) */
  max_iterations?: number;
  /** Project root directory */
  project_root?: string;
  /** Run interactive setup to create config */
  setup?: boolean;
}

/**
 * Main entry point: run the chapter content validator.
 */
export async function runValidator(params: ValidatorParams): Promise<ExecutionResult> {
  const projectRoot = resolve(params.project_root || process.cwd());

  // 0. Check setup (unless --setup flag is set, which handles setup itself)
  if (!params.setup) {
    const { checkSetup, getSetupMessage } = await import('./lib/setup.js');
    const setupCheck = checkSetup(projectRoot);
    if (setupCheck.needsSetup) {
      console.log(getSetupMessage(setupCheck));
      // Return early with a "needs setup" result
      return {
        success: false,
        work_mode: 'validate',
        collaboration_mode: 'dual-agent',
        iterations: 0,
        chapter_path: params.chapter,
        scenario: params.scenario || '',
        gaps_found: 0,
        gaps_resolved: 0,
        files_modified: [],
        files_created: [],
        feedback: [{
          level: 3,
          target: '.chapter-validation/config.yaml',
          description: 'Run /chapter-content-validator --setup to configure',
          category: 'setup_required',
          applied: false,
          priority: 'high',
        }],
        duration_ms: 0,
      };
    }
  }

  // 1. Load config
  const configLoader = new ConfigLoader(projectRoot);
  const projectConfig = configLoader.loadProjectConfig();
  const chapterConfig = configLoader.loadChapterConfig(params.chapter);
  const paradigm = configLoader.loadParadigm();

  // 2. Check dependencies
  const depResolver = new DependencyResolver();
  const completed = new Set<string>(); // TODO: detect from file system
  const depCheck = depResolver.canExecute(params.chapter, paradigm.dependencies, completed);
  if (!depCheck.ready) {
    console.warn(
      `Warning: chapter "${params.chapter}" has unmet dependencies: ${depCheck.missing.join(', ')}`
    );
  }

  // 3. Determine collaboration mode
  // Experience store reads from project-level .chapter-validation/experience.yaml
  // Seed patterns from project config bootstrap the store on first run
  const experienceStore = new ExperienceStore(projectRoot, projectConfig.seed_patterns);
  const recommender = new ModeRecommender(experienceStore);
  const workMode = params.mode || 'validate';
  const scenario = params.scenario || 'Complete the chapter exercises';

  let collaborationMode: CollaborationMode;
  if (params.collaboration_mode) {
    collaborationMode = params.collaboration_mode;
  } else {
    const recommendation = recommender.recommend(workMode, scenario, chapterConfig);
    collaborationMode = recommendation.mode;
    console.log(`[Mode] ${recommendation.reasoning} (confidence: ${(recommendation.confidence * 100).toFixed(0)}%)`);
  }

  // 4. Build execution context
  const ctx: ExecutionContext = {
    work_mode: workMode,
    chapter_path: params.chapter,
    scenario,
    scenario_mode: params.scenario_mode || 'freeform',
    collaboration_mode: collaborationMode,
    config: chapterConfig,
    paradigm,
    max_iterations: params.max_iterations || paradigm.quality_standards.max_iterations || 5,
  };

  // 5. Execute
  const executor = new Executor();
  const result = await executor.execute(ctx);

  // 6. Record to experience store
  await experienceStore.record(result);

  // 7. Report significant suggestions
  const significant = executor.getFeedbackProcessor().getSignificantSuggestions();
  if (significant.length > 0) {
    console.log('\n=== Significant Level 3-4 Suggestions ===');
    for (const s of significant) {
      console.log(`  [L${s.level}] ${s.target}: ${s.description}`);
    }
  }

  return result;
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd .claude/skills/chapter-content-validator && npx tsc index.ts api.ts lib/*.ts --noEmit --strict --moduleResolution node --module es2022 --target es2022 --skipLibCheck`
Expected: No errors.

**Step 4: Commit**

```bash
git add .claude/skills/chapter-content-validator/index.ts .claude/skills/chapter-content-validator/api.ts
git commit -m "feat(validator): add public API wiring experience store, config, recommender, executor"
```

---

### Task 10: Rewrite skill.md (the Skill prompt)

The skill.md is what Claude Code actually reads and executes. It must describe the full behavior including all three work modes and dynamic collaboration.

**Files:**
- Modify: `.claude/skills/chapter-content-validator/skill.md`

**Step 1: Write the new skill.md**

Write the file using bash heredoc for UTF-8 safety. The full content is:

```markdown
---
description: "Experience-driven collaboration engine for validating, generating, and optimizing educational content. Supports dynamic agent collaboration modes that evolve from execution history."

parameters:
  chapter:
    description: "Chapter path relative to project root (e.g. agent/mcp-deep-dive, algo/attention/self-attention)"
    type: string
    required: true

  mode:
    description: "Work mode: validate (check existing), generate (create from topic/paper), optimize (improve existing)"
    type: string
    enum: [validate, generate, optimize]
    default: validate

  scenario:
    description: "Scenario description (freeform/brainstorming) or template name (template mode)"
    type: string
    required: false

  scenario_mode:
    description: "How to define the scenario: template (from config), freeform (user describes), brainstorming (interactive refinement)"
    type: string
    enum: [template, freeform, brainstorming]
    default: freeform

  collaboration_mode:
    description: "Override collaboration mode (default: auto-selected from experience)"
    type: string
    enum: [single-agent, dual-agent, triple-agent, parallel-agents]
    required: false

  max_iterations:
    description: "Maximum iteration count (default: 5)"
    type: number
    default: 5
---

# Chapter Content Validator

Experience-driven collaboration engine that validates, generates, and optimizes educational content through dynamic multi-agent collaboration.

## Core Philosophy

> "Let Skill grow smarter with every execution."

This is NOT a static linter. It is an evolving engine that:
1. Learns which collaboration mode works best for which scenario
2. Adapts to project structure via external config (not hardcoded)
3. Supports three work modes: validate, generate, optimize

## Three-Layer Architecture

```
Paradigm (docs/frameworks/chapter-validation-paradigm.md)
  -> defines methodology, dependencies, quality standards
Skill (this file + lib/)
  -> generic engine, experience store, mode selection
Config (.chapter-validation/config.yaml)
  -> project-specific chapter types, sections, overrides
```

## Execution Flow

### Step 1: Load Context

1. Read project config from `.chapter-validation/config.yaml`
2. Read paradigm from `docs/frameworks/chapter-validation-paradigm.md`
3. Load chapter-specific config (merged with defaults)
4. Check chapter dependencies are met

### Step 2: Select Collaboration Mode

Priority order:
1. User override via `--collaboration_mode` parameter
2. Experience store match (if confidence > 60%)
3. Heuristic fallback based on work mode and content type

Report the selection to the user:
```
[Mode] Experience pattern "academic-paper-high" (3 uses, 90% success)
       recommends triple-agent. Confidence: 78%
```

### Step 3: Execute Work Mode

#### Validate Mode
```
Learner reads chapter content -> attempts scenario -> reports gaps
Author analyzes gaps -> fixes content -> Learner retries
Repeat until Learner completes or max_iterations reached
```

#### Generate Mode
```
Author generates initial content from topic/paper description
Learner reads generated content -> attempts scenario -> reports gaps
Author fixes gaps -> Learner retries
Repeat until quality threshold met
```

#### Optimize Mode
```
Learner reads existing content with new requirements -> reports gaps
Author optimizes content addressing new requirements
Learner re-validates -> Repeat if needed
```

### Step 4: Agent Roles

**Learner Agent** (SubAgent with restricted context):
- MUST NOT use external knowledge or internet
- CAN ONLY read files within the chapter directory (and declared prerequisites)
- Reports: completion status, knowledge gaps with exact locations, blockers

**Author Agent** (SubAgent with full context):
- Analyzes Learner's gap report
- Creates/modifies content files to fill gaps
- Reports: files changed, new gap categories discovered

**Reviewer Agent** (triple-agent mode only):
- Verifies mathematical formulas match paper
- Checks code implementations match algorithms
- Cross-references external sources

### Step 5: Feedback Processing

Classify all feedback by impact level:

| Level | Target | Action |
|-------|--------|--------|
| 1 | Chapter content | Apply directly during iteration |
| 2 | Chapter config | Apply directly during iteration |
| 3 | Paradigm doc | Record; prompt user if high priority |
| 4 | Skill code | Record; prompt user if high priority |

### Step 6: Record & Learn

After execution completes:
1. Generate `validation-log.md` in chapter directory (ONCE, not incrementally)
2. Update experience store with execution result
3. Report significant Level 3-4 suggestions to user

## Web Verification (when configured)

When paradigm requires web verification:
1. Build the site: `cd site && npm run build:no-check`
2. Read built HTML to verify rendering
3. Use @frontend-design skill if available for visual verification
4. Isolation: use dedicated port (3001+) to avoid conflicts

## Batch Execution

For multiple chapters:
1. Parse dependency graph from paradigm
2. Topological sort to determine execution order
3. Execute independent chapters in parallel batches
4. Use @superpowers:dispatching-parallel-agents for parallelism

## Related Documentation

- Design philosophy: `docs/frameworks/chapter-validator-design.md`
- Project paradigm: `docs/frameworks/chapter-validation-paradigm.md`
- Project config: `.chapter-validation/config.yaml`
```

**Step 2: Verify the file has no encoding issues**

Run: `python3 scripts/check-utf8.py .claude/skills/chapter-content-validator/skill.md`
Expected: No errors.

**Step 3: Commit**

```bash
git add .claude/skills/chapter-content-validator/skill.md
git commit -m "feat(validator): rewrite skill.md with three work modes and experience-driven collaboration"
```

---

## Phase 7: Project Config + Paradigm Update

### Task 11: Create centralized project config

**Files:**
- Create: `.chapter-validation/config.yaml`

**Step 1: Write the config**

```yaml
# Chapter Content Validator - Project Configuration
#
# Centralized config for all chapters.
# Skill reads this to understand project structure.
# All fields are optional - Skill provides defaults.

version: "1.0"

defaults:
  max_iterations: 5
  collaboration_mode: dual-agent
  sections: [concepts/, experiments/]

# Seed patterns for the experience store.
# These bootstrap the experience engine on first run.
# As the Skill executes, runtime data accumulates in experience.yaml alongside this file.
seed_patterns:
  - id: technical-guide-low
    signature:
      content_type: technical_guide
      complexity: low
      keywords: [guide, tutorial, setup, quickstart]
      work_mode: validate
    recommended_mode: single-agent

  - id: technical-guide-medium
    signature:
      content_type: technical_guide
      complexity: medium
      keywords: [integration, api, protocol, implementation]
      work_mode: validate
    recommended_mode: dual-agent

  - id: academic-paper-high
    signature:
      content_type: academic_paper
      complexity: high
      keywords: [paper, math, formula, proof, derivation]
      work_mode: validate
    recommended_mode: triple-agent

  - id: generate-from-paper
    signature:
      content_type: academic_paper
      complexity: high
      keywords: [generate, paper, tutorial, create]
      work_mode: generate
    recommended_mode: dual-agent

  - id: optimize-existing
    signature:
      content_type: any
      complexity: medium
      keywords: [optimize, improve, update, refactor]
      work_mode: optimize
    recommended_mode: dual-agent

chapters:
  # --- Agent chapters ---
  agent/mcp-deep-dive:
    type: technical_guide
    sections: [concepts/, experiments/]
    scenarios:
      basic-tool:
        type: tool
        description: "Build a basic MCP Server with stdio transport"
        requirements: ["Server starts", "Responds to tools/list"]
      api-integration:
        type: integration
        description: "Integrate MCP Server with external API"
        requirements: ["Authenticates", "Handles errors"]

  agent/skills:
    type: technical_guide
    sections: [platform-comparison/, experiments/]

  agent/agent-workflows:
    type: technical_guide
    sections: [framework-survey/, experiments/]

  agent/lsp-enhancement:
    type: technical_guide
    sections: [protocol-analysis/, prototypes/]

  # --- Algo chapters ---
  algo/foundations/gradient-descent:
    type: technical_guide
    sections: [concepts/, implementation/]

  algo/foundations/backpropagation:
    type: technical_guide
    sections: [concepts/, implementation/]
    prerequisites: [algo/foundations/gradient-descent]

  algo/attention/self-attention:
    type: academic_paper
    sections: [paper-summary/, implementation/, experiments/]
    prerequisites: [algo/foundations/backpropagation]
    scenarios:
      reproduction:
        type: paper
        description: "Reproduce self-attention mechanism"
        verify: "Implementation matches paper formulas"

  algo/attention/attention-is-all-you-need:
    type: academic_paper
    sections: [paper-summary/, implementation/, experiments/]
    prerequisites: [algo/attention/self-attention]
    collaboration_mode: triple-agent
```

**Step 2: Commit**

```bash
git add .chapter-validation/config.yaml
git commit -m "feat: add centralized chapter validation config"
```

---

### Task 12: Update paradigm document

Rewrite the paradigm to match the new three-layer design. It should define methodology and dependencies, NOT implementation details.

**Files:**
- Modify: `docs/frameworks/chapter-validation-paradigm.md`

**Step 1: Rewrite the paradigm**

Write via bash heredoc. Content defines:
- What chapter validation is and why it matters
- Dependency graph for algo chapters
- Quality standards
- Web verification isolation conventions
- NO implementation details (those belong in Skill)

**Step 2: Verify encoding**

Run: `python3 scripts/check-utf8.py docs/frameworks/chapter-validation-paradigm.md`
Expected: No errors.

**Step 3: Commit**

```bash
git add docs/frameworks/chapter-validation-paradigm.md
git commit -m "docs: rewrite paradigm for three-layer architecture (methodology only, no implementation)"
```

---

## Phase 8: Template + Cleanup

### Task 13: Create config template and clean up old files

**Files:**
- Create: `.claude/skills/chapter-content-validator/templates/config-template.yaml`
- Delete: `agent/mcp-deep-dive/.chapter-validator.yaml` (if exists, migrated to centralized config)

**Step 1: Write config template**

```yaml
# Chapter Content Validator - Project Configuration Template
#
# Copy this file to: <project-root>/.chapter-validation/config.yaml
# All fields are optional. Skill provides sensible defaults.

version: "1.0"

defaults:
  max_iterations: 5
  collaboration_mode: dual-agent     # single-agent | dual-agent | triple-agent | parallel-agents
  sections: [concepts/, experiments/]

chapters:
  # Example: technical guide chapter
  # path/to/chapter:
  #   type: technical_guide
  #   sections: [concepts/, experiments/]
  #   scenarios:
  #     basic:
  #       type: tool
  #       description: "Build a basic tool"
  #       requirements: ["Tool runs", "Output correct"]

  # Example: academic paper chapter
  # algo/attention/self-attention:
  #   type: academic_paper
  #   sections: [paper-summary/, implementation/, experiments/]
  #   prerequisites: [algo/foundations/backpropagation]
  #   collaboration_mode: triple-agent
  #   scenarios:
  #     reproduction:
  #       type: paper
  #       description: "Reproduce paper experiments"
  #       verify: "Results match paper within 5%"
```

**Step 2: Remove old per-chapter config files**

Run: `find . -name '.chapter-validator.yaml' -delete 2>/dev/null; echo "done"`

**Step 3: Commit**

```bash
git add .claude/skills/chapter-content-validator/templates/config-template.yaml
git add -A agent/ algo/
git commit -m "chore: add config template, remove legacy per-chapter .chapter-validator.yaml files"
```

---

### Task 14: Fix design document encoding issue

**Files:**
- Modify: `docs/frameworks/chapter-validator-design.md`

**Step 1: Fix the corrupted character on line 17**

The text `内容堆` should be `内容堆砌` (line 17 of chapter-validator-design.md).

**Step 2: Commit**

```bash
git add docs/frameworks/chapter-validator-design.md
git commit -m "fix: correct corrupted character in design document"
```

---

## Phase 9: Verification

### Task 15: Full verification pass

**Step 1: Verify all TypeScript files compile**

Run: `cd .claude/skills/chapter-content-validator && npx tsc index.ts api.ts lib/*.ts --noEmit --strict --moduleResolution node --module es2022 --target es2022 --skipLibCheck`
Expected: No errors.

**Step 2: Verify no encoding issues**

Run: `python3 scripts/check-utf8.py .claude/skills/chapter-content-validator/skill.md docs/frameworks/chapter-validator-design.md docs/frameworks/chapter-validation-paradigm.md .chapter-validation/config.yaml`
Expected: All files pass.

**Step 3: Verify file structure**

Run: `find .claude/skills/chapter-content-validator -type f -not -path '*/node_modules/*' | sort`

Expected:
```
.claude/skills/chapter-content-validator/api.ts
.claude/skills/chapter-content-validator/index.ts
.claude/skills/chapter-content-validator/lib/config-loader.ts
.claude/skills/chapter-content-validator/lib/dependency-resolver.ts
.claude/skills/chapter-content-validator/lib/executor.ts
.claude/skills/chapter-content-validator/lib/experience-store.ts
.claude/skills/chapter-content-validator/lib/feedback-processor.ts
.claude/skills/chapter-content-validator/lib/mode-recommender.ts
.claude/skills/chapter-content-validator/lib/types.ts
.claude/skills/chapter-content-validator/skill.md
.claude/skills/chapter-content-validator/templates/config-template.yaml
```

**Step 4: Verify no old files remain**

Run: `ls .claude/skills/chapter-content-validator/lib/learner.ts .claude/skills/chapter-content-validator/lib/author.ts .claude/skills/chapter-content-validator/lib/coordinator.ts .claude/skills/chapter-content-validator/lib/validator.py .claude/skills/chapter-content-validator/lib/validator.sh 2>&1`
Expected: All "No such file or directory".

**Step 5: Final commit**

```bash
git add -A
git status
git commit -m "feat: complete chapter-content-validator rewrite as experience-driven collaboration engine"
```

---

## Summary of Deliverables

| File | Purpose |
|------|---------|
| `lib/types.ts` | All TypeScript interfaces and types |
| `lib/experience-store.ts` | Pattern matching + YAML persistence |
| `lib/config-loader.ts` | Three-layer config merge |
| `lib/mode-recommender.ts` | Experience/config/heuristic mode selection |
| `lib/feedback-processor.ts` | 4-level feedback classification |
| `lib/dependency-resolver.ts` | Topological sort for chapter ordering |
| `lib/executor.ts` | Core orchestration engine |
| `api.ts` | Public programmatic API |
| `index.ts` | Module exports |
| `skill.md` | Claude Code skill prompt (the "brain") |
| `.chapter-validation/config.yaml:seed_patterns` | Seed experience patterns (project-level) |
| `.chapter-validation/experience.yaml` | Runtime experience data (auto-generated, grows over time) |
| `templates/config-template.yaml` | Config template for new projects |
| `.chapter-validation/config.yaml` | This project's chapter config |
| `docs/frameworks/chapter-validation-paradigm.md` | Updated paradigm (methodology only) |
| `docs/frameworks/chapter-validator-design.md` | Fixed encoding |
