/**
 * Code Review Prompt Template
 *
 * Provides a structured prompt for code review tasks with:
 * - Predefined review criteria
 * - Configurable focus areas
 * - File context inclusion
 */

import { z } from 'zod';
import { promises as fs } from 'fs';
import { join, isAbsolute } from 'path';

// #region Schema Definition

export const CodeReviewPromptSchema = z.object({
  filePath: z.string().describe('Path to the file to review (absolute or relative)'),
  focusAreas: z.array(z.enum([
    'correctness',
    'performance',
    'security',
    'maintainability',
    'testing',
    'documentation',
  ])).default(['correctness', 'maintainability']).describe('Review focus areas'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium').describe('Minimum severity to report'),
  includeFileContent: z.boolean().default(true).describe('Include file content in the prompt'),
});

export type CodeReviewPromptInput = z.infer<typeof CodeReviewPromptSchema>;

// #endregion

// #region Implementation

export class CodeReviewPrompt {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  async getPrompt(input: CodeReviewPromptInput): Promise<{
    messages: Array<{
      role: 'user';
      content: {
        type: 'text';
        text: string;
      };
    }>;
  }> {
    const filePath = isAbsolute(input.filePath) ? input.filePath : join(this.rootPath, input.filePath);

    let fileContent = '';
    if (input.includeFileContent) {
      try {
        fileContent = await fs.readFile(filePath, 'utf-8');
      } catch (error) {
        throw new Error(`Failed to read file: ${error}`);
      }
    }

    const prompt = this.buildPrompt(filePath, fileContent, input);

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: prompt,
          },
        },
      ],
    };
  }

  private buildPrompt(filePath: string, fileContent: string, input: CodeReviewPromptInput): string {
    const focusAreaDescriptions = {
      correctness: '逻辑正确性、边界条件、错误处理',
      performance: '性能优化、资源使用、算法复杂度',
      security: '安全漏洞、输入验证、权限检查',
      maintainability: '代码可读性、命名规范、模块化',
      testing: '测试覆盖、测试质量、边缘情况',
      documentation: '注释质量、文档完整性、API 文档',
    };

    const focusAreasText = input.focusAreas
      .map((area) => `- **${area}**: ${focusAreaDescriptions[area]}`)
      .join('\n');

    return `# Code Review Request

## File: ${filePath}

Please review this file with the following focus areas:
${focusAreasText}

**Minimum severity level:** ${input.severity.toUpperCase()}

${fileContent ? `
## File Content

\`\`\`
${fileContent}
\`\`\`
` : ''}

## Review Guidelines

Please provide a structured review with:

1. **Summary**: Brief overview of the code's purpose and overall quality

2. **Issues Found**: List each issue with:
   - Severity level (CRITICAL/HIGH/MEDIUM/LOW)
   - Line number reference
   - Description of the problem
   - Suggested fix

3. **Positive Aspects**: Highlight well-written sections

4. **Recommendations**: Actionable suggestions for improvement

5. **Risk Assessment**: Potential risks if this code is deployed as-is

Please be thorough but focus on the most important issues first.`;
  }
}

// #endregion
