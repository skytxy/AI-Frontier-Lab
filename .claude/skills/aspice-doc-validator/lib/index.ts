/**
 * ASPICE Document Validator - Main Entry Point
 *
 * Validates ASPICE-compliant automotive software documentation
 * against template requirements.
 */

import XLSX from 'xlsx';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import type {
  ValidationResult,
  TemplateConfig,
  ParsedDocument,
  ValidationOptions,
  Issue
} from './types.js';

import { validateLevel1 } from './validators/level1.js';
import { validateLevel2 } from './validators/level2.js';
import { validateLevel3 } from './validators/level3.js';
import { validateLevel4 } from './validators/level4.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main validator class
 */
export class ASPICEValidator {
  private templateDir: string;

  constructor(templateDir?: string) {
    this.templateDir = templateDir || path.join(__dirname, 'templates');
  }

  /**
   * Load a template configuration
   */
  async loadTemplate(nameOrPath: string): Promise<TemplateConfig> {
    const templatePath = nameOrPath.startsWith('/')
      ? nameOrPath
      : path.join(this.templateDir, `${nameOrPath}.yaml`);

    const content = await fs.promises.readFile(templatePath, 'utf-8');
    return yaml.load(content) as TemplateConfig;
  }

  /**
   * Parse a document (Excel format)
   */
  async parseDocument(docPath: string): Promise<ParsedDocument> {
    const workbook = XLSX.readFile(docPath);
    const sheets: Record<string, Record<string, any>> = {};
    const metadata: any = {};

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData: Record<string, any> = {};
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
              label: this.getHeaderLabel(worksheet, col, row)
            };
          }
        }
      }

      sheets[sheetName] = sheetData;

      // Extract metadata from cover
      if (sheetName === '封面') {
        Object.assign(metadata, this.extractMetadata(sheetData));
      }
    }

    return {
      format: 'xlsx',
      sheets,
      metadata
    };
  }

  /**
   * Extract metadata from cover sheet
   */
  private extractMetadata(coverData: Record<string, any>): any {
    const metadata: any = {};

    for (const value of Object.values(coverData)) {
      const v = value as any;
      if (!v.label) continue;

      const label = v.label as string;
      const text = v.text;

      if (label.includes('项目编号')) metadata.project_id = text;
      if (label.includes('文件编号')) metadata.file_id = text;
      if (label.includes('版本')) metadata.version = text;

      if (label.includes('ASPICE')) {
        metadata.aspice_levels = this.parseLevels(text, /ASPICE-([1-5])/g);
      }
      if (label.includes('ASIL')) {
        metadata.asil_levels = this.parseLevels(text, /ASIL-([ABCD])/g);
      }
      if (label.includes('CAL')) {
        metadata.cal_levels = this.parseLevels(text, /CAL-([1-4])/g);
      }
    }

    return metadata;
  }

  /**
   * Parse level declarations from text
   */
  private parseLevels(text: string, pattern: RegExp): number[] | string[] {
    const matches = text.match(pattern);
    if (!matches) return [];

    return matches.map(m => {
      const match = m.match(/(\d+|[ABCD])$/);
      return match ? match[1] : '';
    }).filter(Boolean);
  }

  /**
   * Get header label for a column
   */
  private getHeaderLabel(worksheet: any, col: number, currentRow: number): string {
    // Look at row 0 for headers
    const headerAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const headerCell = worksheet[headerAddress];
    return headerCell ? String(headerCell.v) : '';
  }

  /**
   * Validate a document
   */
  async validate(options: ValidationOptions): Promise<ValidationResult> {
    const startTime = Date.now();

    // Load template
    const template = await this.loadTemplate(options.template);

    // Parse document
    const doc = await this.parseDocument(options.document);

    // Run validations
    const issues: Issue[] = [];
    const levels = options.level === 'all' ? [1, 2, 3, 4] : [options.level as number];

    for (const level of levels) {
      switch (level) {
        case 1:
          issues.push(...await validateLevel1(doc, template));
          break;
        case 2:
          issues.push(...await validateLevel2(doc, template));
          break;
        case 3:
          issues.push(...await validateLevel3(doc, template));
          break;
        case 4:
          issues.push(...await validateLevel4(doc, template));
          break;
      }
    }

    const duration = Date.now() - startTime;

    return {
      passed: issues.filter(i => i.severity === 'critical').length === 0,
      document: options.document,
      template: options.template,
      aspice_level: options.aspice_level || template.aspice_level,
      issues,
      summary: this.generateSummary(issues, duration),
      validated_at: new Date().toISOString()
    };
  }

  /**
   * Generate validation summary
   */
  private generateSummary(issues: Issue[], duration: number): any {
    const by_severity: Record<string, number> = {
      critical: 0,
      important: 0,
      minor: 0
    };

    const by_category: Record<string, number> = {};

    for (const issue of issues) {
      by_severity[issue.severity]++;
      by_category[issue.category] = (by_category[issue.category] || 0) + 1;
    }

    return {
      total: issues.length,
      by_severity,
      by_category,
      duration_ms: duration
    };
  }

  /**
   * Generate report in specified format
   */
  generateReport(result: ValidationResult, format: 'text' | 'json' | 'markdown'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(result, null, 2);

      case 'text':
        return this.generateTextReport(result);

      case 'markdown':
      default:
        return this.generateMarkdownReport(result);
    }
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push('# ASPICE 文档验证报告\n');
    lines.push(`**状态**: ${result.passed ? '通过' : '失败'}\n`);
    lines.push(`**文档**: ${result.document}\n`);
    lines.push(`**模板**: ${result.template}\n`);
    lines.push(`**ASPICE 等级**: ${result.aspice_level}\n`);
    lines.push(`**问题总数**: ${result.issues.length}\n`);

    const critical = result.issues.filter(i => i.severity === 'critical');
    const important = result.issues.filter(i => i.severity === 'important');
    const minor = result.issues.filter(i => i.severity === 'minor');

    if (critical.length > 0) {
      lines.push('## 严重问题 (必须修复)\n');
      for (const issue of critical) {
        lines.push(`- [${issue.location}] ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`  - 建议: ${issue.suggestion}`);
        }
      }
      lines.push('');
    }

    if (important.length > 0) {
      lines.push('## 重要问题 (建议修复)\n');
      for (const issue of important) {
        lines.push(`- [${issue.location}] ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`  - 建议: ${issue.suggestion}`);
        }
      }
      lines.push('');
    }

    if (minor.length > 0) {
      lines.push('## 次要问题\n');
      for (const issue of minor) {
        lines.push(`- [${issue.location}] ${issue.message}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate plain text report
   */
  private generateTextReport(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push('ASPICE 文档验证报告');
    lines.push('='.repeat(50));
    lines.push(`状态: ${result.passed ? '通过' : '失败'}`);
    lines.push(`文档: ${result.document}`);
    lines.push(`模板: ${result.template}`);
    lines.push(`问题总数: ${result.issues.length}`);
    lines.push('');

    const critical = result.issues.filter(i => i.severity === 'critical');
    const important = result.issues.filter(i => i.severity === 'important');
    const minor = result.issues.filter(i => i.severity === 'minor');

    if (critical.length > 0) {
      lines.push(`严重问题 (${critical.length})`);
      lines.push('-'.repeat(30));
      for (const issue of critical) {
        lines.push(`  [${issue.location}] ${issue.message}`);
      }
      lines.push('');
    }

    if (important.length > 0) {
      lines.push(`重要问题 (${important.length})`);
      lines.push('-'.repeat(30));
      for (const issue of important) {
        lines.push(`  [${issue.location}] ${issue.message}`);
      }
      lines.push('');
    }

    if (minor.length > 0) {
      lines.push(`次要问题 (${minor.length})`);
      lines.push('-'.repeat(30));
      for (const issue of minor) {
        lines.push(`  [${issue.location}] ${issue.message}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

/**
 * CLI entry point
 */
export async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: aspice-doc-validator <document.xlsx> [options]');
    console.log('Options:');
    console.log('  --template <name>   Template to use (default: cariad-sw-design)');
    console.log('  --level <1-4|all>   Validation level (default: all)');
    console.log('  --output <format>   Output format: text, json, markdown (default: markdown)');
    process.exit(1);
  }

  const documentPath = args[0];
  const template = args.includes('--template') ? args[args.indexOf('--template') + 1] : 'cariad-sw-design';
  const level = args.includes('--level') ? args[args.indexOf('--level') + 1] : 'all';
  const output = args.includes('--output') ? args[args.indexOf('--output') + 1] : 'markdown';

  const validator = new ASPICEValidator();
  const result = await validator.validate({
    document: documentPath,
    template,
    level: level === 'all' ? 'all' : parseInt(level),
    output: output as any,
    include_suggestions: true
  });

  const report = validator.generateReport(result, output as any);
  console.log(report);

  process.exit(result.passed ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
