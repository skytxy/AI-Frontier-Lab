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
