/**
 * Type definitions for ASPICE Document Validator
 */

export type Severity = 'critical' | 'important' | 'minor';

export type IssueCategory =
  | 'missing_required_field'
  | 'missing_section'
  | 'version_mismatch'
  | 'format_error'
  | 'insufficient_content'
  | 'broken_reference'
  | 'aspice_level_mismatch'
  | 'safety_requirement_missing';

export interface Issue {
  severity: Severity;
  category: IssueCategory;
  location: string;
  message: string;
  field?: string;
  expected?: string;
  actual?: string;
  suggestion?: string;
}

export interface ValidationResult {
  passed: boolean;
  issues: Issue[];
  summary: {
    total: number;
    by_severity: Record<Severity, number>;
    duration_ms: number;
  };
}

export type { TemplateConfig, TemplateSection, TemplateField, ParsedDocument, SheetData } from './validators/index.js';
