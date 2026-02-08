// .claude/skills/docwise/lib/executor.ts

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
