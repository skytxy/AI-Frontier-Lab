// .claude/skills/chapter-content-validator/index.ts

/**
 * Chapter Content Validator Skill
 *
 * Experience-driven collaboration engine for validating,
 * generating, and optimizing educational content.
 */

export { runValidator } from './api.js';
export { checkSetup, getSetupMessage } from './lib/setup.js';
export { ExperienceStore } from './lib/experience-store.js';
export { ConfigLoader } from './lib/config-loader.js';
export { ModeRecommender } from './lib/mode-recommender.js';
export { Executor } from './lib/executor.js';
export { FeedbackProcessor } from './lib/feedback-processor.js';
export { DependencyResolver } from './lib/dependency-resolver.js';

export type {
  WorkMode,
  CollaborationMode,
  ExecutionContext,
  ExecutionResult,
  GapReport,
  Gap,
  FeedbackEntry,
  FeedbackLevel,
  ProjectConfig,
  ChapterConfig,
  ParadigmConfig,
  ExperiencePattern,
} from './lib/types.js';
