/**
 * Level 3 Validator - Consistency Check
 *
 * Validates consistency across the document:
 * - Version numbers match between cover and change log
 * - Cross-references point to existing sections
 * - ASPICE level declaration matches actual content
 * - Approver signatures match change log
 */
import type { Issue, ParsedDocument, TemplateConfig } from '../types.js';
/**
 * Level 3 validation: Check internal consistency
 */
export declare function validateLevel3(doc: ParsedDocument, template: TemplateConfig): Promise<Issue[]>;
