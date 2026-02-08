# Docwise Practical Scenario Rollout Checklist

## Phase 1: Core Infrastructure (Tasks 1-3)
- [x] Type extensions added (ScenarioConfig, ChapterOverview, SandboxConfig, LearnerArtifact)
- [x] Config loader enhanced with language detection
- [x] Sandbox manager created
- [x] All TypeScript checks pass (with skipLibCheck for pre-existing issues)

## Phase 2: Display & Confirmation (Tasks 4-7)
- [x] Overview display utility created
- [x] docwise-check skill updated with new flow
- [x] docwise-improve skill updated with new flow
- [x] docwise-new skill updated with new flow
- [x] Skills refactored to follow skill-creator best practices
  - [x] All skills converted to English
  - [x] Progressive disclosure (references/ directories created)
  - [x] SKILL.md files under 100 lines
  - [x] Chinese project-specific templates moved to paradigm.md

## Phase 3: Execution (Tasks 8-9)
- [x] Scenario loader integrated
- [x] Gap prioritizer added
- [x] Artifact generator created
- [x] Learner artifact templates defined

## Phase 4: Documentation (Tasks 10-11, 13)
- [x] Paradigm updated with document status convention
- [x] Paradigm updated with scenario vs document relationship
- [x] Paradigm updated with scenario confirmation template
- [x] Config schema extended with language field
- [x] README documentation updated with new capabilities

## Phase 5: Testing (Task 12)
- [x] Integration tests written
- [ ] Manual testing on mcp-deep-dive chapter
- [ ] All tests pass

## Phase 6: Rollout
- [ ] Skills tested on sample chapter
- [ ] Feedback collected
- [ ] Adjustments made based on feedback

## Summary

**Completed**: 18/22 items (82%)

**Remaining**:
- Manual testing on real chapter
- Feedback collection
- Final adjustments

## Commits

1. `feat: add scenario generation types to docwise`
2. `feat: add scenario loader and language detection to config system`
3. `feat: add sandbox manager with language isolation`
4. `feat: add overview display utility with completed warning`
5. `feat: update docwise-check with scenario generation and sandbox support`
6. `feat: update docwise-improve with gap-focused scenario generation`
7. `feat: update docwise-new with websearch-based scenario generation`
8. `refactor: align docwise subcommands with skill-creator best practices`
9. `feat: add gap priority filtering system`
10. `feat: add learner artifact generator`
11. `docs: add scenario-document relationship principles to paradigm`
12. `config: add language field to chapter declarations`
13. `test: add integration test plan for scenario system`
14. `docs: update docwise README with scenario system features`
