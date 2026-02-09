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
 * Level 2 validation: Check format compliance
 */
export declare function validateLevel2(doc: ParsedDocument, template: TemplateConfig): Promise<Issue[]>;
