// .claude/skills/docwise/lib/scenario-loader.ts

import { readFile } from 'fs/promises';
import { join } from 'path';
import { ConfigLoader } from './config-loader.js';
import type { ScenarioConfig, ChapterOverview } from './types.js';

export class ScenarioLoader {
  private config: ConfigLoader;

  constructor(projectRoot: string) {
    this.config = new ConfigLoader(projectRoot);
  }

  /**
   * Generate scenario based on chapter type, complexity, and search results
   */
  async generateScenario(
    chapterPath: string,
    complexity: 'simple' | 'medium' | 'complex',
    userScenario?: string,
    subcommand: 'new' | 'check' | 'improve' = 'check'
  ): Promise<ScenarioConfig> {
    const chapterType = this.inferChapterType(chapterPath);
    const overview = this.config.loadChapterOverview(chapterPath);

    // For :new, generate scenario from search only
    if (subcommand === 'new') {
      return this.generateScenarioFromSearch(chapterPath, complexity, userScenario);
    }

    // For :improve, combine existing doc with search
    if (subcommand === 'improve') {
      return this.generateScenarioFromDocAndSearch(chapterPath, complexity, userScenario);
    }

    // For :check, generate from search for coverage comparison
    return this.generateScenarioFromSearch(chapterPath, complexity, userScenario);
  }

  private inferChapterType(chapterPath: string): 'agent' | 'algo' {
    if (chapterPath.startsWith('agent/')) return 'agent';
    if (chapterPath.startsWith('algo/')) return 'algo';
    return 'agent'; // default
  }

  private async generateScenarioFromSearch(
    chapterPath: string,
    complexity: 'simple' | 'medium' | 'complex',
    userScenario?: string
  ): Promise<ScenarioConfig> {
    // WebSearch for practical examples
    const topicName = this.extractTopicName(chapterPath);
    const searchQuery = userScenario
      ? `${topicName} ${userScenario} implementation example`
      : `${topicName} tutorial examples best practices`;

    // This would use WebSearch skill - for now return template
    return this.createScenarioTemplate(chapterPath, complexity, userScenario);
  }

  private async generateScenarioFromDocAndSearch(
    chapterPath: string,
    complexity: 'simple' | 'medium' | 'complex',
    userScenario?: string
  ): Promise<ScenarioConfig> {
    // Read existing doc to identify gaps
    const existingDoc = await this.readExistingDoc(chapterPath);

    // Focus on gaps + search for best practices
    return this.createScenarioTemplate(chapterPath, complexity, userScenario);
  }

  private extractTopicName(chapterPath: string): string {
    // Extract topic name from path
    const parts = chapterPath.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.replace(/-/g, ' ');
  }

  private createScenarioTemplate(
    chapterPath: string,
    complexity: 'simple' | 'medium' | 'complex',
    userScenario?: string
  ): ScenarioConfig {
    const id = Date.now().toString();
    const name = userScenario || `${chapterPath} validation`;

    return {
      id,
      name,
      description: `Practical validation scenario for ${chapterPath}`,
      complexity,
      topics: this.generateTopicsForComplexity(chapterPath, complexity),
      goals: this.generateGoalsForComplexity(complexity),
      workflow: ['Read documentation', 'Follow steps', 'Verify outcome'],
    };
  }

  private generateTopicsForComplexity(
    chapterPath: string,
    complexity: 'simple' | 'medium' | 'complex'
  ): string[] {
    const topicName = this.extractTopicName(chapterPath);

    const topicsByComplexity: Record<string, string[]> = {
      simple: ['Basic concepts', 'Core functionality'],
      medium: ['Core functionality', 'Common patterns', 'Best practices'],
      complex: ['Core functionality', 'Advanced patterns', 'Edge cases', 'Performance optimization']
    };

    return topicsByComplexity[complexity] || topicsByComplexity.medium;
  }

  private generateGoalsForComplexity(complexity: 'simple' | 'medium' | 'complex'): string[] {
    const goalsByComplexity: Record<string, string[]> = {
      simple: ['Understand basic concepts', 'Complete simple task'],
      medium: ['Understand core functionality', 'Implement common patterns', 'Follow best practices'],
      complex: ['Master advanced features', 'Handle edge cases', 'Optimize performance']
    };

    return goalsByComplexity[complexity] || goalsByComplexity.medium;
  }

  private async readExistingDoc(chapterPath: string): Promise<string> {
    const readmePath = join(this.config['projectRoot'], chapterPath, 'README.md');
    // Implementation would read and analyze existing doc
    return '';
  }
}
