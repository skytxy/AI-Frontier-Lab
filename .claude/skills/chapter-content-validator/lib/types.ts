// .claude/skills/chapter-content-validator/lib/types.ts
/**
 * Core types for the Chapter Content Validator Skill.
 *
 * Design principle: Skill is generic and project-agnostic.
 * All project-specific knowledge comes from Config and Paradigm.
 */

// --- Work Modes ---

export type WorkMode = 'validate' | 'generate' | 'optimize';

// --- Collaboration Modes ---

export type CollaborationMode =
  | 'single-agent'
  | 'dual-agent'
  | 'triple-agent'
  | 'parallel-agents';

export interface CollaborationModeConfig {
  mode: CollaborationMode;
  agents: AgentRole[];
  description: string;
}

export type AgentRole = 'learner' | 'author' | 'reviewer' | 'validator';

// --- Experience Store ---

export interface ExperiencePattern {
  id: string;
  signature: ScenarioSignature;
  recommended_mode: CollaborationMode;
  stats: {
    success_rate: number;
    usage_count: number;
    avg_iterations: number;
  };
  feedback: ExperienceFeedback[];
}

export interface ScenarioSignature {
  content_type: string;      // e.g. 'academic_paper', 'technical_guide'
  complexity: 'low' | 'medium' | 'high';
  keywords: string[];
  work_mode: WorkMode;
}

export interface ExperienceFeedback {
  timestamp: string;
  success: boolean;
  iterations: number;
  notes: string;
}

// --- Config (project-specific, read from .chapter-validation/config.yaml) ---

export interface ProjectConfig {
  version: string;
  chapters: Record<string, ChapterConfig>;
  defaults: ChapterDefaults;
  seed_patterns?: ExperiencePattern[];  // initial experience rules from project config
}

export interface ChapterConfig {
  type: string;                        // 'academic_paper' | 'technical_guide' | ...
  sections?: string[];                 // content directories to validate
  prerequisites?: string[];            // dependency chapter paths
  scenarios?: Record<string, ScenarioTemplate>;
  collaboration_mode?: CollaborationMode;  // override default
}

export interface ChapterDefaults {
  max_iterations: number;
  collaboration_mode: CollaborationMode;
  sections: string[];
}

export interface ScenarioTemplate {
  type: string;
  description: string;
  requirements?: string[];
  verify?: string;
}

// --- Paradigm (project methodology, parsed from paradigm.md) ---

export interface DependencyGraph {
  nodes: string[];                     // chapter paths
  edges: Array<{ from: string; to: string }>;  // from depends on to
}

export interface ParadigmConfig {
  dependencies: DependencyGraph;
  quality_standards: QualityStandards;
  isolation: IsolationConfig;
}

export interface QualityStandards {
  learner_must_complete: boolean;
  max_iterations: number;
  require_web_verification: boolean;
}

export interface IsolationConfig {
  dev_port: number;
  validation_port_start: number;
  build_dir: string;
}

// --- Execution ---

export interface ExecutionContext {
  work_mode: WorkMode;
  chapter_path: string;
  scenario: string;
  scenario_mode: 'template' | 'freeform' | 'brainstorming';
  collaboration_mode: CollaborationMode;
  config: ChapterConfig;
  paradigm: ParadigmConfig;
  max_iterations: number;
}

export interface ExecutionResult {
  success: boolean;
  work_mode: WorkMode;
  collaboration_mode: CollaborationMode;
  iterations: number;
  chapter_path: string;
  scenario: string;
  gaps_found: number;
  gaps_resolved: number;
  files_modified: string[];
  files_created: string[];
  feedback: FeedbackEntry[];
  duration_ms: number;
}

// --- Feedback ---

export type FeedbackLevel = 1 | 2 | 3 | 4;

export interface FeedbackEntry {
  level: FeedbackLevel;
  target: string;           // file path or component name
  description: string;
  category: string;         // gap category
  applied: boolean;
  priority: 'low' | 'medium' | 'high';
}

// --- Agent Communication ---

export interface GapReport {
  iteration: number;
  gaps: Gap[];
  completion: 'success' | 'partial' | 'failed';
  blockers: string[];
}

export interface Gap {
  category: string;
  description: string;
  location: string;         // file path or section
  severity: 'minor' | 'major' | 'critical';
  suggested_fix?: string;
}

export interface FixResult {
  gaps_fixed: number;
  files_modified: string[];
  files_created: string[];
  new_categories: string[];
  difficult_types: string[];
}
