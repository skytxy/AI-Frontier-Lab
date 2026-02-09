/**
 * Level 2 Validator - Format Validation
 *
 * Validates that field values conform to expected formats:
 * - Version numbers (Vx.y pattern)
 * - Dates (YYYY-MM-DD)
 * - ASPICE/ASIL/CAL level selections
 * - Project codes and identifiers
 */

import type { Issue, ParsedDocument, TemplateConfig } from '../types.js';

/**
 * Common regex patterns for validation
 */
const PATTERNS = {
  version: /^V[0-9]+\.[0-9]+$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  projectCode: /^[A-Z0-9]+$/,
  fileId: /^[A-Z]{2}-[A-Z0-9]+-[0-9]+-[0-9]+$/,
  aspiceLevel: /^ASPICE-[1-5]$/,
  asilLevel: /^ASIL-[ABCD]$/,
  calLevel: /^CAL-[1-4]$/
};

/**
 * Level 2 validation: Check format compliance
 */
export async function validateLevel2(
  doc: ParsedDocument,
  template: TemplateConfig
): Promise<Issue[]> {
  const issues: Issue[] = [];

  // 1. Check cover page field formats
  if (template.sections.cover) {
    issues.push(...checkCoverFormats(doc, template.sections.cover));
  }

  // 2. Check change log formats
  if (template.sections.change_log) {
    issues.push(...checkChangeLogFormats(doc, template.sections.change_log));
  }

  return issues;
}

/**
 * Check cover page field formats
 */
function checkCoverFormats(doc: ParsedDocument, coverDef: any): Issue[] {
  const issues: Issue[] = [];
  const cover = doc.sheets['封面'];

  if (!cover || !coverDef.fields) return issues;

  for (const [fieldId, fieldDef] of Object.entries(coverDef.fields)) {
    const def = fieldDef as any;
    const value = getCellValue(cover, def.label);

    if (!value) continue; // Skip empty fields (Level 1 handles required)

    // Check pattern if defined
    if (def.pattern) {
      const pattern = new RegExp(def.pattern);
      if (!pattern.test(value)) {
        issues.push({
          severity: 'important',
          category: 'format_error',
          location: '封面',
          message: `字段 "${def.label}" 格式错误: ${value}`,
          field: fieldId,
          actual: value,
          expected: def.pattern,
          suggestion: getFormatHint(fieldId)
        });
      }
    }

    // Check predefined formats
    switch (fieldId) {
      case 'version':
        if (!PATTERNS.version.test(value)) {
          issues.push({
            severity: 'important',
            category: 'format_error',
            location: '封面',
            message: `版本号格式错误: ${value} (应为 Vx.y 格式)`,
            field: fieldId,
            actual: value,
            expected: 'Vx.y (例如: V0.1, V1.0)',
            suggestion: '使用格式 Vx.y，其中 x 为主版本号，y 为次版本号'
          });
        }
        break;

      case 'project_id':
        if (!PATTERNS.projectCode.test(value)) {
          issues.push({
            severity: 'important',
            category: 'format_error',
            location: '封面',
            message: `项目编号格式错误: ${value}`,
            field: fieldId,
            actual: value,
            expected: '大写字母和数字组合',
            suggestion: '项目编号应为大写字母和数字，如: 25SWICCARI'
          });
        }
        break;
    }
  }

  // Check ASPICE/ASIL/CAL level selections
  issues.push(...checkLevelSelections(cover, doc.metadata));

  return issues;
}

/**
 * Check ASPICE, ASIL, CAL level selections
 */
function checkLevelSelections(
  cover: Record<string, any>,
  metadata: any
): Issue[] {
  const issues: Issue[] = [];

  // Check ASPICE levels
  const aspiceText = findCellText(cover, 'ASPICE');
  if (aspiceText) {
    const aspiceMatches = aspiceText.match(/ASPICE-[1-5]/g) || [];
    if (aspiceMatches.length === 0) {
      issues.push({
        severity: 'important',
        category: 'format_error',
        location: '封面',
        message: '未选择 ASPICE 等级',
        suggestion: '请至少选择一个 ASPICE 等级 (ASPICE-1 到 ASPICE-5)'
      });
    }
  }

  // Check ASIL levels
  const asilText = findCellText(cover, 'ASIL');
  if (asilText) {
    const asilMatches = asilText.match(/ASIL-[ABCD]/g) || [];
    if (asilMatches.length === 0) {
      issues.push({
        severity: 'important',
        category: 'format_error',
        location: '封面',
        message: '未选择 ASIL 等级',
        suggestion: '请至少选择一个 ASIL 等级 (ASIL-A, ASIL-B, ASIL-C, ASIL-D)'
      });
    }
  }

  // Check CAL levels
  const calText = findCellText(cover, 'CAL');
  if (calText) {
    const calMatches = calText.match(/CAL-[1-4]/g) || [];
    if (calMatches.length === 0) {
      issues.push({
        severity: 'important',
        category: 'format_error',
        location: '封面',
        message: '未选择 CAL 等级',
        suggestion: '请至少选择一个 CAL 等级 (CAL-1 到 CAL-4)'
      });
    }
  }

  return issues;
}

/**
 * Check change log formats
 */
function checkChangeLogFormats(
  doc: ParsedDocument,
  changeLogDef: any
): Issue[] {
  const issues: Issue[] = [];
  const changeLog = doc.sheets['变更履历'];

  if (!changeLog) return issues;

  // Check date formats in change log
  const dates = extractColumnValues(changeLog, '日期');
  for (const date of dates) {
    if (date && !PATTERNS.date.test(date)) {
      issues.push({
        severity: 'important',
        category: 'format_error',
        location: '变更履历',
        message: `日期格式错误: ${date} (应为 YYYY-MM-DD)`,
        actual: date,
        expected: 'YYYY-MM-DD',
        suggestion: '使用 ISO 8601 日期格式，例如: 2026-02-09'
      });
    }
  }

  return issues;
}

/**
 * Helper: Get cell value by label
 */
function getCellValue(sheet: Record<string, any>, label: string): string {
  for (const [key, value] of Object.entries(sheet)) {
    if (key.includes(label)) {
      return (value as any).text || String((value as any).raw || '');
    }
  }
  return '';
}

/**
 * Helper: Find cell text by partial label
 */
function findCellText(sheet: Record<string, any>, labelPart: string): string {
  for (const [key, value] of Object.entries(sheet)) {
    if (key.includes(labelPart) || String((value as any).label || '').includes(labelPart)) {
      return (value as any).text || String((value as any).raw || '');
    }
  }
  return '';
}

/**
 * Helper: Extract all values from a column
 */
function extractColumnValues(sheet: Record<string, any>, headerLabel: string): string[] {
  const values: string[] = [];
  let foundHeader = false;

  for (const [key, value] of Object.entries(sheet)) {
    const v = value as any;
    if (v.label === headerLabel || key.includes(headerLabel)) {
      foundHeader = true;
    } else if (foundHeader && v.text && v.text.trim() !== '') {
      values.push(v.text);
    }
  }

  return values;
}

/**
 * Get format hint for common fields
 */
function getFormatHint(fieldId: string): string {
  const hints: Record<string, string> = {
    version: '使用 Vx.y 格式，如 V0.1, V1.0',
    date: '使用 YYYY-MM-DD 格式，如 2026-02-09',
    project_id: '使用大写字母和数字，如 25SWICCARI',
    file_id: '使用 XX-CODE-NN-NN 格式'
  };
  return hints[fieldId] || '请参考模板格式要求';
}
