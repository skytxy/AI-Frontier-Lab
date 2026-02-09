/**
 * Main validator implementation
 */

import * as XLSX from 'xlsx';
import type { ValidationResult, Issue, TemplateConfig, ParsedDocument } from './types.js';
import { validateLevel1 } from './validators/index.js';

export class ASPICEValidator {
  /**
   * Parse Excel document
   */
  parseDocument(docPath: string): ParsedDocument {
    const workbook = XLSX.readFile(docPath);
    const sheets: ParsedDocument['sheets'] = {};
    const metadata: ParsedDocument['metadata'] = {};

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData: ParsedDocument['sheets'][string] = {};
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];

          if (cell && cell.v !== undefined) {
            const key = `${row}-${col}`;
            sheetData[key] = {
              raw: cell.v,
              text: String(cell.v),
              row: row + 1,
              col: col + 1,
              label: this.getHeaderLabel(worksheet, col)
            };
          }
        }
      }

      sheets[sheetName] = sheetData;

      if (sheetName === '封面') {
        this.extractMetadata(sheetData, metadata);
      }
    }

    return { sheets, metadata };
  }

  private getHeaderLabel(worksheet: any, col: number): string {
    const headerAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const headerCell = worksheet[headerAddress];
    return headerCell ? String(headerCell.v) : '';
  }

  private extractMetadata(sheetData: ParsedDocument['sheets'][string], metadata: any): void {
    for (const value of Object.values(sheetData)) {
      if (!value.label) continue;

      const label = value.label as string;
      const text = value.text;

      if (label.includes('项目编号')) metadata.project_id = text;
      if (label.includes('文件编号')) metadata.file_id = text;
      if (label.includes('版本')) metadata.version = text;
    }
  }

  /**
   * Validate document at specified level
   */
  async validate(docPath: string, template: TemplateConfig, level: number = 1): Promise<ValidationResult> {
    const startTime = Date.now();
    const doc = this.parseDocument(docPath);
    const issues: Issue[] = [];

    if (level >= 1) {
      issues.push(...await validateLevel1(doc, template));
    }

    // Levels 2-4 would be added here in full implementation

    const duration = Date.now() - startTime;

    const by_severity: Record<string, number> = {
      critical: 0,
      important: 0,
      minor: 0
    };

    for (const issue of issues) {
      by_severity[issue.severity]++;
    }

    return {
      passed: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
      summary: {
        total: issues.length,
        by_severity: by_severity as any,
        duration_ms: duration
      }
    };
  }

  /**
   * Generate markdown report
   */
  generateReport(result: ValidationResult, docPath: string): string {
    const lines: string[] = [];

    lines.push('# ASPICE 文档验证报告\n');
    lines.push(`**状态**: ${result.passed ? '通过' : '失败'}`);
    lines.push(`**文档**: ${docPath}`);
    lines.push(`**问题总数**: ${result.issues.length}\n`);

    const critical = result.issues.filter(i => i.severity === 'critical');
    const important = result.issues.filter(i => i.severity === 'important');
    const minor = result.issues.filter(i => i.severity === 'minor');

    if (critical.length > 0) {
      lines.push('## 严重问题 (必须修复)\n');
      for (const issue of critical) {
        lines.push(`- [${issue.location}] ${issue.message}`);
      }
      lines.push('');
    }

    if (important.length > 0) {
      lines.push('## 重要问题 (建议修复)\n');
      for (const issue of important) {
        lines.push(`- [${issue.location}] ${issue.message}`);
      }
      lines.push('');
    }

    if (minor.length > 0) {
      lines.push('## 次要问题\n');
      for (const issue of minor) {
        lines.push(`- [${issue.location}] ${issue.message}`);
      }
    }

    return lines.join('\n');
  }
}
