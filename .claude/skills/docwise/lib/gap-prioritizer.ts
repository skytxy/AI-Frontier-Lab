// .claude/skills/docwise/lib/gap-prioritizer.ts

import type { Gap } from './types.js';

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

    const priorityThresholds: Record<string, string[]> = {
      'critical-only': ['critical'],
      'critical-important': ['critical', 'important']
    };

    const allowedPriorities = priorityThresholds[mode] || [];

    return gaps.filter(gap =>
      allowedPriorities.includes(this.getGapPriorityFromGap(gap))
    );
  }

  /**
   * Get priority category for a gap
   */
  getGapPriorityFromGap(gap: Gap): 'critical' | 'important' | 'minor' {
    if (gap.severity === 'critical') return 'critical';
    if (gap.severity === 'major') return 'important';
    return 'minor';
  }

  /**
   * Get priority level for a gap category
   * Maps standardized gap categories to priority levels
   */
  getPriorityForCategory(category: string): 'critical' | 'important' | 'minor' {
    // Critical categories block progress entirely
    const criticalCategories: string[] = [
      'concept_missing_critical',
      'step_unclear_blocking',
      'code_error_critical',
      'dependency_undeclared',
      'link_broken',
    ];

    // Important categories significantly hinder understanding
    const importantCategories: string[] = [
      'concept_missing',
      'step_unclear',
      'code_error',
      'context_missing',
      'implementation_gap',
      'formula_unclear',
      'link_extension_mismatch',
    ];

    if (criticalCategories.includes(category)) return 'critical';
    if (importantCategories.includes(category)) return 'important';
    return 'minor';
  }

  /**
   * Get severity level for a gap category
   * Maps categories to Gap severity values
   */
  getSeverityForCategory(category: string): 'minor' | 'major' | 'critical' {
    const priority = this.getPriorityForCategory(category);
    if (priority === 'critical') return 'critical';
    if (priority === 'important') return 'major';
    return 'minor';
  }

  /**
   * Generate change summary for confirmation
   */
  generateChangeSummary(
    gaps: Gap[],
    filesToChange: Record<string, number>
  ): string {
    const lines: string[] = [
      'Planned changes:',
      ''
    ];

    for (const [file, deltaLines] of Object.entries(filesToChange)) {
      const prefix = deltaLines >= 0 ? '+' : '';
      lines.push(`  📝 ${file}: ${prefix}${deltaLines}`);
    }

    lines.push('');
    lines.push(`Total: ${Object.values(filesToChange).reduce((sum, n) => sum + n, 0)} lines`);
    lines.push('');
    lines.push(`Gaps to fix: ${gaps.length}`);
    lines.push(`  - Critical: ${gaps.filter(g => g.severity === 'critical').length}`);
    lines.push(`  - Major: ${gaps.filter(g => g.severity === 'major').length}`);
    lines.push(`  - Minor: ${gaps.filter(g => g.severity === 'minor').length}`);
    lines.push('');
    lines.push('Confirm execution? [Y/n/critical-only]');

    return lines.join('\n');
  }

  /**
   * Count gaps by priority
   */
  countByPriority(gaps: Gap[]): { critical: number; important: number; minor: number } {
    return {
      critical: gaps.filter(g => this.getGapPriorityFromGap(g) === 'critical').length,
      important: gaps.filter(g => this.getGapPriorityFromGap(g) === 'important').length,
      minor: gaps.filter(g => this.getGapPriorityFromGap(g) === 'minor').length
    };
  }
}
