/**
 * Public API for the Chapter Content Validator skill
 */

import { Coordinator, type CoordinatorOptions, type ValidationResult } from './lib/coordinator.js';

export interface ValidateChapterParams extends Omit<CoordinatorOptions, 'workingDirectory'> {
  workingDirectory?: string;
}

/**
 * Validate a chapter by running learner scenarios and fixing identified gaps
 *
 * @param params - Validation parameters
 * @returns Validation result with success status and gap reports
 */
export async function validateChapter(
  params: ValidateChapterParams
): Promise<ValidationResult> {
  const coordinator = new Coordinator(params);
  const result = await coordinator.run();

  // If verbose, print summary
  if (params.verbose) {
    console.log(coordinator.getSummary(result));
  }

  return result;
}
