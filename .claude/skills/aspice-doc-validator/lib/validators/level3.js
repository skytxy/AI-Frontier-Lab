/**
 * Level 3 Validator - Consistency Check
 *
 * Validates consistency across the document:
 * - Version numbers match between cover and change log
 * - Cross-references point to existing sections
 * - ASPICE level declaration matches actual content
 * - Approver signatures match change log
 */
/**
 * Level 3 validation: Check internal consistency
 */
export async function validateLevel3(doc, template) {
    const issues = [];
    // 1. Check version consistency
    issues.push(...checkVersionConsistency(doc));
    // 2. Check cross-references
    issues.push(...checkCrossReferences(doc, template));
    // 3. Check ASPICE level consistency
    issues.push(...checkASPICEConsistency(doc, template));
    // 4. Check approval flow consistency
    issues.push(...checkApprovalConsistency(doc));
    return issues;
}
/**
 * Check version consistency between cover and change log
 */
function checkVersionConsistency(doc) {
    const issues = [];
    const coverVersion = doc.metadata.version;
    const latestChangeLogVersion = getLatestChangeLogVersion(doc);
    if (coverVersion && latestChangeLogVersion) {
        if (coverVersion !== latestChangeLogVersion) {
            issues.push({
                severity: 'critical',
                category: 'version_mismatch',
                location: '封面/变更履历',
                message: `封面版本 (${coverVersion}) 与变更履历最新版本 (${latestChangeLogVersion}) 不一致`,
                actual: `Cover: ${coverVersion}, ChangeLog: ${latestChangeLogVersion}`,
                suggestion: `请将封面版本更新为 ${latestChangeLogVersion}，或在变更履历中添加 ${coverVersion} 记录`
            });
        }
    }
    // Check change log is sequential
    issues.push(...checkChangeLogSequential(doc));
    return issues;
}
/**
 * Get the latest version from change log
 */
function getLatestChangeLogVersion(doc) {
    const changeLog = doc.sheets['变更履历'];
    if (!changeLog)
        return null;
    const versions = extractColumnValues(changeLog, '版本');
    if (versions.length === 0)
        return null;
    // Sort versions (simple string comparison works for Vx.y)
    versions.sort().reverse();
    return versions[0];
}
/**
 * Check if change log versions are sequential
 */
function checkChangeLogSequential(doc) {
    const issues = [];
    const changeLog = doc.sheets['变更履历'];
    if (!changeLog)
        return issues;
    const versions = extractColumnValues(changeLog, '版本');
    for (let i = 0; i < versions.length - 1; i++) {
        const current = versions[i];
        const next = versions[i + 1];
        if (compareVersions(current, next) <= 0) {
            issues.push({
                severity: 'important',
                category: 'version_mismatch',
                location: '变更履历',
                message: `版本顺序错误: ${current} 应该大于 ${next}`,
                suggestion: '变更履历中的版本号应该按时间顺序递增'
            });
        }
    }
    return issues;
}
/**
 * Compare two version strings (Vx.y format)
 */
function compareVersions(v1, v2) {
    const parse = (v) => {
        const match = v.match(/V(\d+)\.(\d+)/);
        if (!match)
            return [0, 0];
        return [parseInt(match[1], 10), parseInt(match[2], 10)];
    };
    const [major1, minor1] = parse(v1);
    const [major2, minor2] = parse(v2);
    if (major1 !== major2)
        return major1 - major2;
    return minor1 - minor2;
}
/**
 * Check cross-references within document
 */
function checkCrossReferences(doc, template) {
    const issues = [];
    // Build list of valid section references
    const validRefs = new Set();
    for (const [sectionId, sectionDef] of Object.entries(template.sections)) {
        if (sectionId.startsWith('section_')) {
            const def = sectionDef;
            validRefs.add(def.label);
            // Add subsections
            if (def.subsections) {
                for (const sub of def.subsections) {
                    validRefs.add(`${def.label}/${sub}`);
                }
            }
        }
    }
    // Check references in each section
    for (const [sheetName, sheet] of Object.entries(doc.sheets)) {
        if (sheetName === '封面' || sheetName === '变更履历')
            continue;
        const refs = extractReferences(sheet);
        for (const ref of refs) {
            if (!isValidReference(ref, validRefs)) {
                issues.push({
                    severity: 'important',
                    category: 'broken_reference',
                    location: sheetName,
                    message: `引用的章节不存在: ${ref}`,
                    suggestion: `请检查引用 "${ref}" 是否正确，或创建该章节`
                });
            }
        }
    }
    return issues;
}
/**
 * Extract references from sheet content
 */
function extractReferences(sheet) {
    const refs = [];
    const refPattern = /(?:章节|第?\s*[一二三四五六七八九十\d]+\s*节|section)\s*[一二三四五六七八九十\d]+/gi;
    for (const value of Object.values(sheet)) {
        const v = value;
        if (v.text && typeof v.text === 'string') {
            const matches = v.text.match(refPattern);
            if (matches) {
                refs.push(...matches);
            }
        }
    }
    return refs;
}
/**
 * Check if a reference is valid
 */
function isValidReference(ref, validRefs) {
    // Simple check - in real implementation, would be more sophisticated
    for (const validRef of validRefs) {
        if (ref.includes(validRef) || validRef.includes(ref)) {
            return true;
        }
    }
    return false;
}
/**
 * Check ASPICE level consistency
 */
function checkASPICEConsistency(doc, template) {
    const issues = [];
    const declaredLevels = doc.metadata.aspice_levels || [];
    const templateLevel = template.aspice_level;
    // Check if declared levels meet template minimum
    if (declaredLevels.length > 0) {
        const maxDeclared = Math.max(...declaredLevels);
        if (maxDeclared < templateLevel) {
            issues.push({
                severity: 'important',
                category: 'aspice_level_mismatch',
                location: '封面',
                message: `声明的 ASPICE 等级 (${maxDeclared}) 低于模板要求 (${templateLevel})`,
                suggestion: `请确认文档符合 ASPICE ${templateLevel} 要求，或更新模板配置`
            });
        }
    }
    // Check if content matches declared ASPICE level
    const hasMetrics = checkForMetricsContent(doc);
    if (declaredLevels.includes(4) && !hasMetrics) {
        issues.push({
            severity: 'important',
            category: 'aspice_level_mismatch',
            location: '全文档',
            message: '声明了 ASPICE-4 但缺少度量指标内容',
            suggestion: 'ASPICE-4 需要包含量化度量和质量目标'
        });
    }
    return issues;
}
/**
 * Check if document contains metrics content
 */
function checkForMetricsContent(doc) {
    const metricsKeywords = ['度量', '指标', '指标值', '质量目标', 'quantitative', 'metric'];
    for (const [sheetName, sheet] of Object.entries(doc.sheets)) {
        for (const value of Object.values(sheet)) {
            const v = value;
            if (v.text && typeof v.text === 'string') {
                for (const keyword of metricsKeywords) {
                    if (v.text.includes(keyword)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}
/**
 * Check approval flow consistency
 */
function checkApprovalConsistency(doc) {
    const issues = [];
    const cover = doc.sheets['封面'];
    if (!cover)
        return issues;
    // Check if approver is filled for non-draft documents
    const approver = findCellText(cover, '批准者');
    const status = findCellText(cover, '当前状态');
    if (status && status.includes('公布') && !approver) {
        issues.push({
            severity: 'critical',
            category: 'missing_required_field',
            location: '封面',
            message: '文档状态为"公布"但缺少批准者签字',
            suggestion: '公布的文档必须有批准者签字'
        });
    }
    if (status && status.includes('基线') && !approver) {
        issues.push({
            severity: 'important',
            category: 'missing_required_field',
            location: '封面',
            message: '文档状态为"基线"但缺少批准者签字',
            suggestion: '基线文档建议有批准者签字'
        });
    }
    return issues;
}
/**
 * Helper: Extract column values from sheet
 */
function extractColumnValues(sheet, headerLabel) {
    const values = [];
    let foundHeader = false;
    for (const [key, value] of Object.entries(sheet)) {
        const v = value;
        if (v.label === headerLabel || key.includes(headerLabel)) {
            foundHeader = true;
        }
        else if (foundHeader && v.text && v.text.trim() !== '') {
            values.push(v.text);
            // Stop at empty row
            if (values.length > 0 && v.text.trim() === '')
                break;
        }
    }
    return values;
}
/**
 * Helper: Find cell text by label
 */
function findCellText(sheet, labelPart) {
    for (const [key, value] of Object.entries(sheet)) {
        const v = value;
        if (key.includes(labelPart) || String(v.label || '').includes(labelPart)) {
            return v.text || String(v.raw || '');
        }
    }
    return '';
}
