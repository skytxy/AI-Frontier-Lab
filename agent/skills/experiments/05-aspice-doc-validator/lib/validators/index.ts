/**
 * ASPICE Validator - Level 1 (Required Fields)
 *
 * Validates that all required fields and sections are present and non-empty.
 */

import type { Issue } from './types.js';

export interface TemplateField {
  label: string;
  required: boolean;
  pattern?: string;
}

export interface TemplateSection {
  label: string;
  required: boolean;
  fields?: Record<string, TemplateField>;
  min_rows?: number;
  min_content_length?: number;
  subsections?: string[];
}

export interface TemplateConfig {
  name: string;
  aspice_level: number;
  sections: {
    cover?: TemplateSection;
    change_log?: TemplateSection;
    [key: string]: TemplateSection | undefined;
  };
}

export interface SheetData {
  [key: string]: {
    text: string;
    raw: any;
    row: number;
    col: number;
    label?: string;
  };
}

export interface ParsedDocument {
  sheets: Record<string, SheetData>;
  metadata: {
    version?: string;
    project_id?: string;
    aspice_levels?: number[];
    asil_levels?: string[];
    cal_levels?: number[];
  };
}

/**
 * Level 1 validation: Check required fields and sections
 */
export async function validateLevel1(
  doc: ParsedDocument,
  template: TemplateConfig
): Promise<Issue[]> {
  const issues: Issue[] = [];

  // Check cover page
  if (template.sections.cover) {
    issues.push(...checkCoverFields(doc, template.sections.cover));
  }

  // Check change log
  if (template.sections.change_log) {
    issues.push(...checkChangeLog(doc, template.sections.change_log));
  }

  // Check required sections
  issues.push(...checkRequiredSections(doc, template));

  return issues;
}

function checkCoverFields(doc: ParsedDocument, coverDef: TemplateSection): Issue[] {
  const issues: Issue[] = [];
  const cover = doc.sheets['封面'];

  if (!cover) {
    return [{
      severity: 'critical',
      category: 'missing_section',
      location: '封面',
      message: '封面页不存在'
    }];
  }

  if (!coverDef.fields) return issues;

  for (const [fieldId, fieldDef] of Object.entries(coverDef.fields)) {
    if (fieldDef.required) {
      const value = findCellValue(cover, fieldDef.label);
      if (!value || value.trim() === '') {
        issues.push({
          severity: 'critical',
          category: 'missing_required_field',
          location: '封面',
          message: `缺少必填字段: ${fieldDef.label}`,
          field: fieldId
        });
      }
    }
  }

  return issues;
}

function checkChangeLog(doc: ParsedDocument, changeLogDef: TemplateSection): Issue[] {
  const issues: Issue[] = [];
  const changeLog = doc.sheets['变更履历'];

  if (!changeLog) {
    return [{
      severity: 'critical',
      category: 'missing_section',
      location: '变更履历',
      message: '变更履历表不存在'
    }];
  }

  const rowCount = countDataRows(changeLog);
  const minRows = changeLogDef.min_rows || 1;

  if (rowCount < minRows) {
    issues.push({
      severity: 'critical',
      category: 'insufficient_content',
      location: '变更履历',
      message: `变更履历至少需要 ${minRows} 条记录，当前只有 ${rowCount} 条`
    });
  }

  return issues;
}

function checkRequiredSections(doc: ParsedDocument, template: TemplateConfig): Issue[] {
  const issues: Issue[] = [];

  for (const [sectionId, sectionDef] of Object.entries(template.sections)) {
    if (sectionId.startsWith('section_')) {
      if (sectionDef.required) {
        const sheet = doc.sheets[sectionDef.label];
        if (!sheet) {
          issues.push({
            severity: 'critical',
            category: 'missing_section',
            location: sectionDef.label,
            message: `缺少必需章节: ${sectionDef.label}`
          });
        }
      }
    }
  }

  return issues;
}

function findCellValue(sheet: SheetData, label: string): string {
  for (const value of Object.values(sheet)) {
    if (value.label === label || (value.text && value.text.includes(label))) {
      return value.text;
    }
  }
  return '';
}

function countDataRows(sheet: SheetData): number {
  const rows = new Set<number>();
  for (const value of Object.values(sheet)) {
    if (value.row > 1 && value.text && value.text.trim() !== '') {
      rows.add(value.row);
    }
  }
  return rows.size;
}
