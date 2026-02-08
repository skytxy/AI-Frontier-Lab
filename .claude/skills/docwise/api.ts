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
import { checkSetup, getSetupMessage } from './lib/setup.js';
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
          target: '.docwise/config.yaml',
          description: 'Run /docwise --setup to configure',
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
  // Experience store reads from project-level .docwise/experience.yaml
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
