/**
 * ASPICE Document Validator - Type Definitions
 *
 * Core types for template-based ASPICE document validation.
 */
/**
 * Validation issue severity levels
 */
export type Severity = 'critical' | 'important' | 'minor';
/**
 * Validation issue categories
 */
export type IssueCategory = 'missing_required_field' | 'missing_section' | 'version_mismatch' | 'format_error' | 'insufficient_content' | 'broken_reference' | 'formatting_issue' | 'aspice_level_mismatch' | 'safety_requirement_missing';
/**
 * Validation output format
 */
export type OutputFormat = 'text' | 'json' | 'markdown';
/**
 * Document format type
 */
export type DocumentFormat = 'xlsx' | 'docx' | 'md';
/**
 * ASPICE level (1-5)
 */
export type ASPICELevel = 1 | 2 | 3 | 4 | 5;
/**
 * ASIL level for ISO 26262
 */
export type ASILLevel = 'A' | 'B' | 'C' | 'D';
/**
 * CAL level for ISO/SAE 21434
 */
export type CALLevel = 1 | 2 | 3 | 4;
/**
 * A single validation issue found in the document
 */
export interface Issue {
    /** Severity of the issue */
    severity: Severity;
    /** Category of the issue */
    category: IssueCategory;
    /** Location in document (sheet name, section, etc.) */
    location: string;
    /** Human-readable description */
    message: string;
    /** Related field identifier (if applicable) */
    field?: string;
    /** Expected value (for format errors) */
    expected?: string;
    /** Actual value found */
    actual?: string;
    /** Suggestion for fixing the issue */
    suggestion?: string;
}
/**
 * Result of document validation
 */
export interface ValidationResult {
    /** Whether validation passed (no critical issues) */
    passed: boolean;
    /** Path to the validated document */
    document: string;
    /** Template used for validation */
    template: string;
    /** Target ASPICE level */
    aspice_level: ASPICELevel;
    /** All issues found during validation */
    issues: Issue[];
    /** Summary statistics */
    summary: ValidationSummary;
    /** Timestamp of validation */
    validated_at: string;
}
/**
 * Summary statistics for validation
 */
export interface ValidationSummary {
    /** Total number of issues */
    total: number;
    /** Count by severity */
    by_severity: Record<Severity, number>;
    /** Count by category */
    by_category: Record<IssueCategory, number>;
    /** Validation duration in milliseconds */
    duration_ms: number;
}
/**
 * Field definition in a template
 */
export interface FieldDefinition {
    /** Display label for the field */
    label: string;
    /** Whether field is required */
    required: boolean;
    /** Regex pattern for validation */
    pattern?: string;
    /** Valid options for selection */
    options?: string[];
    /** Minimum number of selections */
    min_selection?: number;
    /** Default value */
    default?: string;
    /** Description of the field */
    description?: string;
}
/**
 * Section definition in a template
 */
export interface SectionDefinition {
    /** Display label */
    label: string;
    /** Whether section is required */
    required: boolean;
    /** Minimum content length (for quality checks) */
    min_content_length?: number;
    /** Subsections within this section */
    subsections?: string[];
    /** Fields within this section */
    fields?: Record<string, FieldDefinition>;
}
/**
 * Template configuration
 */
export interface TemplateConfig {
    /** Template name */
    name: string;
    /** Template version */
    version: string;
    /** Target ASPICE level */
    aspice_level: ASPICELevel;
    /** Document description */
    description?: string;
    /** All sections in the template */
    sections: {
        /** Cover page definition */
        cover?: SectionDefinition;
        /** Change log definition */
        change_log?: SectionDefinition;
        /** Named sections (section_1, section_2, etc.) */
        [key: string]: SectionDefinition | undefined;
    };
}
/**
 * Document cell value
 */
export interface CellValue {
    /** Raw value */
    raw: any;
    /** String representation */
    text: string;
    /** Row index */
    row: number;
    /** Column index */
    col: number;
}
/**
 * Parsed document structure
 */
export interface ParsedDocument {
    /** Document format */
    format: DocumentFormat;
    /** Sheet/page name -> content mapping */
    sheets: Record<string, Record<string, CellValue>>;
    /** Metadata from the document */
    metadata: {
        /** Project identifier */
        project_id?: string;
        /** File identifier */
        file_id?: string;
        /** Version */
        version?: string;
        /** ASPICE levels declared */
        aspice_levels?: ASPICELevel[];
        /** ASIL levels declared */
        asil_levels?: ASILLevel[];
        /** CAL levels declared */
        cal_levels?: CALLevel[];
    };
}
/**
 * Validation options
 */
export interface ValidationOptions {
    /** Template to use (name or path) */
    template: string;
    /** Path to document */
    document: string;
    /** Validation level (1-4, or 'all') */
    level: number | 'all';
    /** Output format */
    output: OutputFormat;
    /** Target ASPICE level */
    aspice_level?: ASPICELevel;
    /** Whether to include suggestions */
    include_suggestions: boolean;
}
/**
 * Validator interface
 */
export interface IValidator {
    /** Validate a document and return results */
    validate(document: string, template: TemplateConfig): Promise<ValidationResult>;
    /** Validate at specific level */
    validateAtLevel(document: ParsedDocument, template: TemplateConfig, level: number): Promise<Issue[]>;
}
