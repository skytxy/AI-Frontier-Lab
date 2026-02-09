/**
 * ASPICE Document Validator - Main Entry Point
 *
 * Validates ASPICE-compliant automotive software documentation
 * against template requirements.
 */
import type { ValidationResult, TemplateConfig, ParsedDocument, ValidationOptions } from './types.js';
/**
 * Main validator class
 */
export declare class ASPICEValidator {
    private templateDir;
    constructor(templateDir?: string);
    /**
     * Load a template configuration
     */
    loadTemplate(nameOrPath: string): Promise<TemplateConfig>;
    /**
     * Parse a document (Excel format)
     */
    parseDocument(docPath: string): Promise<ParsedDocument>;
    /**
     * Extract metadata from cover sheet
     */
    private extractMetadata;
    /**
     * Parse level declarations from text
     */
    private parseLevels;
    /**
     * Get header label for a column
     */
    private getHeaderLabel;
    /**
     * Validate a document
     */
    validate(options: ValidationOptions): Promise<ValidationResult>;
    /**
     * Generate validation summary
     */
    private generateSummary;
    /**
     * Generate report in specified format
     */
    generateReport(result: ValidationResult, format: 'text' | 'json' | 'markdown'): string;
    /**
     * Generate markdown report
     */
    private generateMarkdownReport;
    /**
     * Generate plain text report
     */
    private generateTextReport;
}
/**
 * CLI entry point
 */
export declare function main(): Promise<void>;
