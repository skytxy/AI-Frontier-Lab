/**
 * Level 1 Validator - Required Fields Check
 *
 * Validates that all required fields and sections are present and non-empty.
 * This is the most basic check - if a required field is missing, the document
 * is fundamentally incomplete.
 */
import type { Issue, ParsedDocument, TemplateConfig } from '../types.js';
/**
 * Level 1 validation: Check required fields and sections
 */
export declare function validateLevel1(doc: ParsedDocument, template: TemplateConfig): Promise<Issue[]>;
