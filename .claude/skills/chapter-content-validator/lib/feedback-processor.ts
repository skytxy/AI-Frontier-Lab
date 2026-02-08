/**
 * Feedback Processor - 分层级反馈处理机制
 *
 * 根据反馈的影响范围自动分类并应用更新：
 * - Level 1-2: 章节内容/配置，直接修改
 * - Level 3-4: 范式文档/Skill代码，记录建议等待确认
 */

export interface FeedbackItem {
  category: string;
  description: string;
  source: 'learner' | 'author';
  severity: 'low' | 'medium' | 'high';
}

export interface LearnerFeedback {
  /** 场景执行完成度 (0-100) */
  completion: number;
  /** 卡住的步骤 */
  blockers: string[];
  /** 缺失的知识点 */
  missingKnowledge: string[];
  /** 提示词清晰度评分 (1-5) */
  promptClarity: number;
  /** 其他反馈 */
  other: FeedbackItem[];
}

export interface AuthorFeedback {
  /** 成功修复的缺口数量 */
  gapsFixed: number;
  /** 修复困难的缺口类型 */
  difficultGapTypes: string[];
  /** 需要的新缺口类型 */
  newGapCategories: string[];
  /** 其他反馈 */
  other: FeedbackItem[];
}

export interface FeedbackLevel {
  level: 1 | 2 | 3 | 4;
  name: string;
  target: string;
  scope: string;
  action: 'apply' | 'record';
}

export interface ProcessedFeedback {
  iteration: number;
  scenario: string;
  timestamp: string;

  /** 直接应用的修改 (Level 1-2) */
  appliedUpdates: UpdateAction[];

  /** 记录的建议 (Level 3-4) */
  suggestions: Suggestion[];
}

export interface UpdateAction {
  file: string;
  action: 'create' | 'modify' | 'delete';
  description: string;
  diff?: string;
}

export interface Suggestion {
  target: string;
  category: string;
  description: string;
  rationale: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * 反馈级别定义
 */
const FEEDBACK_LEVELS: FeedbackLevel[] = [
  {
    level: 1,
    name: '章节内容',
    target: 'concepts/*.md, experiments/*/README.md',
    scope: '单章节',
    action: 'apply',
  },
  {
    level: 2,
    name: '章节配置',
    target: '.chapter-validator.yaml',
    scope: '单章节',
    action: 'apply',
  },
  {
    level: 3,
    name: '范式文档',
    target: 'docs/frameworks/chapter-validation-paradigm.md',
    scope: '跨章节',
    action: 'record',
  },
  {
    level: 4,
    name: 'Skill 代码',
    target: '.claude/skills/chapter-content-validator/',
    scope: '全局',
    action: 'record',
  },
];

/**
 * 反馈分类规则
 */
interface ClassificationRule {
  keywords: string[];
  targetLevel: 1 | 2 | 3 | 4;
  targetCategory: string;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  // Level 1: 章节内容
  {
    keywords: ['概念缺失', '步骤不清', '代码示例', 'concepts/', 'experiments/', 'README'],
    targetLevel: 1,
    targetCategory: 'content',
  },
  // Level 2: 章节配置
  {
    keywords: ['验证标准', '场景定义', 'prerequisites', '.chapter-validator.yaml'],
    targetLevel: 2,
    targetCategory: 'config',
  },
  // Level 3: 范式文档
  {
    keywords: ['新缺口类型', '范式', '最佳实践', '跨章节', '通用方法'],
    targetLevel: 3,
    targetCategory: 'paradigm',
  },
  // Level 4: Skill 代码
  {
    keywords: ['提示词', '约束不清', '流程优化', 'lib/*.ts', 'skill.md'],
    targetLevel: 4,
    targetCategory: 'skill',
  },
];

export class FeedbackProcessor {
  private chapterPath: string;
  private processed: ProcessedFeedback[] = [];

  constructor(chapterPath: string) {
    this.chapterPath = chapterPath;
  }

  /**
   * 分析并分类 Learner 反馈
   */
  analyzeLearnerFeedback(feedback: LearnerFeedback): FeedbackLevel[] {
    const levels: FeedbackLevel[] = [];

    // 检查提示词清晰度
    if (feedback.promptClarity < 3) {
      levels.push({
        level: 4,
        name: 'Skill 代码',
        target: 'skill.md',
        scope: '全局',
        action: 'record',
      });
    }

    // 检查缺失的知识
    for (const missing of feedback.missingKnowledge) {
      const level = this.classifyFeedback(missing);
      if (!levels.find(l => l.level === level.level)) {
        levels.push(level);
      }
    }

    // 检查阻塞点
    for (const blocker of feedback.blockers) {
      const level = this.classifyFeedback(blocker);
      if (!levels.find(l => l.level === level.level)) {
        levels.push(level);
      }
    }

    // 处理其他反馈
    for (const item of feedback.other) {
      const level = this.classifyFeedback(item.description);
      if (!levels.find(l => l.level === level.level)) {
        levels.push(level);
      }
    }

    return levels;
  }

  /**
   * 分析并分类 Author 反馈
   */
  analyzeAuthorFeedback(feedback: AuthorFeedback): FeedbackLevel[] {
    const levels: FeedbackLevel[] = [];

    // 新缺口类型 -> Level 3
    for (const category of feedback.newGapCategories) {
      levels.push(FEEDBACK_LEVELS[2]); // Level 3: 范式文档
    }

    // 修复困难 -> 可能是 Level 4 (需要更好的工具)
    if (feedback.difficultGapTypes.length > 0) {
      levels.push(FEEDBACK_LEVELS[3]); // Level 4: Skill 代码
    }

    return levels;
  }

  /**
   * 根据关键词分类反馈
   */
  private classifyFeedback(text: string): FeedbackLevel {
    const lowerText = text.toLowerCase();

    // 按优先级匹配规则
    for (const rule of CLASSIFICATION_RULES) {
      for (const keyword of rule.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return FEEDBACK_LEVELS[rule.targetLevel - 1];
        }
      }
    }

    // 默认为 Level 1
    return FEEDBACK_LEVELS[0];
  }

  /**
   * 处理单次迭代的反馈
   */
  async processIteration(
    iteration: number,
    scenario: string,
    learnerFeedback: LearnerFeedback,
    authorFeedback: AuthorFeedback
  ): Promise<ProcessedFeedback> {
    const result: ProcessedFeedback = {
      iteration,
      scenario,
      timestamp: new Date().toISOString(),
      appliedUpdates: [],
      suggestions: [],
    };

    // 分析 Learner 反馈
    const learnerLevels = this.analyzeLearnerFeedback(learnerFeedback);

    // 分析 Author 反馈
    const authorLevels = this.analyzeAuthorFeedback(authorFeedback);

    // 合并级别并去重
    const allLevels = [...learnerLevels, ...authorLevels];
    const uniqueLevels = Array.from(
      new Map(allLevels.map(l => [l.level, l])).values()
    );

    // 处理每个级别
    for (const level of uniqueLevels) {
      if (level.action === 'apply') {
        // Level 1-2: 直接应用
        const updates = await this.generateUpdates(level, learnerFeedback, authorFeedback);
        result.appliedUpdates.push(...updates);
      } else {
        // Level 3-4: 记录建议
        const suggestions = this.generateSuggestions(level, learnerFeedback, authorFeedback);
        result.suggestions.push(...suggestions);
      }
    }

    this.processed.push(result);
    return result;
  }

  /**
   * 生成直接应用的更新
   */
  private async generateUpdates(
    level: FeedbackLevel,
    learnerFeedback: LearnerFeedback,
    authorFeedback: AuthorFeedback
  ): Promise<UpdateAction[]> {
    const updates: UpdateAction[] = [];

    if (level.level === 1) {
      // 章节内容更新
      for (const missing of learnerFeedback.missingKnowledge) {
        updates.push({
          file: this.inferTargetFile(missing),
          action: 'modify',
          description: `补充知识: ${missing}`,
        });
      }
    } else if (level.level === 2) {
      // 章节配置更新
      // 这类更新通常由 Author 根据实际情况决定
    }

    return updates;
  }

  /**
   * 生成建议
   */
  private generateSuggestions(
    level: FeedbackLevel,
    learnerFeedback: LearnerFeedback,
    authorFeedback: AuthorFeedback
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];

    if (level.level === 3) {
      // 范式文档建议
      for (const category of authorFeedback.newGapCategories) {
        suggestions.push({
          target: 'docs/frameworks/chapter-validation-paradigm.md',
          category: 'new_gap_type',
          description: `添加新缺口类型: ${category}`,
          rationale: `Author 在修复过程中发现了新的缺口类型`,
          priority: 'medium',
          status: 'pending',
        });
      }
    } else if (level.level === 4) {
      // Skill 代码建议
      if (learnerFeedback.promptClarity < 3) {
        suggestions.push({
          target: 'skill.md',
          category: 'prompt_improvement',
          description: '优化 Learner 约束描述',
          rationale: `Learner 评分提示词清晰度为 ${learnerFeedback.promptClarity}/5`,
          priority: 'high',
          status: 'pending',
        });
      }
    }

    return suggestions;
  }

  /**
   * 推断目标文件
   */
  private inferTargetFile(missingKnowledge: string): string {
    // 根据缺失知识的描述推断应该更新哪个文件
    const lower = missingKnowledge.toLowerCase();

    if (lower.includes('stdio') || lower.includes('传输')) {
      return 'concepts/stdio-transport.md';
    }
    if (lower.includes('json-rpc') || lower.includes('协议')) {
      return 'concepts/json-rpc.md';
    }
    if (lower.includes('zod') || lower.includes('schema')) {
      return 'experiments/02-mcp-server/README.md';
    }

    // 默认返回 concepts 目录
    return 'concepts/new-concept.md';
  }

  /**
   * 生成 validation-log.md 内容
   */
  generateValidationLog(): string {
    const lines: string[] = [];

    lines.push('# Chapter Validation Log');
    lines.push('');
    lines.push(`> 本文件由 Chapter Content Validator 自动生成`);
    lines.push(`> 生成时间: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    for (const processed of this.processed) {
      lines.push(`## Iteration ${processed.iteration}: ${processed.scenario}`);
      lines.push('');
      lines.push(`**时间**: ${new Date(processed.timestamp).toLocaleString('zh-CN')}`);
      lines.push('');

      // 直接应用的修改
      if (processed.appliedUpdates.length > 0) {
        lines.push('### 直接应用的修改 (Level 1-2)');
        lines.push('');
        for (const update of processed.appliedUpdates) {
          lines.push(`- [x] ${update.file}: ${update.description}`);
        }
        lines.push('');
      }

      // 记录的建议
      if (processed.suggestions.length > 0) {
        lines.push('### 记录的建议 (Level 3-4)');
        lines.push('');
        for (const suggestion of processed.suggestions) {
          lines.push(`- [ ] ${suggestion.target}: ${suggestion.description}`);
          lines.push(`  - 分类: ${suggestion.category}`);
          lines.push(`  - 原因: ${suggestion.rationale}`);
          lines.push(`  - 优先级: ${suggestion.priority}`);
        }
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }

    // 汇总统计
    lines.push('## 汇总统计');
    lines.push('');
    lines.push(`总迭代次数: ${this.processed.length}`);
    lines.push(`直接应用的修改: ${this.processed.reduce((sum, p) => sum + p.appliedUpdates.length, 0)}`);
    lines.push(`记录的建议: ${this.processed.reduce((sum, p) => sum + p.suggestions.length, 0)}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * 生成摘要
   */
  getSummary(): string {
    const lines: string[] = [];

    lines.push('## 验证完成');
    lines.push('');

    const totalApplied = this.processed.reduce((sum, p) => sum + p.appliedUpdates.length, 0);
    const totalSuggestions = this.processed.reduce((sum, p) => sum + p.suggestions.length, 0);

    if (totalApplied > 0) {
      lines.push('### 直接应用的修改 (Level 1-2)');
      for (const processed of this.processed) {
        for (const update of processed.appliedUpdates) {
          lines.push(`- [x] ${update.file}: ${update.description}`);
        }
      }
      lines.push('');
    }

    if (totalSuggestions > 0) {
      lines.push('### 记录的建议 (Level 3-4)');
      for (const processed of this.processed) {
        for (const suggestion of processed.suggestions) {
          lines.push(`- [ ] ${suggestion.target}: ${suggestion.description}`);
        }
      }
      lines.push('');
      lines.push('### 查看详情');
      lines.push(`运行 /chapter-content-validator --review=iteration-${this.processed.length} 查看建议详情并决定是否应用`);
    }

    return lines.join('\n');
  }
}
