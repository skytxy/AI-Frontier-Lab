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
export async function validateLevel4(
  doc: ParsedDocument,
  template: TemplateConfig
): Promise<Issue[]> {
  const issues: Issue[] = [];

  // 1. Check content depth in sections
  issues.push(...checkContentDepth(doc, template));

  // 2. Check safety requirements for ASIL levels
  issues.push(...checkSafetyRequirements(doc, template));

  // 3. Check traceability
  issues.push(...checkTraceability(doc, template));

  // 4. Check for placeholder text
  issues.push(...checkPlaceholders(doc));

  return issues;
}

/**
 * Check if sections have sufficient content depth
 */
function checkContentDepth(doc: ParsedDocument, template: TemplateConfig): Issue[] {
  const issues: Issue[] = [];

  for (const [sectionId, sectionDef] of Object.entries(template.sections)) {
    if (!sectionId.startsWith('section_')) continue;

    const def = sectionDef as any;
    if (!def.required) continue;

    const sheet = doc.sheets[def.label];
    if (!sheet) continue; // Level 1 handles missing sections

    const contentLength = measureContentLength(sheet);
    const minLength = def.min_content_length || 100;

    if (contentLength < minLength) {
      issues.push({
        severity: 'important',
        category: 'insufficient_content',
        location: def.label,
        message: `章节内容过少 (${contentLength} 字符)，建议至少 ${minLength} 字符`,
        suggestion: `请补充 ${def.label} 的详细内容，确保包含必要的设计说明和要求`
      });
    }

    // Check if content is just repeating the title
    if (isContentRepetitive(sheet, def.label)) {
      issues.push({
        severity: 'minor',
        category: 'insufficient_content',
        location: def.label,
        message: '章节内容似乎只是重复标题，缺少实质性内容',
        suggestion: '请添加具体的设计说明、技术要求或实现细节'
      });
    }
  }

  return issues;
}

/**
 * Measure the content length of a sheet
 */
function measureContentLength(sheet: Record<string, any>): number {
  let totalLength = 0;

  for (const value of Object.values(sheet)) {
    const v = value as any;
    if (v.text && typeof v.text === 'string' && v.text.length > 2) {
      // Exclude very short cells (likely headers)
      if (v.text.length > 10) {
        totalLength += v.text.length;
      }
    }
  }

  return totalLength;
}

/**
 * Check if content is just repeating the section title
 */
function isContentRepetitive(sheet: Record<string, any>, sectionLabel: string): boolean {
  const labelWords = sectionLabel.split(/\s+/);
  let repetitionCount = 0;
  let totalContent = 0;

  for (const value of Object.values(sheet)) {
    const v = value as any;
    if (v.text && typeof v.text === 'string' && v.text.length > 5) {
      totalContent++;
      for (const word of labelWords) {
        if (word.length > 1 && v.text.includes(word)) {
          repetitionCount++;
          break;
        }
      }
    }
  }

  // If more than 70% of content contains title words, it's likely repetitive
  return totalContent > 0 && repetitionCount / totalContent > 0.7;
}

/**
 * Check safety requirements for ASIL levels
 */
function checkSafetyRequirements(doc: ParsedDocument, template: TemplateConfig): Issue[] {
  const issues: Issue[] = [];

  const asilLevels = doc.metadata.asil_levels || [];
  const hasHighASIL = asilLevels.some(l => l === 'C' || l === 'D');

  if (!hasHighASIL) return issues;

  // For ASIL C/D, check for safety-related content
  const safetyKeywords = [
    '安全', '故障', '失效', '容错', '冗余', '诊断',
    'safety', 'fault', 'failure', 'tolerant', 'redundancy', 'diagnostic'
  ];

  let hasSafetyContent = false;
  for (const [sheetName, sheet] of Object.entries(doc.sheets)) {
    for (const value of Object.values(sheet)) {
      const v = value as any;
      if (v.text && typeof v.text === 'string') {
        for (const keyword of safetyKeywords) {
          if (v.text.toLowerCase().includes(keyword.toLowerCase())) {
            hasSafetyContent = true;
            break;
          }
        }
      }
    }
  }

  if (!hasSafetyContent) {
    issues.push({
      severity: 'important',
      category: 'safety_requirement_missing',
      location: '全文档',
      message: `声明了 ASIL-${asilLevels.join('/')} 但缺少安全相关内容`,
      suggestion: 'ASIL C/D 等级需要包含安全机制、故障处理或诊断相关内容'
    });
  }

  return issues;
}

/**
 * Check traceability information
 */
function checkTraceability(doc: ParsedDocument, template: TemplateConfig): Issue[] {
  const issues: Issue[] = [];

  const traceabilityKeywords = [
    '追溯', '需求', '来源', '对应', '满足',
    'traceability', 'requirement', 'satisfies', 'derived'
  ];

  let hasTraceabilityInfo = false;
  let sectionsWithoutTraceability: string[] = [];

  for (const [sectionId, sectionDef] of Object.entries(template.sections)) {
    if (!sectionId.startsWith('section_')) continue;

    const def = sectionDef as any;
    const sheet = doc.sheets[def.label];
    if (!sheet) continue;

    let sectionHasTraceability = false;
    for (const value of Object.values(sheet)) {
      const v = value as any;
      if (v.text && typeof v.text === 'string') {
        for (const keyword of traceabilityKeywords) {
          if (v.text.toLowerCase().includes(keyword.toLowerCase())) {
            sectionHasTraceability = true;
            hasTraceabilityInfo = true;
            break;
          }
        }
      }
      if (sectionHasTraceability) break;
    }

    if (!sectionHasTraceability && def.required) {
      sectionsWithoutTraceability.push(def.label);
    }
  }

  // For ASPICE level 3+, traceability is important
  if (template.aspice_level >= 3 && sectionsWithoutTraceability.length > 0) {
    issues.push({
      severity: 'minor',
      category: 'insufficient_content',
      location: sectionsWithoutTraceability.join(', '),
      message: `以下章节可能缺少可追溯性信息: ${sectionsWithoutTraceability.slice(0, 3).join(', ')}`,
      suggestion: 'ASPICE-3 建议在设计中包含需求追溯信息，说明设计如何满足需求'
    });
  }

  return issues;
}

/**
 * Check for placeholder text that wasn't replaced
 */
function checkPlaceholders(doc: ParsedDocument): Issue[] {
  const issues: Issue[] = [];

  const placeholderPatterns = [
    /TODO|待补充|TBD|待定|XXX/gi,
    /<.*?>|\[.*?\]/g, // Common placeholder patterns like <name> or [description]
    /点击|此处|填写.*内容/gi
  ];

  for (const [sheetName, sheet] of Object.entries(doc.sheets)) {
    for (const [key, value] of Object.entries(sheet)) {
      const v = value as any;
      if (v.text && typeof v.text === 'string') {
        for (const pattern of placeholderPatterns) {
          const matches = v.text.match(pattern);
          if (matches) {
            issues.push({
              severity: 'minor',
              category: 'insufficient_content',
              location: sheetName,
              message: `发现可能的占位符文本: "${matches[0]}"`,
              suggestion: '请确认是否为未完成的占位符，如果是，请替换为实际内容'
            });
          }
        }
      }
    }
  }

  return issues;
}

/**
 * Check for diagram or figure references
 */
export function checkDiagrams(doc: ParsedDocument): Issue[] {
  const issues: Issue[] = [];

  const diagramReferences = [
    '图', '图表', '示意图', '架构图', '流程图',
    'figure', 'diagram', 'chart', 'architecture'
  ];

  let hasDiagramReferences = 0;
  for (const [sheetName, sheet] of Object.entries(doc.sheets)) {
    for (const value of Object.values(sheet)) {
      const v = value as any;
      if (v.text && typeof v.text === 'string') {
        for (const ref of diagramReferences) {
          if (v.text.toLowerCase().includes(ref.toLowerCase())) {
            hasDiagramReferences++;
          }
        }
      }
    }
  }

  // For design documents, having diagrams is good practice
  if (hasDiagramReferences === 0) {
    issues.push({
      severity: 'minor',
      category: 'insufficient_content',
      location: '全文档',
      message: '文档未引用任何图表或示意图',
      suggestion: '软件设计文档建议包含架构图、流程图或时序图等可视化内容'
    });
  }

  return issues;
}
