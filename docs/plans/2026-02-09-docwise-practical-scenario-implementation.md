# Docwise Practical Scenario System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal**: Transform Docwise from "document review tool" to "practical validation system" where Learner agents execute real tasks based on documentation.

**Architecture**:
- Add scenario generation pipeline (WebSearch -> scenario extraction -> user confirmation)
- Extend config system with language detection and sandbox environment setup
- Enhance subcommand skills with overview display and scenario confirmation steps
- Add sandbox directory management with language-specific isolation

**Tech Stack**: TypeScript, Node.js, WebSearch skill, Bash commands

---

## Phase 1: Core Type Extensions

### Task 1: Extend types with scenario-related interfaces

**Files:**
- Modify: `.claude/skills/docwise/lib/types.ts`

**Step 1: Add new type definitions**

```typescript
// Add to existing types.ts

// --- Scenario Generation ---

export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  complexity: 'simple' | 'medium' | 'complex';
  topics: string[];              // Core topics to validate
  goals: string[];                // Learning objectives
  workflow: string[];             // Step-by-step execution plan
  verification_commands?: string[]; // Commands to validate success
}

export interface ChapterOverview {
  what_is: string;               // "What is this technology?"
  what_for: string[];            // Use cases (2-4 items)
  status: 'draft' | 'in-progress' | 'published' | 'completed';
}

export interface SandboxConfig {
  id: string;                     // e.g., "001-exec-validate-progress"
  path: string;                  // Absolute path to sandbox
  language: 'python' | 'node' | 'rust' | 'go' | 'java' | 'cpp' | 'none';
  isolation: IsolationType;
}

export type IsolationType =
  | 'python-venv'
  | 'python-uv'
  | 'node-local'
  | 'cargo'
  | 'go-mod'
  | 'maven'
  | 'gradle'
  | 'none';

export interface LearnerArtifact {
  readme_path: string;
  learning_log_path: string;
  code_path?: string;
  validation_path: string;
  scenario_id: string;
  timestamp: string;
}

export interface GapPriority {
  category: 'critical' | 'important' | 'minor';
  rule: string;
}
```

**Step 2: Run TypeScript check**

```bash
cd .claude/skills/docwise/lib
npx tsc --noEmit types.ts
```

Expected: No type errors

**Step 3: Commit**

```bash
git add .claude/skills/docwise/lib/types.ts
git commit -m "feat: add scenario generation types to docwise"
```

---

## Phase 2: Config Loader Enhancements

### Task 2: Add language detection and scenario loading

**Files:**
- Modify: `.claude/skills/docwise/lib/config-loader.ts`
- Create: `.claude/skills/docwise/lib/scenario-loader.ts`

**Step 1: Add language detection to ConfigLoader**

```typescript
// Add to config-loader.ts

export class ConfigLoader {
  // ... existing code ...

  /**
   * Detect primary language for a chapter
   */
  detectChapterLanguage(chapterPath: string): 'python' | 'node' | 'rust' | 'go' | 'java' | 'cpp' | 'none' {
    // Check config.yaml for explicit language declaration
    const config = this.loadChapterConfig(chapterPath);
    if ((config as any).language) {
      return (config as any).language;
    }

    // Auto-detect from directory structure
    const fullPath = join(this.projectRoot, chapterPath);

    // Check for package.json (Node.js)
    if (existsSync(join(fullPath, 'package.json'))) {
      return 'node';
    }

    // Check for pyproject.toml, setup.py, requirements.txt (Python)
    if (existsSync(join(fullPath, 'pyproject.toml')) ||
        existsSync(join(fullPath, 'setup.py')) ||
        existsSync(join(fullPath, 'requirements.txt'))) {
      return 'python';
    }

    // Check for Cargo.toml (Rust)
    if (existsSync(join(fullPath, 'Cargo.toml'))) {
      return 'rust';
    }

    // Check for go.mod (Go)
    if (existsSync(join(fullPath, 'go.mod'))) {
      return 'go';
    }

    // Check for pom.xml or build.gradle (Java)
    if (existsSync(join(fullPath, 'pom.xml')) ||
        existsSync(join(fullPath, 'build.gradle'))) {
      return 'java';
    }

    // Check for CMakeLists.txt or Makefile (C++)
    if (existsSync(join(fullPath, 'CMakeLists.txt')) ||
        existsSync(join(fullPath, 'Makefile'))) {
      return 'cpp';
    }

    return 'none';
  }

  /**
   * Get sandbox isolation type for a language
   */
  getSandboxIsolationType(language: string): IsolationType {
    const isolationMap: Record<string, IsolationType> = {
      'python': 'python-uv',
      'node': 'node-local',
      'rust': 'cargo',
      'go': 'go-mod',
      'java': 'maven',
      'cpp': 'none',
      'none': 'none'
    };
    return isolationMap[language] || 'none';
  }

  /**
   * Load chapter overview from README.md
   */
  loadChapterOverview(chapterPath: string): ChapterOverview | null {
    const readmePath = join(this.projectRoot, chapterPath, 'README.md');

    if (!existsSync(readmePath)) {
      return null;
    }

    const content = readFileSync(readmePath, 'utf-8');
    const frontmatter = this.extractFrontmatter(content);

    // Extract status from frontmatter
    const status = frontmatter.status || 'draft';

    // Extract overview from first few sections
    const whatIs = this.extractWhatIs(content);
    const whatFor = this.extractWhatFor(content);

    return {
      what_is: whatIs,
      what_for: whatFor,
      status: status
    };
  }

  private extractFrontmatter(content: string): Record<string, any> {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/m;
    const match = content.match(frontmatterRegex);

    if (!match) return {};

    const lines = match[1].split('\n');
    const result: Record<string, any> = {};

    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        // Handle various YAML formats
        if (value.startsWith('[') && value.endsWith(']')) {
          result[key.trim()] = value.slice(1, -1).split(',').map((v: string) => v.trim());
        } else {
          result[key.trim()] = value;
        }
      }
    }

    return result;
  }

  private extractWhatIs(content: string): string {
    // Look for first heading or paragraph that describes the technology
    const lines = content.split('\n');
    let inContent = false;

    for (const line of lines) {
      if (line.startsWith('---')) {
        if (inContent) break;
        inContent = true;
        continue;
      }

      if (inContent && line.trim() && !line.startsWith('#')) {
        return line.trim();
      }

      if (line.startsWith('# ')) {
        return line.slice(2).trim();
      }
    }

    return 'Unknown topic';
  }

  private extractWhatFor(content: string): string[] {
    const useCases: string[] = [];
    const useCasePatterns = [
      /(?:用于|用途|应用|Used for|Use case)[:：]\s*([^\n]+)/i,
      /(?:场景|scenario)[:：]\s*([^\n]+)/i,
    ];

    for (const pattern of useCasePatterns) {
      const matches = content.matchAll(new RegExp(pattern, 'gi'));
      for (const match of matches) {
        if (match[1]) {
          const useCase = match[1].trim();
          if (useCase && !useCases.includes(useCase)) {
            useCases.push(useCase);
          }
        }
      }
    }

    // Fallback: look for bullet lists near the beginning
    if (useCases.length === 0) {
      const lines = content.split('\n');
      let inList = false;

      for (let i = 0; i < Math.min(50, lines.length); i++) {
        const line = lines[i].trim();

        if (line.startsWith('- ') || line.startsWith('* ')) {
          inList = true;
          useCases.push(line.slice(1).trim());
        } else if (inList && line === '') {
          break;
        }
      }
    }

    return useCases.slice(0, 4); // Max 4 use cases
  }

  /**
   * Check if chapter status is 'completed' and should warn user
   */
  requiresCompletedWarning(chapterPath: string): boolean {
    const overview = this.loadChapterOverview(chapterPath);
    return overview?.status === 'completed';
  }
}
```

**Step 2: Create scenario loader module**

```typescript
// .claude/skills/docwise/lib/scenario-loader.ts

import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { ConfigLoader } from './config-loader.js';
import type { ScenarioConfig, ChapterOverview } from './types.js';

export class ScenarioLoader {
  private config: ConfigLoader;

  constructor(projectRoot: string) {
    this.config = new ConfigLoader(projectRoot);
  }

  /**
   * Generate scenario based on chapter type, complexity, and search results
   */
  async generateScenario(
    chapterPath: string,
    complexity: 'simple' | 'medium' | 'complex',
    userScenario?: string,
    subcommand: 'new' | 'check' | 'improve' = 'check'
  ): Promise<ScenarioConfig> {
    const chapterType = this.inferChapterType(chapterPath);
    const overview = this.config.loadChapterOverview(chapterPath);

    // For :new, generate scenario from search only
    if (subcommand === 'new') {
      return this.generateScenarioFromSearch(chapterPath, complexity, userScenario);
    }

    // For :improve, combine existing doc with search
    if (subcommand === 'improve') {
      return this.generateScenarioFromDocAndSearch(chapterPath, complexity, userScenario);
    }

    // For :check, generate from search for coverage comparison
    return this.generateScenarioFromSearch(chapterPath, complexity, userScenario);
  }

  private inferChapterType(chapterPath: string): 'agent' | 'algo' {
    if (chapterPath.startsWith('agent/')) return 'agent';
    if (chapterPath.startsWith('algo/')) return 'algo';
    return 'agent'; // default
  }

  private async generateScenarioFromSearch(
    chapterPath: string,
    complexity: 'simple' | 'medium' | 'complex',
    userScenario?: string
  ): Promise<ScenarioConfig> {
    // WebSearch for practical examples
    const topicName = this.extractTopicName(chapterPath);
    const searchQuery = userScenario
      ? `${topicName} ${userScenario} implementation example`
      : `${topicName} tutorial examples best practices`;

    // This would use WebSearch skill - for now return template
    return this.createScenarioTemplate(chapterPath, complexity, userScenario);
  }

  private async generateScenarioFromDocAndSearch(
    chapterPath: string,
    complexity: 'simple' | 'medium' | 'complex',
    userScenario?: string
  ): Promise<ScenarioConfig> {
    // Read existing doc to identify gaps
    const existingDoc = await this.readExistingDoc(chapterPath);

    // Focus on gaps + search for best practices
    return this.createScenarioTemplate(chapterPath, complexity, userScenario);
  }

  private extractTopicName(chapterPath: string): string {
    // Extract topic name from path
    const parts = chapterPath.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.replace(/-/g, ' ');
  }

  private createScenarioTemplate(
    chapterPath: string,
    complexity: 'simple' | 'medium' | 'complex',
    userScenario?: string
  ): ScenarioConfig {
    const id = Date.now().toString();
    const name = userScenario || `${chapterPath} validation`;

    return {
      id,
      name,
      description: `Practical validation scenario for ${chapterPath}`,
      complexity,
      topics: this.generateTopicsForComplexity(chapterPath, complexity),
      goals: this.generateGoalsForComplexity(complexity),
      workflow: ['Read documentation', 'Follow steps', 'Verify outcome'],
    };
  }

  private generateTopicsForComplexity(
    chapterPath: string,
    complexity: 'simple' | 'medium' | 'complex'
  ): string[] {
    const topicName = this.extractTopicName(chapterPath);

    const topicsByComplexity: Record<string, string[]> = {
      simple: ['Basic concepts', 'Core functionality'],
      medium: ['Core functionality', 'Common patterns', 'Best practices'],
      complex: ['Core functionality', 'Advanced patterns', 'Edge cases', 'Performance optimization']
    };

    return topicsByComplexity[complexity] || topicsByComplexity.medium;
  }

  private generateGoalsForComplexity(complexity: 'simple' | 'medium' | 'complex'): string[] {
    const goalsByComplexity: Record<string, string[]> = {
      simple: ['Understand basic concepts', 'Complete simple task'],
      medium: ['Understand core functionality', 'Implement common patterns', 'Follow best practices'],
      complex: ['Master advanced features', 'Handle edge cases', 'Optimize performance']
    };

    return goalsByComplexity[complexity] || goalsByComplexity.medium;
  }

  private async readExistingDoc(chapterPath: string): Promise<string> {
    const readmePath = join(this.config['projectRoot'], chapterPath, 'README.md');
    // Implementation would read and analyze existing doc
    return '';
  }
}
```

**Step 3: Run TypeScript check**

```bash
cd .claude/skills/docwise/lib
npx tsc --noEmit *.ts
```

Expected: No type errors

**Step 4: Commit**

```bash
git add .claude/skills/docwise/lib/
git commit -m "feat: add scenario loader and language detection to config system"
```

---

## Phase 3: Sandbox Management

### Task 3: Create sandbox manager

**Files:**
- Create: `.claude/skills/docwise/lib/sandbox-manager.ts`

**Step 1: Write sandbox manager**

```typescript
// .claude/skills/docwise/lib/sandbox-manager.ts

import { mkdir, writeFile, chmod } from 'fs/promises';
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
      await execAsync('uv', ['venv', '.venv'], { cwd: sandboxPath });
    } catch {
      await execAsync('python3', ['-m', 'venv', '.venv'], { cwd: sandboxPath });
    }
  }

  private async setupNodeSandbox(sandboxPath: string): Promise<void> {
    // Create package.json if not exists
    const packageJsonPath = join(sandboxPath, 'package.json');

    try {
      await execAsync('npm', ['init', '-y'], { cwd: sandboxPath });
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
}
```

**Step 2: Update types to export new classes**

```typescript
// Add to types.ts
export { ScenarioLoader } from './scenario-loader.js';
export { SandboxManager } from './sandbox-manager.js';
```

**Step 3: Run TypeScript check**

```bash
cd .claude/skills/docwise/lib
npx tsc --noEmit *.ts
```

Expected: No type errors

**Step 4: Commit**

```bash
git add .claude/skills/docwise/lib/sandbox-manager.ts
git add .claude/skills/docwise/lib/types.ts
git commit -m "feat: add sandbox manager with language isolation"
```

---

## Phase 4: Overview Display

### Task 4: Add overview display utility

**Files:**
- Create: `.claude/skills/docwise/lib/overview-display.ts`

**Step 1: Write overview display module**

```typescript
// .claude/skills/docwise/lib/overview-display.ts

import { ConfigLoader } from './config-loader.js';

export class OverviewDisplay {
  private config: ConfigLoader;

  constructor(projectRoot: string) {
    this.config = new ConfigLoader(projectRoot);
  }

  /**
   * Generate overview for display
   * For :new: use WebSearch
   * For :check/:improve: use existing doc
   */
  async generateOverview(
    chapterPath: string,
    subcommand: 'new' | 'check' | 'improve'
  ): Promise<{ what_is: string; what_for: string[] }> {
    const overview = this.config.loadChapterOverview(chapterPath);

    if (subcommand === 'new') {
      // Would use WebSearch here
      return {
        what_is: await this.searchWhatIs(chapterPath),
        what_for: await this.searchWhatFor(chapterPath)
      };
    }

    // Use existing doc
    return {
      what_is: overview?.what_is || 'Unknown topic',
      what_for: overview?.what_for || []
    };
  }

  private async searchWhatIs(chapterPath: string): Promise<string> {
    // Placeholder for WebSearch integration
    // In real implementation, would use WebSearch skill
    return `${this.extractTopicName(chapterPath)} - Topic description from web search`;
  }

  private async searchWhatFor(chapterPath: string): Promise<string[]> {
    // Placeholder for WebSearch integration
    return ['Use case 1', 'Use case 2', 'Use case 3'];
  }

  private extractTopicName(chapterPath: string): string {
    const parts = chapterPath.split('/');
    return parts[parts.length - 1].replace(/-/g, ' ');
  }

  /**
   * Format overview for display
   */
  formatForDisplay(overview: { what_is: string; what_for: string[] }): string {
    return `
📋 技术概览
─────────────────────────────────
【是什么】
${overview.what_is}

【有什么用】
${overview.what_for.map((use, i) => `${i + 1}. ${use}`).join('\n')}
`;
  }

  /**
   * Format completed warning
   */
  formatCompletedWarning(): string {
    return `
⚠️  该文档状态为 "completed"（里程碑冻结）
   执行 improve/check 将会更改文档状态和内容

   确认继续? [Y/n]
`;
  }
}
```

**Step 2: Run TypeScript check**

```bash
cd .claude/skills/docwise/lib
npx tsc --noEmit overview-display.ts
```

Expected: No type errors

**Step 3: Commit**

```bash
git add .claude/skills/docwise/lib/overview-display.ts
git commit -m "feat: add overview display utility with completed warning"
```

---

## Phase 5: Update docwise:check Skill

### Task 5: Update docwise-check skill with new flow

**Files:**
- Modify: `.claude/skills/docwise-check/skill.md`

**Step 1: Update docwise-check execution flow**

Replace the existing execution flow section with:

```markdown
## Execution Flow

```
1. PARSE INPUT
   - Extract: chapter, focus (links/logic/content/all)
   - Detect: complexity

2. SHOW OVERVIEW (NEW)
   - Check document status
   - Display: 【是什么】【有什么用】
   - If status=completed: show warning, require confirmation

3. GENERATE SCENARIO (NEW)
   - Analyze chapter type (Agent/Algo)
   - WebSearch for practical examples
   - Generate scenario + core topics
   - Show scenario confirmation dialog

4. CONFIRM SCENARIO (NEW)
   - User can accept or adjust scenario/topics
   - Generate sandbox directory name based on scenario

5. SETUP SANDBOX (NEW)
   - Detect chapter language
   - Create sandbox directory
   - Setup language isolation (.venv, node_modules, etc.)

6. EXECUTE WITH TASK TOOL (ITERATIVE LOOP)
   Loop (max_iterations from config, default 5):

   a) Spawn Learner Agent (subagent_type=general-purpose)
      * Reads chapter content (zero-knowledge)
      * Creates sandbox workspace if needed
      * Executes practical task (not just checks!)
      * Reports: completion status, issues, findings

   b) Check Learner's completion status
      * If COMPLETE: Generate artifacts (README, learning-log)
      * If issues found: Continue

   c) Spawn Author Agent (if --fix is true and issues not critical)
      * Prioritize: critical > important > minor
      * Show change summary for confirmation
      * Fixes reported issues
      * Reports: files changed

   d) Increment iteration counter, loop back to (a)

7. (triple-agent only) Spawn Reviewer Agent
   * Verifies technical accuracy of fixes
   * If issues found: spawn Author to fix, then Learner to re-validate
```
```

**Step 2: Add scenario confirmation output format**

Add to the skill.md:

```markdown
## Scenario Confirmation Output

When scenario is generated, display:

```
🎯 实操场景确认
─────────────────────────────────
章节: [chapter name]

【场景描述 - 你要做什么】
[detailed scenario description for beginners]

【核心议题 - 重点学习什么】
1. [Topic one]: [description]
2. [Topic two]: [description]

【协作方式 - Agent 如何帮你】
  Learner Agent: Execute task according to documentation
  Author Agent: Fix issues found by Learner (if --fix)
  Reviewer Agent: Verify technical accuracy (triple-agent mode)

【你将获得 - 学习成果】
  ✓ Validation report showing what works/doesn't
  ✓ Learning notes documenting gaps and difficulties
  ✓ Working code reference (if applicable)

【执行说明 - 代码放哪里】
  Sandbox: .docwise/sandbox/[id]-[description]/
  Language isolation: [type] (.venv, node_modules, etc.)
  Directory won't be overwritten

─────────────────────────────────
这个场景 OK 吗？[Y/n/修改场景/调整议题]
```
```

**Step 3: Commit**

```bash
git add .claude/skills/docwise-check/skill.md
git commit -m "feat: update docwise-check with scenario generation and sandbox support"
```

---

## Phase 6: Update docwise:improve Skill

### Task 6: Update docwise-improve skill

**Files:**
- Modify: `.claude/skills/docwise-improve/skill.md`

**Step 1: Update execution flow**

Update the execution flow section similarly to docwise-check, but with focus on gaps:

```markdown
## Execution Flow

```
1. PARSE INPUT
   - Extract: chapter, requirements description
   - Detect: complexity

2. SHOW OVERVIEW WITH CURRENT STATUS (NEW)
   - Check document status
   - Display: 【是什么】【有什么用】
   - Display: 【当前概况】已覆盖/缺口
   - If status=completed: show warning, require confirmation

3. GENERATE SCENARIO FOCUSED ON GAPS (NEW)
   - Analyze current coverage from doc summary
   - WebSearch for best practices on missing topics
   - Generate scenario targeting identified gaps
   - Show scenario confirmation dialog

4. CONFIRM SCENARIO (NEW)
   - User can accept or adjust scenario/focus areas

5. SETUP SANDBOX (NEW)
   - Detect chapter language
   - Create sandbox directory
   - Setup language isolation

6. EXECUTE WITH TASK TOOL (ITERATIVE LOOP)
   [similar to docwise-check]
```
```

**Step 2: Commit**

```bash
git add .claude/skills/docwise-improve/skill.md
git commit -m "feat: update docwise-improve with gap-focused scenario generation"
```

---

## Phase 7: Update docwise:new Skill

### Task 7: Update docwise-new skill

**Files:**
- Modify: `.claude/skills/docwise-new/skill.md`

**Step 1: Update execution flow**

```markdown
## Execution Flow

```
1. PARSE INPUT
   - Extract scenario description from <args>
   - Detect: complexity, content_type

2. SHOW OVERVIEW FROM WEBSEARCH (NEW)
   - WebSearch: What is this technology?
   - WebSearch: What are the use cases?
   - Display: 【是什么】【有什么用】

3. GENERATE SCENARIO FROM SEARCH (NEW)
   - Analyze chapter type (Agent/Algo)
   - WebSearch for practical examples
   - Extract core topics from search results
   - Generate scenario + topics
   - Show scenario confirmation dialog

4. CONFIRM SCENARIO (NEW)
   - User can adjust scenario/topics

5. SETUP SANDBOX (NEW)
   - Detect chapter language (or ask user)
   - Create sandbox directory
   - Setup language isolation

6. EXECUTE WITH TASK TOOL
   [Author creates content -> Learner validates -> ...]
```

**Step 2: Commit**

```bash
git add .claude/skills/docwise-new/skill.md
git commit -m "feat: update docwise-new with websearch-based scenario generation"
```

---

## Phase 8: Gap Priority Filtering

### Task 8: Add gap priority system

**Files:**
- Create: `.claude/skills/docwise/lib/gap-prioritizer.ts`

**Step 1: Write gap prioritizer**

```typescript
// .claude/skills/docwise/lib/gap-prioritizer.ts

import type { Gap, GapPriority } from './types.js';

export class GapPrioritizer {
  /**
   * Filter gaps by priority
   * Returns only gaps that should be fixed based on mode
   */
  filterGapsByPriority(
    gaps: Gap[],
    mode: 'all' | 'critical-only' | 'critical-important'
  ): Gap[] {
    if (mode === 'all') {
      return gaps;
    }

    const priorityThresholds = {
      'critical-only': ['critical'],
      'critical-important': ['critical', 'important']
    };

    const allowedPriorities = priorityThresholds[mode] || [];

    return gaps.filter(gap =>
      allowedPriorities.includes(this.getGapPriority(gap))
    );
  }

  /**
   * Get priority category for a gap
   */
  getGapPriority(gap: Gap): 'critical' | 'important' | 'minor' {
    // If gap already has severity, map it to priority
    if (gap.severity === 'critical') return 'critical';
    if (gap.severity === 'major') return 'important';
    return 'minor';
  }

  /**
   * Categorize gap by category
   */
  getGapPriority(category: string): 'critical' | 'important' | 'minor' {
    const criticalCategories = [
      'concept_missing_critical',
      'step_unclear_blocking',
      'code_error_critical'
    ];

    const importantCategories = [
      'concept_missing',
      'step_unclear',
      'code_error',
      'context_missing'
    ];

    const minorCategories = [
      'detail_missing',
      'example_insufficient',
      'formatting_issue',
      'typo'
    ];

    if (criticalCategories.includes(category)) return 'critical';
    if (importantCategories.includes(category)) return 'important';
    return 'minor';
  }

  /**
   * Generate change summary for confirmation
   */
  generateChangeSummary(
    gaps: Gap[],
    filesToChange: Record<string, number>
  ): string {
    const lines = [
      '预计变更:',
      ''
    ];

    for (const [file, deltaLines] of Object.entries(filesToChange)) {
      const prefix = deltaLines >= 0 ? '+' : '';
      lines.push(`  ✏️  ${file}: ${prefix}${deltaLines}`);
    }

    lines.push('');
    lines.push(`总计: ${Object.values(filesToChange).reduce((sum, n) => sum + n, 0)} 行`);
    lines.push('');
    lines.push('确认执行? [Y/n/只修复 critical]');

    return lines.join('\n');
  }
}
```

**Step 2: Update types to export**

```typescript
export { GapPrioritizer } from './gap-prioritizer.js';
```

**Step 3: Run TypeScript check**

```bash
cd .claude/skills/docwise/lib
npx tsc --noEmit *.ts
```

**Step 4: Commit**

```bash
git add .claude/skills/docwise/lib/gap-prioritizer.ts
git add .claude/skills/docwise/lib/types.ts
git commit -m "feat: add gap priority filtering system"
```

---

## Phase 9: Learner Artifact Generation

### Task 9: Create artifact generator

**Files:**
- Create: `.claude/skills/docwise/lib/artifact-generator.ts`
- Create: `.claude/skills/docwise/templates/learner-readme.template.md`

**Step 1: Write artifact generator**

```typescript
// .claude/skills/docwise/lib/artifact-generator.ts

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { LearnerArtifact } from './types.js';

const README_TEMPLATE = `# Docwise 实操验证产物

## 基本信息

- **章节**: {{CHAPTER_PATH}}
- **场景ID**: {{SANDBOX_ID}}
- **执行时间**: {{TIMESTAMP}}
- **复杂度**: {{COMPLEXITY}}

## 场景描述

{{SCENARIO_DESCRIPTION}}

## 核心议题

{{TOPICS_LIST}}

## 目标

{{GOALS_LIST}}

## 工作流

{{WORKFLOW_STEPS}}

## 发现的问题

### 议题覆盖验证

| 议题 | 状态 | 说明 |
|------|------|------|
{{TOPICS_TABLE}}

### 文档缺口

{{GAPS_LIST}}

### 执行过程中的卡点

{{BLOCKERS_LIST}}

## 改进建议

{{SUGGESTIONS_LIST}}

## 代码产物

{{CODE_PRODUCTS}}

## 验证结果

{{VALIDATION_RESULTS}}
`;

export class ArtifactGenerator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Generate learner artifacts in sandbox
   */
  async generateArtifacts(
    sandboxPath: string,
    data: {
      scenarioId: string;
      scenarioDescription: string;
      topics: string[];
      goals: string[];
      workflow: string[];
      topicResults: Array<{ topic: string; status: string; notes: string }>;
      gaps: Array<{ category: string; description: string; location: string }>;
      blockers: string[];
      suggestions: string[];
      codeProducts?: Array<{ path: string; description: string }>;
      validationResults?: string;
    }
  ): Promise<LearnerArtifact> {
    // Ensure directories exist
    const codeDir = join(sandboxPath, 'code');
    const validationDir = join(sandboxPath, 'validation');
    await mkdir(codeDir, { recursive: true });
    await mkdir(validationDir, { recursive: true });

    // Generate README.md
    const readmeContent = this.generateReadme(data);
    const readmePath = join(sandboxPath, 'README.md');
    await writeFile(readmePath, readmeContent, 'utf-8');

    // Generate learning-log.md
    const learningLogContent = this.generateLearningLog(data);
    const learningLogPath = join(sandboxPath, 'learning-log.md');
    await writeFile(learningLogPath, learningLogContent, 'utf-8');

    return {
      readme_path: readmePath,
      learning_log_path: learningLogPath,
      code_path: codeDir,
      validation_path: validationDir,
      scenario_id: data.scenarioId,
      timestamp: new Date().toISOString()
    };
  }

  private generateReadme(data: any): string {
    let content = README_TEMPLATE;

    // Replace placeholders
    content = content.replace('{{CHAPTER_PATH}}', data.scenarioId.split('-')[0] || 'unknown');
    content = content.replace('{{SANDBOX_ID}}', data.scenarioId);
    content = content.replace('{{TIMESTAMP}}', new Date().toLocaleString());
    content = content.replace('{{COMPLEXITY}}', 'medium'); // TODO: get from data
    content = content.replace('{{SCENARIO_DESCRIPTION}}', data.scenarioDescription);
    content = content.replace('{{TOPICS_LIST}}', this.formatList(data.topics));
    content = content.replace('{{GOALS_LIST}}', this.formatList(data.goals));
    content = content.replace('{{WORKFLOW_STEPS}}', this.formatList(data.workflow));

    // Generate topics table
    const tableRows = data.topicResults.map(r =>
      `| ${r.topic} | ${this.statusToEmoji(r.status)} | ${r.notes} |`
    ).join('\n');
    content = content.replace('{{TOPICS_TABLE}}', tableRows);

    // Generate gaps list
    const gapsList = data.gaps.map(g =>
      `- ${g.description} (${g.location})`
    ).join('\n');
    content = content.replace('{{GAPS_LIST}}', gapsList || '无');

    // Generate blockers list
    const blockersList = data.blockers.map(b => `- ${b}`).join('\n');
    content = content.replace('{{BLOCKERS_LIST}}', blockersList || '无');

    // Generate suggestions
    content = content.replace('{{SUGGESTIONS_LIST}}', this.formatList(data.suggestions));

    // Generate code products
    const codeProducts = data.codeProducts?.map(c =>
      `- \`${c.path}\` - ${c.description}`
    ).join('\n') || '无';
    content = content.replace('{{CODE_PRODUCTS}}', codeProducts);

    // Validation results
    content = content.replace('{{VALIDATION_RESULTS}}', data.validationResults || '待执行');

    return content;
  }

  private generateLearningLog(data: any): string {
    return `# Learner Learning Log

## Scenario
${data.scenarioDescription}

## Topics to Validate
${this.formatList(data.topics)}

## Execution Process

### Step 1: Reading Documentation
- Time: TBD
- Findings: TBD

### Step 2: Attempting Tasks
- Time: TBD
- Findings: TBD

### Step 3: Validation
- Time: TBD
- Results: TBD

## Key Learnings

### What Worked Well
1.
2.
3.

### What Was Challenging
1.
2.
3.

### Suggestions for Documentation
1.
2.
3.
`;
  }

  private formatList(items: string[]): string {
    return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
  }

  private statusToEmoji(status: string): string {
    if (status === 'success' || status === 'complete') return '✓';
    if (status === 'partial') return '⚠';
    return '✗';
  }
}
```

**Step 2: Create README template**

```bash
# Create templates directory
mkdir -p .claude/skills/docwise/templates

# Write template
cat > .claude/skills/docwise/templates/learner-readme.template.md << 'TEMPLATE'
# Docwise 实操验证产物

## 基本信息

- **章节**: {{CHAPTER_PATH}}
...
TEMPLATE
```

**Step 3: Run TypeScript check**

```bash
cd .claude/skills/docwise/lib
npx tsc --noEmit *.ts
```

**Step 4: Commit**

```bash
git add .claude/skills/docwise/lib/artifact-generator.ts
git add .claude/skills/docwise/templates/
git commit -m "feat: add learner artifact generator with README template"
```

---

## Phase 10: Update Paradigm

### Task 10: Update paradigm with new principles

**Files:**
- Modify: `.docwise/paradigm.md`

**Step 1: Add document status convention**

Add to the Quality Standards section:

```markdown
### 6. Document Status Convention

| 状态 | 含义 | 使用场景 |
|------|------|---------|
| `draft` | 草稿，早期阶段 | 刚创建，内容不完整 |
| `in-progress` | 开发中，有实质内容 | 主要章节已有内容 |
| `published` | 已发布，内容稳定 | 可对外展示，可小幅迭代 |
| `completed` | 里程碑完成，不再改动 | 某版本的文档冻结，存档用 |

**执行 check/improve 时的约束**:
- `completed` 状态的文档需要显式警告提示用户
- `:improve`/`:check` 的目的是完善现有文档，不是生成全新文档
- 除非用户明确提出"重写"类需求
```

**Step 2: Add scenario vs document relationship**

```markdown
## Scenario vs Document Relationship

**核心原则**: 场景是验证手段，不是文档范围

```
场景 = 验证手段（用这个场景来测试文档是否完善）
     ≠ 文档范围（文档不能只写这个场景）

文档 = 通识性内容（覆盖该技术的完整知识体系）
     + 适当广度和深度（根据复杂度调整）
     ≠ 围绕单一场景的实验记录
```

**场景设计原则**:
- 从文档出发：场景应能被文档中的知识支撑
- 跨章节验证：一个好场景会涉及文档的多个章节
- 可操作检验：Learner 能否按文档完成场景

**文档设计原则**:
- 场景无关：文档不因某个场景而改变范围
- 知识驱动：以技术本身的体系为纲
- 读者友好：不过度堆砌，保持可读性

**避免**:
- ❌ 为凑"完整性"而塞入边缘内容
- ❌ 围绕单个场景写文档（其他都不提）
- ❌ 变成实验记录或代码仓库说明
```

**Step 3: Commit**

```bash
git add .docwise/paradigm.md
git commit -m "docs: add scenario-document relationship principles to paradigm"
```

---

## Phase 11: Update Config Schema

### Task 11: Add language field to config

**Files:**
- Modify: `.docwise/config.yaml`

**Step 1: Add language field to chapter config**

```yaml
chapters:
  agent/mcp-deep-dive:
    type: technical_guide
    language: node        # NEW: Primary language for sandbox
    sections: [concepts/, experiments/]
    scenarios:
      basic-tool:
        type: tool
        description: "Build a basic MCP Server with stdio transport"
        requirements: ["Server starts", "Responds to tools/list"]

  algo/attention/self-attention:
    type: academic_paper
    language: python      # NEW: Primary language
    sections: [paper-summary/, implementation/, experiments/]
    prerequisites: [algo/foundations/backpropagation]
    scenarios:
      reproduction:
        type: paper
        description: "Reproduce self-attention mechanism"
        verify: "Implementation matches paper formulas"
```

**Step 2: Commit**

```bash
git add .docwise/config.yaml
git commit -m "config: add language field to chapter declarations"
```

---

## Phase 12: Integration Testing

### Task 12: Create integration test

**Files:**
- Create: `tests/integration/docwise-scenario-test.md`

**Step 1: Write integration test plan**

```markdown
# Docwise Scenario Integration Test

## Test: Overview Display for :check

**Step 1**: Run docwise:check on mcp-deep-dive
```bash
# This will be tested manually
# /docwise:check "agent/mcp-deep-dive, simple"
```

**Expected**: Shows overview before scenario confirmation

**Step 2**: Verify sandbox creation
```bash
ls -la agent/mcp-deep-dive/.docwise/sandbox/
```

**Expected**: Directory created with language-appropriate isolation

## Test: Gap Priority Filtering

**Step 1**: Create test with mixed gaps
```typescript
import { GapPrioritizer } from './.claude/skills/docwise/lib/gap-prioritizer.js';

const prioritizer = new GapPrioritizer();

const gaps = [
  { category: 'concept_missing', description: 'Missing concept', severity: 'major' },
  { category: 'typo', description: 'Typo in docs', severity: 'minor' },
  { category: 'code_error', description: 'Critical bug', severity: 'critical' }
];

const filtered = prioritizer.filterGapsByPriority(gaps, 'critical-important');
console.log(filtered.length);
```

**Expected**: 2 gaps (critical + major), minor filtered out

## Test: Artifact Generation

**Step 1**: Generate artifacts
```typescript
import { ArtifactGenerator } from './.claude/skills/docwise/lib/artifact-generator.js';

// Mock test data
const generator = new ArtifactGenerator('/path/to/project');
await generator.generateArtifacts('/sandbox/path', mockData);
```

**Expected**: README.md and learning-log.md created in sandbox
```

**Step 2: Run integration test**

```bash
# Verify TypeScript compilation
cd .claude/skills/docwise/lib
npx tsc --noEmit *.ts

# Verify no syntax errors
```

**Step 3: Commit**

```bash
git add tests/integration/docwise-scenario-test.md
git commit -m "test: add integration test plan for scenario system"
```

---

## Phase 13: Documentation

### Task 13: Update skill README with new capabilities

**Files:**
- Modify: `.claude/skills/docwise/README.md`

**Step 1: Update README with new features**

Add sections:
- Overview display before execution
- Scenario generation from WebSearch
- Sandbox environment isolation
- Learner artifact generation
- Gap priority filtering

**Step 2: Commit**

```bash
git add .claude/skills/docwise/README.md
git commit -m "docs: update docwise README with scenario system features"
```

---

## Rollout Plan

### Task 14: Create rollout checklist

**Files:**
- Create: `docs/plans/2026-02-09-docwise-rollout.md`

**Step 1: Write rollout checklist**

```markdown
# Docwise Practical Scenario Rollout Checklist

## Phase 1: Core Infrastructure (Tasks 1-3)
- [ ] Type extensions added
- [ ] Config loader enhanced with language detection
- [ ] Sandbox manager created
- [ ] All TypeScript checks pass

## Phase 2: Display & Confirmation (Tasks 4-5)
- [ ] Overview display utility created
- [ ] docwise-check skill updated
- [ ] docwise-improve skill updated
- [ ] docwise-new skill updated
- [ ] All skills show overview before execution

## Phase 3: Execution (Tasks 6-9)
- [ ] Scenario loader integrated
- [ ] Gap prioritizer added
- [ ] Artifact generator created
- [ ] Learner agents generate artifacts

## Phase 4: Documentation (Tasks 10-11)
- [ ] Paradigm updated with new principles
- [ ] Config schema extended with language field
- [ ] README documentation complete

## Phase 5: Testing (Task 12)
- [ ] Integration tests written
- [ ] Manual testing on mcp-deep-dive chapter
- [ ] All tests pass

## Phase 6: Rollout
- [ ] Skills tested on sample chapter
- [ ] Feedback collected
- [ ] Adjustments made based on feedback
```

**Step 2: Commit**

```bash
git add docs/plans/2026-02-09-docwise-rollout.md
git commit -m "docs: add rollout checklist for scenario system"
```

---

## Notes for Implementation

### WebSearch Integration

The design references using `@WebSearch` for scenario generation. Actual implementation will need to:
1. Call the WebSearch skill with appropriate queries
2. Parse search results to extract practical examples
3. Convert examples into scenario topics and goals

### Sandbox Language Detection

Current implementation auto-detects language from project files. For better accuracy, consider:
1. Add `language` field to `.docwise/config.yaml` chapter declarations
2. Fall back to auto-detection if not specified
3. User can override via command argument if needed

### Gap Priority Mapping

The priority system maps gap `severity` values to priority categories:
- `critical` severity → `critical` priority
- `major` severity → `important` priority
- `minor` severity → `minor` priority

Gap categories have their own priority mapping in `GapPrioritizer.getGapPriority()`.

### Testing Strategy

1. **Unit Tests**: Test each module in isolation (TypeScript compilation)
2. **Integration Tests**: Test full workflow with sample chapter
3. **Manual Tests**: Verify UI/output format matches design
4. **Regression Tests**: Ensure existing docwise functionality still works

---

## Open Questions to Resolve During Implementation

1. **WebSearch Query Construction**: How to build effective search queries for scenario generation?
   - Resolution: Implement in scenario loader, make configurable

2. **User Confirmation Flow**: When to prompt for confirmation vs auto-proceed?
   - Resolution: Add `--auto-confirm` flag for non-interactive use

3. **Sandbox Cleanup**: When and how to clean up old sandbox directories?
   - Resolution: Add `docwise:cleanup` command to remove old sandboxes

4. **Validation Command Inference**: How to determine what command to run for validation?
   - Resolution: Start with user-specified commands, add patterns for common languages
