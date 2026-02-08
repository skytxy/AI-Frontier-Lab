// .claude/skills/docwise/lib/config-loader.ts

import { readFileSync, readFileSync as readFileSyncNew, existsSync } from 'fs';
import { join, resolve } from 'path';
import type {
  ProjectConfig,
  ChapterConfig,
  ChapterDefaults,
  ParadigmConfig,
  DependencyGraph,
  QualityStandards,
  IsolationConfig,
  ChapterOverview,
  IsolationType,
} from './types.js';

/**
 * Config Loader - reads project-specific configuration.
 *
 * Searches for config in this order:
 * 1. .docwise/config.yaml (centralized, recommended)
 * 2. Individual chapter .docwise.yaml (legacy, per-chapter)
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
    const configPath = join(this.projectRoot, '.docwise', 'config.yaml');

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
    const perChapterPath = join(this.projectRoot, chapterPath, '.docwise.yaml');
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
    const paradigmPath = join(this.projectRoot, '.docwise', 'paradigm.md');

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

    let section: 'root' | 'chapters' | 'defaults' | 'seed_patterns' = 'root';
    let currentChapter: string | null = null;
    let currentChapterConfig: Partial<ChapterConfig> = {};
    let inSeedPatterns = false;

    for (const rawLine of content.split('\n')) {
      const line = rawLine.trimEnd();
      if (line.startsWith('#') || line.trim() === '') continue;

      const trimmed = line.trim();
      const indent = line.length - line.trimStart().length;

      if (trimmed.startsWith('version:')) {
        config.version = trimmed.split(':').slice(1).join(':').trim().replace(/"/g, '');
        continue;
      }
      if (trimmed === 'chapters:') { section = 'chapters'; inSeedPatterns = false; continue; }
      if (trimmed === 'defaults:') { section = 'defaults'; inSeedPatterns = false; continue; }
      if (trimmed === 'seed_patterns:') { inSeedPatterns = true; section = 'root'; continue; }

      if (inSeedPatterns) {
        // Parse seed patterns - simplified parsing for the seed_patterns array
        if (trimmed.startsWith('- id:')) {
          const id = trimmed.split(':').slice(1).join(':').trim();
          // For now, skip full seed pattern parsing - it's complex
          // In production, use a proper YAML library
        }
        continue;
      }

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

  // --- Scenario System Extensions ---

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
