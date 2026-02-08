// .claude/skills/docwise/lib/feedback-processor.ts

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
        target: '.docwise/config.yaml',
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
        target: '.docwise/paradigm.md',
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
        target: '.claude/skills/docwise/',
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
