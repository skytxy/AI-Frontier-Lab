/**
 * Level 1 Validator - Required Fields Check
 *
 * Validates that all required fields and sections are present and non-empty.
 * This is the most basic check - if a required field is missing, the document
 * is fundamentally incomplete.
 */
/**
 * Level 1 validation: Check required fields and sections
 */
export async function validateLevel1(doc, template) {
    const issues = [];
    // 1. Check cover page required fields
    if (template.sections.cover) {
        issues.push(...checkCoverFields(doc, template.sections.cover));
    }
    // 2. Check change log
    if (template.sections.change_log) {
        issues.push(...checkChangeLog(doc, template.sections.change_log));
    }
    // 3. Check required sections
    issues.push(...checkRequiredSections(doc, template));
    return issues;
}
/**
 * Check cover page required fields
 */
function checkCoverFields(doc, coverDef) {
    const issues = [];
    const cover = doc.sheets['封面'];
    if (!cover) {
        return [{
                severity: 'critical',
                category: 'missing_section',
                location: '封面',
                message: '封面页不存在'
            }];
    }
    if (!coverDef.fields)
        return issues;
    for (const [fieldId, fieldDef] of Object.entries(coverDef.fields)) {
        const def = fieldDef;
        if (def.required) {
            const value = findCellValue(cover, def.label);
            if (!value || value.trim() === '') {
                issues.push({
                    severity: 'critical',
                    category: 'missing_required_field',
                    location: '封面',
                    message: `缺少必填字段: ${def.label}`,
                    field: fieldId,
                    suggestion: `请填写 ${def.label} 字段`
                });
            }
        }
    }
    return issues;
}
/**
 * Check change log section
 */
function checkChangeLog(doc, changeLogDef) {
    const issues = [];
    const changeLog = doc.sheets['变更履历'];
    if (!changeLog) {
        return [{
                severity: 'critical',
                category: 'missing_section',
                location: '变更履历',
                message: '变更履历表不存在'
            }];
    }
    // Check minimum rows (excluding header)
    const rowCount = countDataRows(changeLog);
    const minRows = changeLogDef.min_rows || 1;
    if (rowCount < minRows) {
        issues.push({
            severity: 'critical',
            category: 'insufficient_content',
            location: '变更履历',
            message: `变更履历至少需要 ${minRows} 条记录，当前只有 ${rowCount} 条`,
            suggestion: '请在变更履历中添加至少一条记录'
        });
    }
    return issues;
}
/**
 * Check required main sections
 */
function checkRequiredSections(doc, template) {
    const issues = [];
    for (const [sectionId, sectionDef] of Object.entries(template.sections)) {
        if (sectionId.startsWith('section_')) {
            const def = sectionDef;
            if (def.required) {
                const sheet = doc.sheets[def.label];
                if (!sheet) {
                    issues.push({
                        severity: 'critical',
                        category: 'missing_section',
                        location: def.label,
                        message: `缺少必需章节: ${def.label}`,
                        suggestion: `请创建 ${def.label} 章节`
                    });
                }
            }
        }
    }
    return issues;
}
/**
 * Helper: Find cell value by label in a sheet
 */
function findCellValue(sheet, label) {
    for (const [key, value] of Object.entries(sheet)) {
        if (key.includes(label) || value.label === label) {
            return value.text || String(value.raw || '');
        }
    }
    return '';
}
/**
 * Helper: Count data rows in a sheet (excluding headers)
 */
function countDataRows(sheet) {
    let count = 0;
    for (const value of Object.values(sheet)) {
        const v = value;
        if (v.row > 1 && v.text && v.text.trim() !== '') {
            count++;
        }
    }
    return Math.floor(count / 6); // Approximate, assuming ~6 columns per row
}
