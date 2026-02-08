// .claude/skills/docwise/lib/mode-recommender.ts

import type {
  CollaborationMode,
  WorkMode,
  ScenarioSignature,
  ChapterConfig,
} from './types.js';
import type { ExperienceStore } from './experience-store.js';

export interface ModeRecommendation {
  mode: CollaborationMode;
  confidence: number;
  source: 'experience' | 'config' | 'heuristic';
  reasoning: string;
}

/**
 * Mode Recommender - decides which collaboration mode to use.
 *
 * Priority order:
 * 1. Config override (user explicitly set collaboration_mode)
 * 2. Experience match (high confidence pattern from store)
 * 3. Heuristic fallback (rules based on work mode and content type)
 */
export class ModeRecommender {
  constructor(private experienceStore: ExperienceStore) {}

  recommend(
    workMode: WorkMode,
    scenario: string,
    chapterConfig: ChapterConfig
  ): ModeRecommendation {
    // 1. Config override takes precedence
    if (chapterConfig.collaboration_mode) {
      return {
        mode: chapterConfig.collaboration_mode,
        confidence: 1.0,
        source: 'config',
        reasoning: `Config explicitly sets collaboration_mode to ${chapterConfig.collaboration_mode}`,
      };
    }

    // 2. Experience-based recommendation
    const signature = this.buildSignature(workMode, scenario, chapterConfig);
    const experienceMatch = this.experienceStore.recommend(signature);

    if (experienceMatch && experienceMatch.confidence > 0.6) {
      const p = experienceMatch.pattern;
      return {
        mode: p.recommended_mode,
        confidence: experienceMatch.confidence,
        source: 'experience',
        reasoning: `Experience pattern "${p.id}" (${p.stats.usage_count} uses, ${(p.stats.success_rate * 100).toFixed(0)}% success) recommends ${p.recommended_mode}`,
      };
    }

    // 3. Heuristic fallback
    return this.heuristicRecommend(workMode, chapterConfig);
  }

  /**
   * Build a scenario signature for experience matching.
   */
  private buildSignature(
    workMode: WorkMode,
    scenario: string,
    config: ChapterConfig
  ): ScenarioSignature {
    return {
      content_type: config.type || 'general',
      complexity: this.estimateComplexity(scenario, config),
      keywords: this.extractKeywords(scenario),
      work_mode: workMode,
    };
  }

  private estimateComplexity(scenario: string, config: ChapterConfig): 'low' | 'medium' | 'high' {
    const lower = scenario.toLowerCase();
    if (lower.match(/paper|arxiv|math|formula|proof|derivation|reproduce/)) return 'high';
    if (lower.match(/integration|api|protocol|implementation/)) return 'medium';
    if (lower.match(/setup|quickstart|hello|basic|simple/)) return 'low';
    // Default based on content type
    if (config.type === 'academic_paper') return 'high';
    return 'medium';
  }

  private extractKeywords(scenario: string): string[] {
    return scenario
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 10);
  }

  private heuristicRecommend(workMode: WorkMode, config: ChapterConfig): ModeRecommendation {
    let mode: CollaborationMode;
    let reasoning: string;

    switch (workMode) {
      case 'generate':
        mode = 'dual-agent';
        reasoning = 'Generate mode defaults to dual-agent (Author generates, Learner validates)';
        break;
      case 'optimize':
        mode = 'dual-agent';
        reasoning = 'Optimize mode defaults to dual-agent (Author improves, Learner re-validates)';
        break;
      case 'validate':
      default:
        if (config.type === 'academic_paper') {
          mode = 'triple-agent';
          reasoning = 'Academic papers default to triple-agent for math/formula verification';
        } else {
          mode = 'dual-agent';
          reasoning = 'Standard validation defaults to dual-agent (Learner + Author)';
        }
        break;
    }

    return { mode, confidence: 0.5, source: 'heuristic', reasoning };
  }
}
