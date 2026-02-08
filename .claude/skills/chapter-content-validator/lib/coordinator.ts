/**
 * Coordinator - Orchestrates the Learner <-> Author interaction
 *
 * The coordinator manages the validation loop:
 * 1. Learner reads chapter content
 * 2. Learner attempts user-defined scenario
 * 3. If stuck -> generate gap report
 * 4. Author fixes gaps
 * 5. Collect feedback and apply Level 1-2 updates
 * 6. Record Level 3-4 suggestions
 * 7. Continue loop (max iterations)
 * 8. Generate validation-log.md
 */

import { Learner, type GapReport } from './learner.js';
import { Author } from './author.js';
import {
  FeedbackProcessor,
  type LearnerFeedback,
  type AuthorFeedback,
  type ProcessedFeedback,
} from './feedback-processor.js';

export interface ValidationResult {
  success: boolean;
  iterations: number;
  scenario: string;
  scenarioMode: string;
  gapsResolved: number;
  gapsRemaining: number;
  reports: GapReport[];
  processedFeedback: ProcessedFeedback[];
}

export interface CoordinatorOptions {
  chapterPath: string;
  scenarioMode: 'template' | 'freeform' | 'brainstorming';
  scenario?: string;
  presetScenario?: string;
  maxIterations?: number;
  workingDirectory?: string;
  verbose?: boolean;
}

export class Coordinator {
  private learner: Learner;
  private author: Author;
  private feedbackProcessor: FeedbackProcessor;
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

    this.feedbackProcessor = new FeedbackProcessor(this.options.chapterPath);
  }

  /**
   * Run the full validation loop with custom scenario
   */
  async run(): Promise<ValidationResult> {
    const { maxIterations, chapterPath, scenarioMode, scenario, presetScenario } =
      this.options;

    // Determine the scenario to validate
    const finalScenario = await this.resolveScenario(
      scenarioMode,
      scenario,
      presetScenario
    );

    // Load chapter content for learner
    const chapterContent = await this.learner.readChapter(chapterPath);

    let scenarioPassed = false;
    let gapsResolved = 0;
    let gapsRemaining = 0;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      if (this.options.verbose) {
        console.log(`\n=== Iteration ${iteration + 1}/${maxIterations} ===`);
        console.log(`Scenario: ${finalScenario}`);
      }

      // Learner attempts scenario
      const result = await this.learner.attemptScenario({
        content: chapterContent,
        scenario: finalScenario,
      });

      // Collect Learner feedback
      const learnerFeedback: LearnerFeedback = {
        completion: result.completion,
        blockers: result.blockers,
        missingKnowledge: [
          ...result.missingConcepts,
          ...result.missingSteps,
          ...result.ambiguousContent,
        ],
        promptClarity: 5, // Will be collected during execution
        other: [],
      };

      if (result.success) {
        scenarioPassed = true;
        // Validation complete!
        const authorFeedback: AuthorFeedback = {
          gapsFixed: gapsResolved,
          difficultGapTypes: [],
          newGapCategories: [],
          other: [],
        };

        // Process feedback for final iteration
        await this.feedbackProcessor.processIteration(
          iteration + 1,
          finalScenario,
          learnerFeedback,
          authorFeedback
        );

        return this.buildResult({
          success: true,
          iterations: iteration + 1,
          scenario: finalScenario,
          scenarioMode: scenarioMode,
          gapsResolved,
          gapsRemaining: 0,
          reports: this.reports,
        });
      }

      // Scenario failed - generate gap report
      const gapReport = this.learner.identifyGaps(result);
      gapReport.iteration = iteration + 1;
      gapReport.phase = 'scenario';
      this.reports.push(gapReport);
      gapsRemaining += this.countGaps(gapReport);

      // Author fixes gaps
      const fixResult = await this.author.fixGaps(gapReport);

      // Collect Author feedback
      const authorFeedback: AuthorFeedback = {
        gapsFixed: fixResult.appliedChanges || 0,
        difficultGapTypes: fixResult.difficultTypes || [],
        newGapCategories: fixResult.newCategories || [],
        other: [],
      };

      if (fixResult.appliedChanges) {
        gapsResolved += this.countGaps(gapReport);
        gapsRemaining -= this.countGaps(gapReport);
      }

      // Process feedback
      await this.feedbackProcessor.processIteration(
        iteration + 1,
        finalScenario,
        learnerFeedback,
        authorFeedback
      );

      // Apply Level 1-2 updates directly
      await this.applyDirectUpdates(iteration + 1);

      // Reload chapter content after author fixes
      const updatedContent = await this.learner.readChapter(chapterPath);
      Object.assign(chapterContent, updatedContent);
    }

    // Max iterations reached
    return this.buildResult({
      success: false,
      iterations: maxIterations,
      scenario: finalScenario,
      scenarioMode: scenarioMode,
      gapsResolved,
      gapsRemaining,
      reports: this.reports,
    });
  }

  /**
   * Resolve the scenario to validate based on mode
   */
  private async resolveScenario(
    mode: string,
    scenario?: string,
    presetScenario?: string
  ): Promise<string> {
    if (mode === 'template' && presetScenario) {
      return `Template: ${presetScenario}`;
    }

    if (mode === 'freeform' && scenario) {
      return scenario;
    }

    if (mode === 'brainstorming') {
      return await this.brainstormScenario(scenario || 'Build a custom solution');
    }

    // Default fallback
    return scenario || 'Complete the chapter exercises';
  }

  /**
   * Brainstorm mode: refine scenario through Q&A
   */
  private async brainstormScenario(initialScenario: string): Promise<string> {
    // This would integrate with brainstorming skill
    // For now, return the initial scenario
    return initialScenario;
  }

  /**
   * Apply Level 1-2 updates directly
   */
  private async applyDirectUpdates(iteration: number): Promise<void> {
    const processed = this.feedbackProcessor['processed'].find(
      p => p.iteration === iteration
    );

    if (!processed) return;

    for (const update of processed.appliedUpdates) {
      if (this.options.verbose) {
        console.log(`  [Applying] ${update.file}: ${update.description}`);
      }
      // Actual file updates would be done by Author agent
    }
  }

  private countGaps(report: GapReport): number {
    return (
      report.missingConcepts.length +
      report.missingSteps.length +
      report.ambiguousContent.length
    );
  }

  private buildResult(result: ValidationResult): ValidationResult {
    result.processedFeedback = this.feedbackProcessor['processed'];
    return result;
  }

  /**
   * Generate validation-log.md and write to chapter directory
   */
  async generateValidationLog(): Promise<string> {
    const logContent = this.feedbackProcessor.generateValidationLog();

    const logPath = `${this.options.chapterPath}/validation-log.md`;

    // Write log file (would use fs in real implementation)
    if (this.options.verbose) {
      console.log(`\n[Writing] ${logPath}`);
    }

    return logPath;
  }

  /**
   * Get a human-readable summary of the validation
   */
  getSummary(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push('=== Chapter Validation Summary ===');
    lines.push(`Status: ${result.success ? 'PASSED' : 'FAILED'}`);
    lines.push(`Iterations: ${result.iterations}`);
    lines.push(`Scenario: ${result.scenario}`);
    lines.push(`Mode: ${result.scenarioMode}`);

    if (result.gapsResolved > 0 || result.gapsRemaining > 0) {
      lines.push(`Gaps Resolved: ${result.gapsResolved}`);
      lines.push(`Gaps Remaining: ${result.gapsRemaining}`);
    }

    // Add feedback summary
    lines.push('');
    lines.push(this.feedbackProcessor.getSummary());

    return lines.join('\n');
  }

  /**
   * Get skill self-improvement feedback
   * Deprecated: Use feedback processor instead
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
}
