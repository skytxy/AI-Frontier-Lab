/**
 * Coordinator - Orchestrates the Learner <-> Author interaction
 *
 * The coordinator manages the validation loop:
 * 1. Learner reads chapter content
 * 2. Learner attempts simple scenario
 * 3. If success -> attempt complex scenario
 * 4. If both success -> VALIDATION COMPLETE
 * 5. If stuck -> generate gap report
 * 6. Author fixes gaps
 * 7. Continue loop (max 5 iterations)
 */

import { Learner, type GapReport } from './learner.js';
import { Author } from './author.js';

export interface ValidationResult {
  success: boolean;
  iterations: number;
  simplePassed: boolean;
  complexPassed: boolean;
  gapsResolved: number;
  gapsRemaining: number;
  reports: GapReport[];
}

export interface CoordinatorOptions {
  maxIterations?: number;
  chapterPath: string;
  simpleScenario: string;
  complexScenario: string;
  workingDirectory?: string;
  verbose?: boolean;
}

export class Coordinator {
  private learner: Learner;
  private author: Author;
  private options: Required<CoordinatorOptions>;
  private reports: GapReport[] = [];

  constructor(options: CoordinatorOptions) {
    this.options = {
      maxIterations: 5,
      workingDirectory: process.cwd(),
      verbose: false,
      ...options,
    };

    this.learner = new Learner({
      workingDirectory: this.options.workingDirectory,
      verbose: this.options.verbose,
    });

    this.author = new Author({
      chapterPath: this.options.chapterPath,
      workingDirectory: this.options.workingDirectory,
      verbose: this.options.verbose,
    });
  }

  /**
   * Run the full validation loop
   */
  async run(): Promise<ValidationResult> {
    const { maxIterations, chapterPath, simpleScenario, complexScenario } =
      this.options;

    // Load chapter content for learner
    const chapterContent = await this.learner.readChapter(chapterPath);

    let simplePassed = false;
    let complexPassed = false;
    let gapsResolved = 0;
    let gapsRemaining = 0;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      if (this.options.verbose) {
        console.log(`\n=== Iteration ${iteration + 1}/${maxIterations} ===`);
      }

      // Phase 1: Learner attempts simple scenario
      const simpleResult = await this.learner.attemptScenario({
        content: chapterContent,
        scenario: simpleScenario,
        phase: 'simple',
      });

      if (simpleResult.success) {
        simplePassed = true;

        // Phase 2: Learner attempts complex scenario
        const complexResult = await this.learner.attemptScenario({
          content: chapterContent,
          scenario: complexScenario,
          phase: 'complex',
        });

        if (complexResult.success) {
          complexPassed = true;
          // Both scenarios passed - validation complete!
          return this.buildResult({
            success: true,
            iterations: iteration + 1,
            simplePassed: true,
            complexPassed: true,
            gapsResolved,
            gapsRemaining: 0,
            reports: this.reports,
          });
        }

        // Complex scenario failed - generate gap report
        const gapReport = this.learner.identifyGaps(complexResult);
        gapReport.iteration = iteration + 1;
        gapReport.phase = 'complex';
        this.reports.push(gapReport);
        gapsRemaining += this.countGaps(gapReport);

        // Author fixes gaps
        const fixApplied = await this.author.fixGaps(gapReport);
        if (fixApplied) {
          gapsResolved += this.countGaps(gapReport);
          gapsRemaining -= this.countGaps(gapReport);
        }

        // Reload chapter content after author fixes
        const updatedContent = await this.learner.readChapter(chapterPath);
        Object.assign(chapterContent, updatedContent);
      } else {
        // Simple scenario failed - critical gap
        const gapReport = this.learner.identifyGaps(simpleResult);
        gapReport.iteration = iteration + 1;
        gapReport.phase = 'simple';
        this.reports.push(gapReport);
        gapsRemaining += this.countGaps(gapReport);

        // Author fixes gaps
        const fixApplied = await this.author.fixGaps(gapReport);
        if (fixApplied) {
          gapsResolved += this.countGaps(gapReport);
          gapsRemaining -= this.countGaps(gapReport);
        }

        // Reload chapter content after author fixes
        const updatedContent = await this.learner.readChapter(chapterPath);
        Object.assign(chapterContent, updatedContent);
      }
    }

    // Max iterations reached without full success
    return this.buildResult({
      success: false,
      iterations: maxIterations,
      simplePassed,
      complexPassed,
      gapsResolved,
      gapsRemaining,
      reports: this.reports,
    });
  }

  private countGaps(report: GapReport): number {
    return (
      report.missingConcepts.length +
      report.missingSteps.length +
      report.ambiguousContent.length
    );
  }

  private buildResult(result: ValidationResult): ValidationResult {
    return result;
  }

  /**
   * Get skill self-improvement feedback
   * Collects insights about the skill itself during execution
   */
  getSkillFeedback(result: ValidationResult): string {
    const lines: string[] = [];
    lines.push('=== Skill Self-Improvement Feedback ===');
    lines.push('');
    lines.push('## Learner Feedback');
    lines.push('- [ ] Prompt Clarity: Were constraints well understood?');
    lines.push('- [ ] Scenario Definition: Were scenarios specific enough?');
    lines.push('- [ ] Gap Detection: Did we identify real knowledge gaps?');
    lines.push('');
    lines.push('## Author Feedback');
    lines.push('- [ ] Gap Categories: Are 4 categories sufficient?');
    lines.push('- [ ] Fix Strategies: Which gap types were hard to fix?');
    lines.push('- [ ] Tool Usage: Were additional skills needed?');
    lines.push('');
    lines.push('## Process Improvement Suggestions');
    lines.push('- [ ] New issues discovered');
    lines.push('- [ ] Suggested new features');
    lines.push('- [ ] Parameters to adjust');
    return lines.join('\n');
  }

  /**
   * Get a human-readable summary of the validation
   */
  getSummary(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push('=== Chapter Validation Summary ===');
    lines.push(`Status: ${result.success ? 'PASSED' : 'FAILED'}`);
    lines.push(`Iterations: ${result.iterations}`);
    lines.push(`Simple Scenario: ${result.simplePassed ? 'PASSED' : 'FAILED'}`);
    lines.push(
      `Complex Scenario: ${result.complexPassed ? 'PASSED' : 'FAILED'}`
    );

    if (result.gapsResolved > 0 || result.gapsRemaining > 0) {
      lines.push(`Gaps Resolved: ${result.gapsResolved}`);
      lines.push(`Gaps Remaining: ${result.gapsRemaining}`);
    }

    if (result.reports.length > 0) {
      lines.push('\n--- Gap Reports ---');
      for (const report of result.reports) {
        lines.push(`\nIteration ${report.iteration} (${report.phase} phase):`);
        if (report.missingConcepts.length > 0) {
          lines.push(`  Missing Concepts: ${report.missingConcepts.join(', ')}`);
        }
        if (report.missingSteps.length > 0) {
          lines.push(`  Missing Steps: ${report.missingSteps.join(', ')}`);
        }
        if (report.ambiguousContent.length > 0) {
          lines.push(
            `  Ambiguous Content: ${report.ambiguousContent.join(', ')}`
          );
        }
      }
    }

    return lines.join('\n');
  }
}
