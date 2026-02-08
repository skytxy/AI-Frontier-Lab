/**
 * Learner Agent - Zero-Knowledge Chapter Validator
 *
 * A "zero-knowledge" developer who attempts to learn from chapter content alone,
 * identifying knowledge gaps through hands-on experimentation.
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ChapterStructure {
  path: string;
  readme: string;
  concepts: ConceptFile[];
  experiments: Experiment[];
}

export interface ConceptFile {
  name: string;
  path: string;
  content: string;
  frontmatter: Record<string, unknown>;
}

export interface Experiment {
  name: string;
  path: string;
  readme: string;
  hasCode: boolean;
  codeFiles: string[];
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  type: 'conceptual' | 'practical' | 'debugging';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  expectedOutcome: string;
}

export interface AttemptResult {
  scenarioId: string;
  success: boolean;
  duration: number;
  steps: Step[];
  gaps: KnowledgeGap[];
  notes: string;
}

export interface Step {
  order: number;
  action: string;
  success: boolean;
  error?: string;
  timestamp: number;
}

export interface KnowledgeGap {
  category: 'prerequisite' | 'concept' | 'implementation' | 'tooling' | 'other';
  severity: 'blocking' | 'hindering' | 'confusing';
  description: string;
  expectedContent: string;
  actualContent?: string;
  location?: string;
}

export interface GapReportNew {
  chapterPath: string;
  timestamp: number;
  totalGaps: number;
  gapsByCategory: Record<string, number>;
  gapsBySeverity: Record<string, number>;
  gaps: KnowledgeGap[];
  scenarioResults: AttemptResult[];
  completionRate: number;
  recommendations: string[];
}

// ============================================================================
// Legacy API Types (for backward compatibility with coordinator)
// ============================================================================

export interface LearnerOptions {
  workingDirectory: string;
  verbose?: boolean;
}

export interface LearnerChapterContent {
  title: string;
  sections: Map<string, string>;
  codeExamples: Map<string, string>;
  prerequisites: string[];
}

export interface LearnerScenarioAttempt {
  content: LearnerChapterContent;
  scenario: string;
  phase: 'simple' | 'complex';
}

export interface LearnerScenarioResult {
  success: boolean;
  phase: 'simple' | 'complex';
  completion: number;
  blockers: string[];
  missingConcepts: string[];
  missingSteps: string[];
  ambiguousContent: string[];
  error?: string;
}

export type GapReport = Omit<LearnerScenarioResult, 'success' | 'completion' | 'phase' | 'error'> & {
  iteration: number;
  phase: 'simple' | 'complex';
  suggestedAdditions: string[];
};

// ============================================================================
// LearnerAgent Class - New Implementation
// ============================================================================

export class LearnerAgent {
  private chapterPath: string;
  private chapterStructure: ChapterStructure | null = null;
  private gaps: KnowledgeGap[] = [];
  private scenarioResults: AttemptResult[] = [];
  private startTime: number = 0;
  private verbose: boolean = false;

  constructor(chapterPath: string, verbose: boolean = false) {
    this.chapterPath = chapterPath;
    this.verbose = verbose;
  }

  /**
   * Parse the chapter structure and load all content
   */
  async parseChapter(chapterPath: string): Promise<ChapterStructure> {
    const basePath = join(process.cwd(), chapterPath);
    const structure: ChapterStructure = {
      path: basePath,
      readme: '',
      concepts: [],
      experiments: []
    };

    try {
      // Read main README.md
      const readmePath = join(basePath, 'README.md');
      structure.readme = await readFile(readmePath, 'utf-8');

      // Parse concepts directory
      const conceptsPath = join(basePath, 'concepts');
      try {
        const conceptEntries = await readdir(conceptsPath);
        for (const entry of conceptEntries) {
          if (entry.endsWith('.md')) {
            const conceptPath = join(conceptsPath, entry);
            const content = await readFile(conceptPath, 'utf-8');
            const frontmatter = this.extractFrontmatter(content);
            structure.concepts.push({
              name: entry,
              path: conceptPath,
              content,
              frontmatter
            });
          }
        }
      } catch {
        // No concepts directory - not an error
      }

      // Parse experiments directory
      const experimentsPath = join(basePath, 'experiments');
      try {
        const experimentEntries = await readdir(experimentsPath, { withFileTypes: true });
        for (const entry of experimentEntries) {
          if (entry.isDirectory()) {
            const expPath = join(experimentsPath, entry.name);
            const expReadmePath = join(expPath, 'README.md');
            let readme = '';
            try {
              readme = await readFile(expReadmePath, 'utf-8');
            } catch {
              // No README for this experiment
            }

            // Check for code files
            const codeFiles: string[] = [];
            try {
              const expEntries = await readdir(expPath);
              for (const expEntry of expEntries) {
                const ext = expEntry.split('.').pop();
                if (['ts', 'js', 'py', 'go', 'rs', 'cpp', 'c', 'java'].includes(ext || '')) {
                  codeFiles.push(join(expPath, expEntry));
                }
              }
            } catch {
              // Empty experiment directory
            }

            structure.experiments.push({
              name: entry.name,
              path: expPath,
              readme,
              hasCode: codeFiles.length > 0,
              codeFiles
            });
          }
        }
      } catch {
        // No experiments directory
      }
    } catch (error) {
      throw new Error(`Failed to parse chapter at ${chapterPath}: ${error}`);
    }

    this.chapterStructure = structure;
    return structure;
  }

  /**
   * Extract frontmatter from markdown content
   */
  private extractFrontmatter(content: string): Record<string, unknown> {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);
    if (!match) return {};

    const frontmatter: Record<string, unknown> = {};
    const lines = match[1].split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        // Try to parse as YAML-like values
        if (value.startsWith('[') && value.endsWith(']')) {
          frontmatter[key] = value.slice(1, -1).split(',').map(v => v.trim());
        } else if (value === 'true') {
          frontmatter[key] = true;
        } else if (value === 'false') {
          frontmatter[key] = false;
        } else {
          frontmatter[key] = value;
        }
      }
    }
    return frontmatter;
  }

  /**
   * Learn prerequisites from chapter content
   * Identifies missing prerequisite information
   */
  async learnPrerequisites(): Promise<void> {
    if (!this.chapterStructure) {
      await this.parseChapter(this.chapterPath);
    }

    // Check for prerequisite section in README
    const readme = this.chapterStructure!.readme;
    const hasPrereqSection = /##?\s*[Pp]rerequisit/.test(readme)
      || /##?\s*[Rr]equirements/.test(readme)
      || /##?\s*[Bb]efore\s+[Yy]ou\s+[Bb]egin/.test(readme);

    if (!hasPrereqSection) {
      this.gaps.push({
        category: 'prerequisite',
        severity: 'hindering',
        description: 'No prerequisites section found in chapter README',
        expectedContent: 'A "Prerequisites" or "Before You Begin" section listing required knowledge and tools',
        location: join(this.chapterPath, 'README.md')
      });
    }

    // Check for setup/installation instructions
    const hasSetupSection = /##?\s*[Ss]etup/.test(readme)
      || /##?\s*[Ii]nstallation/.test(readme)
      || /##?\s*[Gg]etting\s+[Ss]tarted/.test(readme);

    if (!hasSetupSection && this.chapterStructure!.experiments.length > 0) {
      this.gaps.push({
        category: 'tooling',
        severity: 'hindering',
        description: 'No setup/installation instructions found, but chapter contains experiments',
        expectedContent: 'Setup instructions for running experiments (dependencies, environment, etc.)',
        location: join(this.chapterPath, 'README.md')
      });
    }
  }

  /**
   * Attempt to complete a scenario based on chapter content
   * This simulates a learner trying to apply what they've learned
   */
  async attemptScenario(scenario: Scenario): Promise<AttemptResult> {
    this.startTime = Date.now();
    const steps: Step[] = [];
    const gaps: KnowledgeGap[] = [];

    if (this.verbose) {
      console.log(`\n[Learner] Attempting scenario: ${scenario.title}`);
    }

    // Step 1: Verify prerequisites are covered
    steps.push({
      order: steps.length + 1,
      action: 'Verify prerequisites are documented',
      success: true,
      timestamp: Date.now()
    });

    for (const prereq of scenario.prerequisites) {
      const isCovered = this.checkPrerequisiteCoverage(prereq);
      if (!isCovered) {
        gaps.push({
          category: 'prerequisite',
          severity: 'blocking',
          description: `Prerequisite "${prereq}" is not covered in the chapter content`,
          expectedContent: `Explanation or reference for: ${prereq}`,
          location: this.chapterPath
        });
      }
    }

    // Step 2: Check if scenario type is appropriate
    const hasRelevantContent = this.checkScenarioRelevance(scenario);
    steps.push({
      order: steps.length + 1,
      action: 'Verify scenario relevance to chapter content',
      success: hasRelevantContent,
      timestamp: Date.now()
    });

    if (!hasRelevantContent) {
      gaps.push({
        category: 'concept',
        severity: 'blocking',
        description: `Chapter content does not adequately cover scenario: ${scenario.title}`,
        expectedContent: `Content explaining: ${scenario.description}`,
        location: this.chapterPath
      });
    }

    // Step 3: For practical scenarios, check for runnable code/examples
    if (scenario.type === 'practical') {
      const hasPracticalContent = this.checkPracticalContent();
      steps.push({
        order: steps.length + 1,
        action: 'Verify practical content (code examples, experiments)',
        success: hasPracticalContent,
        timestamp: Date.now()
      });

      if (!hasPracticalContent) {
        gaps.push({
          category: 'implementation',
          severity: 'hindering',
          description: 'Practical scenario lacks runnable code examples or experiments',
          expectedContent: 'Code examples or experiment that demonstrates the scenario',
          location: join(this.chapterPath, 'experiments')
        });
      }
    }

    // Step 4: Verify expected outcome is achievable
    const blockingGaps = gaps.filter(g => g.severity === 'blocking');
    steps.push({
      order: steps.length + 1,
      action: 'Verify expected outcome is achievable with provided content',
      success: blockingGaps.length === 0,
      timestamp: Date.now()
    });

    const result: AttemptResult = {
      scenarioId: scenario.id,
      success: blockingGaps.length === 0,
      duration: Date.now() - this.startTime,
      steps,
      gaps,
      notes: this.generateAttemptNotes(gaps, scenario)
    };

    this.scenarioResults.push(result);
    this.gaps.push(...gaps);

    if (this.verbose) {
      console.log(`[Learner] Scenario result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (gaps.length > 0) {
        console.log(`[Learner] Found ${gaps.length} gaps`);
      }
    }

    return result;
  }

  /**
   * Check if a prerequisite is covered in the chapter content
   */
  private checkPrerequisiteCoverage(prereq: string): boolean {
    if (!this.chapterStructure) return false;

    const allContent = [
      this.chapterStructure.readme,
      ...this.chapterStructure.concepts.map(c => c.content),
      ...this.chapterStructure.experiments.map(e => e.readme)
    ].join(' ').toLowerCase();

    const prereqLower = prereq.toLowerCase();
    const prereqWords = prereqLower.split(/\s+/);

    // Check if most prerequisite words appear in content
    const matchCount = prereqWords.filter(w => w.length > 3 && allContent.includes(w)).length;
    return matchCount >= prereqWords.length * 0.5;
  }

  /**
   * Check if scenario is relevant to chapter content
   */
  private checkScenarioRelevance(scenario: Scenario): boolean {
    if (!this.chapterStructure) return false;

    const scenarioWords = scenario.description.toLowerCase().split(/\s+/);
    const allContent = [
      this.chapterStructure.readme,
      ...this.chapterStructure.concepts.map(c => c.content)
    ].join(' ').toLowerCase();

    // Check if key scenario terms appear in content
    const keyTerms = scenarioWords.filter(w => w.length > 4);
    const matchCount = keyTerms.filter(term => allContent.includes(term)).length;
    return matchCount >= keyTerms.length * 0.3;
  }

  /**
   * Check if chapter has practical content (code/experiments)
   */
  private checkPracticalContent(): boolean {
    if (!this.chapterStructure) return false;

    return this.chapterStructure.experiments.some(e => e.hasCode || e.readme.length > 0)
      || this.chapterStructure.readme.includes('```')
      || this.chapterStructure.concepts.some(c => c.content.includes('```'));
  }

  /**
   * Generate notes for the attempt result
   */
  private generateAttemptNotes(gaps: KnowledgeGap[], scenario: Scenario): string {
    if (gaps.length === 0) {
      return `Successfully completed scenario "${scenario.title}" with all required content available.`;
    }

    const blocking = gaps.filter(g => g.severity === 'blocking').length;
    const hindering = gaps.filter(g => g.severity === 'hindering').length;

    return `Scenario "${scenario.title}" had ${blocking} blocking and ${hindering} hindering gaps. ` +
      `Learner would need additional resources to complete this scenario.`;
  }

  /**
   * Generate a comprehensive gap report
   */
  async generateGapReport(): Promise<GapReportNew> {
    // Analyze chapter structure if not already done
    if (!this.chapterStructure) {
      await this.parseChapter(this.chapterPath);
    }

    // Check for common chapter quality issues
    await this.performQualityChecks();

    // Categorize gaps
    const gapsByCategory: Record<string, number> = {};
    const gapsBySeverity: Record<string, number> = {};

    for (const gap of this.gaps) {
      gapsByCategory[gap.category] = (gapsByCategory[gap.category] || 0) + 1;
      gapsBySeverity[gap.severity] = (gapsBySeverity[gap.severity] || 0) + 1;
    }

    // Calculate completion rate
    const successfulScenarios = this.scenarioResults.filter(r => r.success).length;
    const completionRate = this.scenarioResults.length > 0
      ? (successfulScenarios / this.scenarioResults.length) * 100
      : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      chapterPath: this.chapterPath,
      timestamp: Date.now(),
      totalGaps: this.gaps.length,
      gapsByCategory,
      gapsBySeverity,
      gaps: [...this.gaps],
      scenarioResults: [...this.scenarioResults],
      completionRate,
      recommendations
    };
  }

  /**
   * Perform quality checks on chapter content
   */
  private async performQualityChecks(): Promise<void> {
    if (!this.chapterStructure) return;

    const readme = this.chapterStructure.readme;

    // Check for frontmatter
    if (!readme.startsWith('---')) {
      this.gaps.push({
        category: 'other',
        severity: 'confusing',
        description: 'Chapter README lacks frontmatter metadata',
        expectedContent: 'Frontmatter with title, tags, category, difficulty, date, status',
        location: join(this.chapterPath, 'README.md')
      });
    }

    // Check for concepts
    if (this.chapterStructure.concepts.length === 0) {
      this.gaps.push({
        category: 'concept',
        severity: 'hindering',
        description: 'Chapter has no concepts documentation',
        expectedContent: 'Concept files in concepts/ directory explaining key ideas',
        location: join(this.chapterPath, 'concepts')
      });
    }

    // Check for experiments
    if (this.chapterStructure.experiments.length === 0) {
      this.gaps.push({
        category: 'implementation',
        severity: 'hindering',
        description: 'Chapter has no experiments',
        expectedContent: 'Experiments in experiments/ directory for hands-on learning',
        location: join(this.chapterPath, 'experiments')
      });
    }

    // Check for learning objectives
    if (!/##?\s*[Ll]earning\s+[Oo]bjectives/.test(readme)
      && !/##?\s*[Ww]hat\s+[Yy]ou'?\s*[Ww]ill\s+[Ll]earn/.test(readme)) {
      this.gaps.push({
        category: 'other',
        severity: 'confusing',
        description: 'Chapter lacks clear learning objectives',
        expectedContent: 'A "Learning Objectives" or "What You Will Learn" section',
        location: join(this.chapterPath, 'README.md')
      });
    }
  }

  /**
   * Generate actionable recommendations based on gaps
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.gaps.some(g => g.category === 'prerequisite' && g.severity === 'blocking')) {
      recommendations.push('Add a comprehensive "Prerequisites" section to the chapter README');
    }

    if (this.gaps.some(g => g.category === 'concept' && g.severity === 'blocking')) {
      recommendations.push('Expand concepts/ directory to cover all required knowledge for the scenarios');
    }

    if (this.gaps.some(g => g.category === 'implementation' && g.severity === 'hindering')) {
      recommendations.push('Add runnable code examples to experiments/ to support practical learning');
    }

    if (this.gaps.some(g => g.category === 'tooling')) {
      recommendations.push('Include detailed setup/installation instructions for required tools');
    }

    if (this.gaps.some(g => g.category === 'other' && g.description.includes('frontmatter'))) {
      recommendations.push('Add standardized frontmatter to all markdown files');
    }

    if (recommendations.length === 0 && this.gaps.length === 0) {
      recommendations.push('Chapter content is well-structured for learner consumption');
    }

    return recommendations;
  }

  /**
   * Reset the learner state for a new chapter
   */
  reset(): void {
    this.chapterStructure = null;
    this.gaps = [];
    this.scenarioResults = [];
    this.startTime = 0;
  }
}

// ============================================================================
// Legacy Learner Class (for backward compatibility with coordinator)
// ============================================================================

export class Learner {
  private options: Required<LearnerOptions>;

  constructor(options: LearnerOptions) {
    this.options = {
      verbose: false,
      ...options,
    };
  }

  /**
   * Read chapter content from the specified path
   */
  async readChapter(path: string): Promise<LearnerChapterContent> {
    // Use the new LearnerAgent implementation
    const agent = new LearnerAgent(path, this.options.verbose);
    const structure = await agent.parseChapter(path);

    // Convert to legacy format
    const sections = new Map<string, string>();
    sections.set('readme', structure.readme);
    for (const concept of structure.concepts) {
      sections.set(concept.name, concept.content);
    }

    const codeExamples = new Map<string, string>();
    for (const exp of structure.experiments) {
      if (exp.readme) {
        codeExamples.set(exp.name, exp.readme);
      }
    }

    // Extract prerequisites from README
    const prerequisites: string[] = [];
    const prereqMatch = structure.readme.match(/##?\s*[Pp]rerequisites?\s*:?\s*([\s\S]+?)(?=\n##|\n---|\*$)/);
    if (prereqMatch) {
      const lines = prereqMatch[1].split('\n');
      for (const line of lines) {
        const trimmed = line.replace(/^[-*]\s*/, '').trim();
        if (trimmed) prerequisites.push(trimmed);
      }
    }

    return {
      title: structure.readme.split('\n')[0].replace(/^#\s*/, '') || 'Chapter Title',
      sections,
      codeExamples,
      prerequisites,
    };
  }

  /**
   * Attempt to execute a scenario based on chapter content
   */
  async attemptScenario(
    attempt: LearnerScenarioAttempt
  ): Promise<LearnerScenarioResult> {
    const { content, scenario, phase } = attempt;

    // Simulate scenario execution based on content and scenario description
    const blockers: string[] = [];
    const missingConcepts: string[] = [];
    const missingSteps: string[] = [];
    const ambiguousContent: string[] = [];

    // Check for prerequisites coverage
    for (const prereq of content.prerequisites) {
      const allText = Array.from(content.sections.values()).join(' ').toLowerCase();
      if (!allText.includes(prereq.toLowerCase()) && prereq.length > 3) {
        blockers.push(`Missing prerequisite coverage: ${prereq}`);
      }
    }

    // Check for step-by-step instructions
    const readme = content.sections.get('readme') || '';
    const hasStepByStep = /##?\s*[Ss]teps/.test(readme) || /##?\s*[Ii]nstructions/.test(readme);
    if (!hasStepByStep && phase === 'complex') {
      missingSteps.push('No step-by-step instructions found');
    }

    // Check for code examples
    if (content.codeExamples.size === 0 && phase === 'complex') {
      missingConcepts.push('No code examples or experiments found');
    }

    // Look for ambiguous terms (words that could have multiple meanings)
    const ambiguousPatterns = [/it\s/g, /this\s/g, /that\s/g];
    for (const pattern of ambiguousPatterns) {
      const matches = readme.match(pattern);
      if (matches && matches.length > 5) {
        ambiguousContent.push('High usage of ambiguous pronouns (it, this, that)');
        break;
      }
    }

    const success = blockers.length === 0 && missingConcepts.length === 0;
    const completion = success ? 100 : Math.max(0, 100 - (blockers.length * 30) - (missingConcepts.length * 20));

    if (this.options.verbose) {
      console.log(`[Learner] ${phase} scenario: ${success ? 'SUCCESS' : 'FAILED'} (${completion}%)`);
    }

    return {
      success,
      phase,
      completion,
      blockers,
      missingConcepts,
      missingSteps,
      ambiguousContent,
    };
  }

  /**
   * Identify gaps based on failed scenario attempt
   */
  identifyGaps(result: LearnerScenarioResult): GapReport {
    return {
      iteration: 0, // Will be set by coordinator
      phase: result.phase,
      blockers: result.blockers,
      missingConcepts: result.missingConcepts,
      missingSteps: result.missingSteps,
      ambiguousContent: result.ambiguousContent,
      suggestedAdditions: this.generateSuggestions(result),
    };
  }

  private generateSuggestions(result: LearnerScenarioResult): string[] {
    const suggestions: string[] = [];

    if (result.missingConcepts.length > 0) {
      suggestions.push(`Add concept documents for: ${result.missingConcepts.join(', ')}`);
    }

    if (result.missingSteps.length > 0) {
      suggestions.push('Add step-by-step instructions section');
    }

    if (result.ambiguousContent.length > 0) {
      suggestions.push('Clarify ambiguous pronouns and references');
    }

    return suggestions;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create scenarios from chapter frontmatter
 */
export async function scenariosFromChapter(chapterPath: string): Promise<Scenario[]> {
  const learner = new LearnerAgent(chapterPath);
  const structure = await learner.parseChapter(chapterPath);

  const scenarios: Scenario[] = [];

  // Extract scenarios from README if defined
  const readme = structure.readme;

  // Look for scenario sections
  const scenarioRegex = /###?\s*[Ss]cenario\s*:?\s*(.+?)\n([\s\S]+?)(?=###?\s|$)/g;
  let match;
  let scenarioId = 1;

  while ((match = scenarioRegex.exec(readme)) !== null) {
    scenarios.push({
      id: String(scenarioId++),
      title: match[1].trim(),
      description: extractDescription(match[2]),
      type: extractType(match[2]),
      difficulty: extractDifficulty(match[2]),
      prerequisites: extractPrerequisites(match[2]),
      expectedOutcome: extractOutcome(match[2])
    });
  }

  // If no explicit scenarios, create default ones based on content
  if (scenarios.length === 0) {
    if (structure.concepts.length > 0) {
      scenarios.push({
        id: '1',
        title: 'Understand Key Concepts',
        description: `Read and understand the ${structure.concepts.length} concept documents in this chapter`,
        type: 'conceptual',
        difficulty: 'beginner',
        prerequisites: [],
        expectedOutcome: 'Learner can explain the core concepts presented'
      });
    }

    if (structure.experiments.length > 0) {
      scenarios.push({
        id: String(scenarios.length + 1),
        title: 'Complete Hands-on Experiments',
        description: `Run and modify the ${structure.experiments.length} experiments in this chapter`,
        type: 'practical',
        difficulty: 'intermediate',
        prerequisites: ['Basic programming knowledge', 'Development environment setup'],
        expectedOutcome: 'Learner can successfully run and modify experiments'
      });
    }
  }

  return scenarios;
}

function extractDescription(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim() && !line.startsWith('|') && !line.startsWith('-')) {
      return line.trim();
    }
  }
  return 'Complete the described scenario';
}

function extractType(content: string): Scenario['type'] {
  const lower = content.toLowerCase();
  if (lower.includes('practical') || lower.includes('code') || lower.includes('implement')) {
    return 'practical';
  }
  if (lower.includes('debug') || lower.includes('fix') || lower.includes('error')) {
    return 'debugging';
  }
  return 'conceptual';
}

function extractDifficulty(content: string): Scenario['difficulty'] {
  const lower = content.toLowerCase();
  if (lower.includes('advanced') || lower.includes('expert')) {
    return 'advanced';
  }
  if (lower.includes('intermediate')) {
    return 'intermediate';
  }
  return 'beginner';
}

function extractPrerequisites(content: string): string[] {
  const prereqRegex = /\*?\*?[Pp]rerequisites?\*?\*?:?\s*([\s\S]+?)(?=\n\n|\n\*|\n-|$)/;
  const match = content.match(prereqRegex);
  if (match) {
    return match[1].split(/[\n,-]/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function extractOutcome(content: string): string {
  const outcomeRegex = /\*?\*?[Oo]utcome\*?\*?:?\s*([\s\S]+?)(?=\n\n|\n\*|\n-|$)/;
  const match = content.match(outcomeRegex);
  if (match) {
    return match[1].trim();
  }
  return 'Learner demonstrates understanding through practice';
}

/**
 * Main entry point for validating a chapter using the new API
 */
export async function validateChapterContent(chapterPath: string): Promise<GapReportNew> {
  const learner = new LearnerAgent(chapterPath);
  await learner.parseChapter(chapterPath);
  await learner.learnPrerequisites();

  const scenarios = await scenariosFromChapter(chapterPath);
  for (const scenario of scenarios) {
    await learner.attemptScenario(scenario);
  }

  return learner.generateGapReport();
}
