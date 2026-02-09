// .claude/skills/docwise/lib/artifact-generator.ts

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { LearnerArtifact } from './types.js';

export interface ArtifactData {
  scenarioId: string;
  scenarioDescription: string;
  chapterPath: string;
  complexity: 'simple' | 'medium' | 'complex';
  topics: string[];
  goals: string[];
  workflow: string[];
  topicResults: Array<{ topic: string; status: string; notes: string }>;
  gaps: Array<{ category: string; description: string; location: string; severity: string }>;
  blockers: string[];
  suggestions: string[];
  codeProducts?: Array<{ path: string; description: string }>;
  validationResults?: string;
}

export class ArtifactGenerator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Generate learner artifacts in sandbox
   */
  async generateArtifacts(
    sandboxPath: string,
    data: ArtifactData
  ): Promise<LearnerArtifact> {
    // Ensure directories exist
    const codeDir = join(sandboxPath, 'code');
    const validationDir = join(sandboxPath, 'validation');
    await mkdir(codeDir, { recursive: true });
    await mkdir(validationDir, { recursive: true });

    // Generate README.md
    const readmeContent = this.generateReadme(data);
    const readmePath = join(sandboxPath, 'README.md');
    await writeFile(readmePath, readmeContent, 'utf-8');

    // Generate learning-log.md
    const learningLogContent = this.generateLearningLog(data);
    const learningLogPath = join(sandboxPath, 'learning-log.md');
    await writeFile(learningLogPath, learningLogContent, 'utf-8');

    return {
      readme_path: readmePath,
      learning_log_path: learningLogPath,
      code_path: codeDir,
      validation_path: validationDir,
      scenario_id: data.scenarioId,
      timestamp: new Date().toISOString()
    };
  }

  private generateReadme(data: ArtifactData): string {
    const lines: string[] = [
      '# Docwise Validation Artifacts',
      '',
      '## Basic Information',
      '',
      `- **Chapter**: ${data.chapterPath}`,
      `- **Scenario ID**: ${data.scenarioId}`,
      `- **Timestamp**: ${new Date().toLocaleString()}`,
      `- **Complexity**: ${data.complexity}`,
      '',
      '## Scenario Description',
      '',
      data.scenarioDescription,
      '',
      '## Core Topics',
      '',
      ...this.formatList(data.topics),
      '',
      '## Goals',
      '',
      ...this.formatList(data.goals),
      '',
      '## Workflow',
      '',
      ...this.formatList(data.workflow),
      '',
      '## Issues Found',
      '',
    ];

    // Generate topics table
    lines.push('### Topic Coverage');
    lines.push('');
    lines.push('| Topic | Status | Notes |');
    lines.push('|------|--------|-------|');
    for (const result of data.topicResults) {
      lines.push(`| ${result.topic} | ${this.statusToEmoji(result.status)} | ${result.notes} |`);
    }
    lines.push('');

    // Generate gaps list
    if (data.gaps.length > 0) {
      lines.push('### Document Gaps');
      lines.push('');
      lines.push('| Severity | Category | Description | Location |');
      lines.push('|----------|----------|-------------|----------|');
      for (const gap of data.gaps) {
        lines.push(`| ${gap.severity} | ${gap.category} | ${gap.description} | ${gap.location} |`);
      }
      lines.push('');
    } else {
      lines.push('### Document Gaps');
      lines.push('');
      lines.push('No gaps found - document is complete!');
      lines.push('');
    }

    // Generate blockers
    if (data.blockers.length > 0) {
      lines.push('### Blockers');
      lines.push('');
      for (const blocker of data.blockers) {
        lines.push(`- ${blocker}`);
      }
      lines.push('');
    }

    // Generate suggestions
    if (data.suggestions.length > 0) {
      lines.push('## Suggestions for Improvement');
      lines.push('');
      for (const suggestion of data.suggestions) {
        lines.push(`- ${suggestion}`);
      }
      lines.push('');
    }

    // Generate code products
    if (data.codeProducts && data.codeProducts.length > 0) {
      lines.push('## Code Products');
      lines.push('');
      for (const product of data.codeProducts) {
        lines.push(`- \`${product.path}\` - ${product.description}`);
      }
      lines.push('');
    }

    // Validation results
    lines.push('## Validation Results');
    lines.push('');
    lines.push(data.validationResults || 'Validation completed successfully');
    lines.push('');

    return lines.join('\n');
  }

  private generateLearningLog(data: ArtifactData): string {
    const lines: string[] = [
      '# Learning Log',
      '',
      `**Scenario**: ${data.scenarioDescription}`,
      `**Chapter**: ${data.chapterPath}`,
      `**Complexity**: ${data.complexity}`,
      '',
      '## Topics to Validate',
      '',
      ...this.formatList(data.topics),
      '',
      '## Execution Process',
      '',
      '### Iteration 1: Initial Documentation Read',
      '',
      '- **Time**: Started at ' + new Date().toLocaleString(),
      '- **Approach**: Zero-knowledge reading of documentation',
      '- **Findings**:',
      '',
    ];

    // Add findings from topic results
    for (const result of data.topicResults) {
      lines.push(`  - ${result.topic}: ${result.notes}`);
    }
    lines.push('');

    // Add gaps section
    lines.push('### Gaps Identified');
    lines.push('');
    if (data.gaps.length === 0) {
      lines.push('- No gaps identified - documentation is complete');
    } else {
      for (const gap of data.gaps) {
        lines.push(`- [${gap.severity}] ${gap.description} at ${gap.location}`);
      }
    }
    lines.push('');

    // Add blockers section
    if (data.blockers.length > 0) {
      lines.push('### Blockers Encountered');
      lines.push('');
      for (const blocker of data.blockers) {
        lines.push(`- ${blocker}`);
      }
      lines.push('');
    }

    // Add key learnings section
    lines.push('## Key Learnings');
    lines.push('');
    lines.push('### What Worked Well');
    lines.push('');
    for (const result of data.topicResults.filter(r => r.status === 'success' || r.status === 'complete')) {
      lines.push(`- ${result.topic}`);
    }
    lines.push('');

    lines.push('### What Was Challenging');
    lines.push('');
    if (data.gaps.length > 0) {
      for (const gap of data.gaps.filter(g => g.severity === 'critical' || g.severity === 'major')) {
        lines.push(`- ${gap.description}`);
      }
    } else {
      lines.push('- No significant challenges encountered');
    }
    lines.push('');

    lines.push('### Suggestions for Documentation');
    lines.push('');
    for (const suggestion of data.suggestions) {
      lines.push(`- ${suggestion}`);
    }
    lines.push('');

    return lines.join('\n');
  }

  private formatList(items: string[]): string[] {
    return items.map((item, i) => `${i + 1}. ${item}`);
  }

  private statusToEmoji(status: string): string {
    if (status === 'success' || status === 'complete') return '✅';
    if (status === 'partial') return '⚠️';
    if (status === 'failed' || status === 'blocked') return '❌';
    return '❓';
  }

  /**
   * Generate validation report summary
   */
  generateValidationReport(data: ArtifactData): string {
    const lines: string[] = [
      '# Validation Report',
      '',
      `**Chapter**: ${data.chapterPath}`,
      `**Scenario**: ${data.scenarioDescription}`,
      `**Status**: ${data.gaps.length === 0 ? 'PASSED' : 'NEEDS IMPROVEMENT'}`,
      '',
      '## Summary',
      '',
      `Topics covered: ${data.topicResults.length}`,
      `Gaps found: ${data.gaps.length}`,
      `Blockers: ${data.blockers.length}`,
      '',
      '## Gap Summary',
      '',
      `Critical: ${data.gaps.filter(g => g.severity === 'critical').length}`,
      `Major: ${data.gaps.filter(g => g.severity === 'major').length}`,
      `Minor: ${data.gaps.filter(g => g.severity === 'minor').length}`,
      '',
    ];

    return lines.join('\n');
  }
}
