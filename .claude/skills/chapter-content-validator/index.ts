/**
 * Chapter Content Validator Skill
 *
 * Main entry point for validating chapter content through
 * simulated learner interaction.
 */

export { validateChapter } from './api.js';
export { Coordinator } from './lib/coordinator.js';
export { Learner } from './lib/learner.js';
export { Author } from './lib/author.js';

export type {
  ValidationResult,
  CoordinatorOptions,
} from './lib/coordinator.js';

export type { GapReport } from './lib/learner.js';

export type {
  LearnerOptions,
  LearnerScenarioResult,
  LearnerChapterContent,
} from './lib/learner.js';

export type {
  AuthorOptions,
  GapFixResult,
  KnowledgeGap,
  GapAnalysis,
} from './lib/author.js';
