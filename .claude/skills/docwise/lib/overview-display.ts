// .claude/skills/docwise/lib/overview-display.ts

import { ConfigLoader } from './config-loader.js';

export class OverviewDisplay {
  private config: ConfigLoader;

  constructor(projectRoot: string) {
    this.config = new ConfigLoader(projectRoot);
  }

  /**
   * Generate overview for display
   * For :new: use WebSearch
   * For :check/:improve: use existing doc
   */
  async generateOverview(
    chapterPath: string,
    subcommand: 'new' | 'check' | 'improve'
  ): Promise<{ what_is: string; what_for: string[] }> {
    const overview = this.config.loadChapterOverview(chapterPath);

    if (subcommand === 'new') {
      // Would use WebSearch here
      return {
        what_is: await this.searchWhatIs(chapterPath),
        what_for: await this.searchWhatFor(chapterPath)
      };
    }

    // Use existing doc
    return {
      what_is: overview?.what_is || 'Unknown topic',
      what_for: overview?.what_for || []
    };
  }

  private async searchWhatIs(chapterPath: string): Promise<string> {
    // Placeholder for WebSearch integration
    // In real implementation, would use WebSearch skill
    return `${this.extractTopicName(chapterPath)} - Topic description from web search`;
  }

  private async searchWhatFor(chapterPath: string): Promise<string[]> {
    // Placeholder for WebSearch integration
    return ['Use case 1', 'Use case 2', 'Use case 3'];
  }

  private extractTopicName(chapterPath: string): string {
    const parts = chapterPath.split('/');
    return parts[parts.length - 1].replace(/-/g, ' ');
  }

  /**
   * Format overview for display
   */
  formatForDisplay(overview: { what_is: string; what_for: string[] }): string {
    return `
📋 技术概览
─────────────────────────────────
【是什么】
${overview.what_is}

【有什么用】
${overview.what_for.map((use, i) => `${i + 1}. ${use}`).join('\n')}
`;
  }

  /**
   * Format completed warning
   */
  formatCompletedWarning(): string {
    return `
⚠️  该文档状态为 "completed"（里程碑冻结）
   执行 improve/check 将会更改文档状态和内容

   确认继续? [Y/n]
`;
  }
}
