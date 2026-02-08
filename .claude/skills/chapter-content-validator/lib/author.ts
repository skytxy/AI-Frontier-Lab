/**
 * Author - Fixes identified gaps in chapter content
 *
 * The Author Agent receives gap reports from the Learner and modifies
 * chapter content to address:
 * - Missing concept documentation
 * - Unclear or missing steps
 * - Code errors or missing code examples
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GapReport } from './learner.js';

export interface AuthorOptions {
  chapterPath: string;
  workingDirectory: string;
  verbose?: boolean;
}

export interface GapFixResult {
  applied: boolean;
  modifications: string[];
  error?: string;
}

export interface KnowledgeGap {
  type: 'concept' | 'step' | 'code' | 'content';
  description: string;
  location?: string; // Section or line reference
  severity: 'critical' | 'moderate' | 'minor';
  context?: string;
}

export interface GapAnalysis {
  gapType: string;
  rootCause: string;
  suggestedFix: string;
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  canUseExistingSkill: boolean;
  relevantSkill?: string;
}

/**
 * Author Agent - Identifies and fixes gaps in chapter content
 */
export class Author {
  private options: Required<AuthorOptions>;
  private dryRun: boolean = false;

  constructor(options: AuthorOptions) {
    this.options = {
      verbose: false,
      ...options,
    };
  }

  /**
   * Analyze a gap to understand its type and determine the best fix approach
   */
  async analyzeGap(gap: KnowledgeGap): Promise<GapAnalysis> {
    const analysis: GapAnalysis = {
      gapType: gap.type,
      rootCause: '',
      suggestedFix: '',
      estimatedComplexity: 'simple',
      canUseExistingSkill: false,
    };

    // Analyze based on gap type
    switch (gap.type) {
      case 'concept':
        analysis.rootCause = 'Missing conceptual explanation or definition';
        analysis.suggestedFix = 'Add concept section with explanation and examples';
        analysis.estimatedComplexity = gap.severity === 'critical' ? 'moderate' : 'simple';
        analysis.canUseExistingSkill = false;
        break;

      case 'step':
        analysis.rootCause = 'Unclear, missing, or ambiguous instruction step';
        analysis.suggestedFix = 'Break down step into sub-steps with clear commands';
        analysis.estimatedComplexity = 'simple';
        analysis.canUseExistingSkill = false;
        break;

      case 'code':
        analysis.rootCause = 'Code error, missing example, or non-executable code';
        analysis.suggestedFix = 'Fix or add code example with proper comments';
        analysis.estimatedComplexity = gap.severity === 'critical' ? 'complex' : 'moderate';
        // Check if this is a debugging scenario
        if (gap.description.toLowerCase().includes('bug') ||
            gap.description.toLowerCase().includes('error') ||
            gap.description.toLowerCase().includes('debug')) {
          analysis.canUseExistingSkill = true;
          analysis.relevantSkill = 'systematic-debugging';
        }
        break;

      case 'content':
        analysis.rootCause = 'Content ambiguity, inconsistency, or incomplete information';
        analysis.suggestedFix = 'Clarify content with additional context or examples';
        analysis.estimatedComplexity = 'moderate';
        // Check if this relates to frontend design
        if (gap.description.toLowerCase().includes('ui') ||
            gap.description.toLowerCase().includes('component') ||
            gap.description.toLowerCase().includes('interface')) {
          analysis.canUseExistingSkill = true;
          analysis.relevantSkill = 'frontend-design';
        }
        break;

      default:
        analysis.rootCause = 'Unknown gap type';
        analysis.suggestedFix = 'Manual review required';
        analysis.estimatedComplexity = 'complex';
    }

    if (this.options.verbose) {
      console.log('[Author] Gap Analysis:', JSON.stringify(analysis, null, 2));
    }

    return analysis;
  }

  /**
   * Fix a content/concept gap by adding missing documentation
   */
  async fixContentGap(gap: KnowledgeGap): Promise<void> {
    const chapterPath = join(this.options.workingDirectory, this.options.chapterPath);

    if (this.options.verbose) {
      console.log(`[Author] Fixing content gap: ${gap.description}`);
    }

    // Read the chapter file
    let content = '';
    try {
      content = readFileSync(chapterPath, 'utf-8');
    } catch (error) {
      console.error(`[Author] Failed to read chapter: ${chapterPath}`);
      throw error;
    }

    // Build the addition based on gap context
    const addition = this.buildConceptAddition(gap);

    // Find the appropriate location to insert (after frontmatter or before first header)
    const lines = content.split('\n');
    let insertIndex = 0;

    // Skip past frontmatter
    if (lines[0]?.trim() === '---') {
      for (let i = 1; i < lines.length; i++) {
        if (lines[i]?.trim() === '---') {
          insertIndex = i + 1;
          break;
        }
      }
    }

    // Insert the new content
    lines.splice(insertIndex, 0, '', addition, '');

    if (!this.dryRun) {
      writeFileSync(chapterPath, lines.join('\n'), 'utf-8');
    }

    if (this.options.verbose) {
      console.log(`[Author] Added concept documentation at line ${insertIndex}`);
    }
  }

  /**
   * Fix a step gap by clarifying or adding missing steps
   */
  async fixStepGap(gap: KnowledgeGap): Promise<void> {
    const chapterPath = join(this.options.workingDirectory, this.options.chapterPath);

    if (this.options.verbose) {
      console.log(`[Author] Fixing step gap: ${gap.description}`);
    }

    let content = '';
    try {
      content = readFileSync(chapterPath, 'utf-8');
    } catch (error) {
      console.error(`[Author] Failed to read chapter: ${chapterPath}`);
      throw error;
    }

    const clarification = this.buildStepClarification(gap);

    // If location is specified, try to insert near it
    if (gap.location) {
      const lines = content.split('\n');
      const locationIndex = lines.findIndex(line =>
        line.includes(gap.location!)
      );

      if (locationIndex !== -1) {
        lines.splice(locationIndex + 1, 0, '', clarification, '');
        if (!this.dryRun) {
          writeFileSync(chapterPath, lines.join('\n'), 'utf-8');
        }
        if (this.options.verbose) {
          console.log(`[Author] Added clarification after line ${locationIndex}`);
        }
        return;
      }
    }

    // Otherwise, append to content
    const updatedContent = content + '\n\n' + clarification;
    if (!this.dryRun) {
      writeFileSync(chapterPath, updatedContent, 'utf-8');
    }

    if (this.options.verbose) {
      console.log('[Author] Appended step clarification to chapter');
    }
  }

  /**
   * Fix a code gap by adding or fixing code examples
   */
  async fixCodeGap(gap: KnowledgeGap): Promise<void> {
    const chapterPath = join(this.options.workingDirectory, this.options.chapterPath);

    if (this.options.verbose) {
      console.log(`[Author] Fixing code gap: ${gap.description}`);
    }

    let content = '';
    try {
      content = readFileSync(chapterPath, 'utf-8');
    } catch (error) {
      console.error(`[Author] Failed to read chapter: ${chapterPath}`);
      throw error;
    }

    const codeFix = this.buildCodeFix(gap);

    // Find the appropriate location (near context or at end)
    const lines = content.split('\n');
    let insertIndex = lines.length;

    if (gap.context) {
      const contextIndex = lines.findIndex(line =>
        line.toLowerCase().includes(gap.context!.toLowerCase())
      );
      if (contextIndex !== -1) {
        insertIndex = contextIndex + 1;
      }
    }

    lines.splice(insertIndex, 0, '', codeFix, '');

    if (!this.dryRun) {
      writeFileSync(chapterPath, lines.join('\n'), 'utf-8');
    }

    if (this.options.verbose) {
      console.log(`[Author] Added code fix at line ${insertIndex}`);
    }
  }

  /**
   * Validate that a fix has successfully addressed the gap
   */
  async validateFix(gap: KnowledgeGap): Promise<boolean> {
    const chapterPath = join(this.options.workingDirectory, this.options.chapterPath);

    if (this.options.verbose) {
      console.log(`[Author] Validating fix for: ${gap.description}`);
    }

    let content = '';
    try {
      content = readFileSync(chapterPath, 'utf-8');
    } catch (error) {
      console.error(`[Author] Failed to read chapter for validation: ${chapterPath}`);
      return false;
    }

    const lowerContent = content.toLowerCase();

    // Check based on gap type
    switch (gap.type) {
      case 'concept':
        // Verify concept explanation exists
        const conceptKeywords = gap.description.split(' ').slice(0, 3);
        const hasConceptExplanation = conceptKeywords.some(keyword =>
          lowerContent.includes(keyword.toLowerCase())
        );
        return hasConceptExplanation;

      case 'step':
        // Verify step clarification exists
        const stepKeywords = gap.description.split(' ').slice(0, 3);
        const hasStepClarification = stepKeywords.some(keyword =>
          lowerContent.includes(keyword.toLowerCase())
        ) || lowerContent.includes('step') || lowerContent.includes('follow');
        return hasStepClarification;

      case 'code':
        // Verify code block exists and looks valid
        const hasCodeBlock = content.includes('```') || content.includes('    ');
        return hasCodeBlock;

      case 'content':
        // Verify content has been expanded
        const contentLength = content.split('\n').length;
        return contentLength > 20; // Arbitrary threshold

      default:
        return false;
    }
  }

  /**
   * Fix identified gaps in the chapter content
   * Legacy method for backward compatibility with Coordinator
   */
  async fixGaps(report: GapReport): Promise<boolean> {
    const modifications: string[] = [];
    let fixedCount = 0;

    // Convert GapReport to KnowledgeGap format
    const gaps: KnowledgeGap[] = [];

    for (const concept of report.missingConcepts) {
      gaps.push({
        type: 'concept',
        description: concept,
        severity: 'moderate',
      });
    }

    for (const step of report.missingSteps) {
      gaps.push({
        type: 'step',
        description: step,
        severity: step.includes('critical') ? 'critical' : 'moderate',
      });
    }

    for (const ambiguous of report.ambiguousContent) {
      gaps.push({
        type: 'content',
        description: ambiguous,
        severity: 'minor',
      });
    }

    // Process each gap
    for (const gap of gaps) {
      const analysis = await this.analyzeGap(gap);

      if (this.options.verbose) {
        console.log(`[Author] Processing gap: ${gap.description}`);
        console.log(`[Author] Analysis: ${analysis.suggestedFix}`);

        if (analysis.canUseExistingSkill && analysis.relevantSkill) {
          console.log(`[Author] Could leverage skill: ${analysis.relevantSkill}`);
        }
      }

      switch (gap.type) {
        case 'concept':
          await this.fixContentGap(gap);
          modifications.push(`Added concept: ${gap.description}`);
          if (await this.validateFix(gap)) fixedCount++;
          break;

        case 'step':
          await this.fixStepGap(gap);
          modifications.push(`Clarified step: ${gap.description}`);
          if (await this.validateFix(gap)) fixedCount++;
          break;

        case 'code':
          await this.fixCodeGap(gap);
          modifications.push(`Fixed code: ${gap.description}`);
          if (await this.validateFix(gap)) fixedCount++;
          break;

        case 'content':
          await this.fixContentGap(gap);
          modifications.push(`Clarified content: ${gap.description}`);
          if (await this.validateFix(gap)) fixedCount++;
          break;
      }
    }

    if (this.options.verbose && modifications.length > 0) {
      console.log('[Author] Modifications:', modifications);
      console.log(`[Author] Fixed ${fixedCount}/${gaps.length} gaps`);
    }

    return modifications.length > 0;
  }

  /**
   * Set dry run mode - no actual file modifications
   */
  setDryRun(enabled: boolean): void {
    this.dryRun = enabled;
  }

  /**
   * Build a concept addition based on the gap
   */
  private buildConceptAddition(gap: KnowledgeGap): string {
    const lines: string[] = [];

    lines.push('## Concept Explanation');
    lines.push('');
    lines.push(`The following concept is important to understand: ${gap.description}`);
    lines.push('');
    lines.push('### Key Points');
    lines.push('');
    lines.push('- Point 1: Overview of the concept');
    lines.push('- Point 2: Why it matters in this context');
    lines.push('- Point 3: Common pitfalls to avoid');
    lines.push('');
    lines.push('### Example');
    lines.push('');
    lines.push('```');
    lines.push('// Example demonstrating the concept');
    lines.push('```');

    return lines.join('\n');
  }

  /**
   * Build a step clarification based on the gap
   */
  private buildStepClarification(gap: KnowledgeGap): string {
    const lines: string[] = [];

    lines.push('> **Note**: ' + gap.description);
    lines.push('');
    lines.push('### Detailed Steps');
    lines.push('');
    lines.push('1. First, ensure prerequisites are met');
    lines.push('2. Execute the following command:');
    lines.push('   ```bash');
    lines.push('   command-here');
    lines.push('   ```');
    lines.push('3. Verify the result by checking...');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Build a code fix based on the gap
   */
  private buildCodeFix(gap: KnowledgeGap): string {
    const lines: string[] = [];

    lines.push('### Code Example');
    lines.push('');
    lines.push(`// ${gap.description}`);
    lines.push('');
    lines.push('```typescript');
    lines.push('// Implementation details');
    lines.push('function example() {');
    lines.push('  // Your code here');
    lines.push('}');
    lines.push('```');
    lines.push('');

    return lines.join('\n');
  }
}
