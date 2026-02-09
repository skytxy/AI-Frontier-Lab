/**
 * Level 4 Validator - Content Quality Assessment
 *
 * Assesses the quality and completeness of document content:
 * - Section content depth (not just headers)
 * - Content relevance to section title
 * - Safety requirements alignment with ASIL level
 * - Traceability information completeness
 *
 * Note: This level provides suggestions rather than hard failures.
 */
import type { Issue, ParsedDocument, TemplateConfig } from '../types.js';
/**
 * Level 4 validation: Content quality assessment
 */
export declare function validateLevel4(doc: ParsedDocument, template: TemplateConfig): Promise<Issue[]>;
/**
 * Check for diagram or figure references
 */
export declare function checkDiagrams(doc: ParsedDocument): Issue[];
