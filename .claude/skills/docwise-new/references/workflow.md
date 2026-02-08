# Docwise: New - Workflow

Collaborative dialogue workflow for the `:new` subcommand.

## The Process

**Understanding the Topic:**
- WebSearch for topic overview: What is this technology?
- WebSearch for practical use cases
- Ask questions one at a time to understand scope
- Identify what aspects matter most to the user

**Collaborative Scope Design:**
- Propose core topics to be covered
- Present conversationally: "Here's what I'm planning to cover..."
- Describe what readers should be able to do after reading
- Iterate on topics and goals until aligned

**Example Scope Design:**
- "I'm planning to cover MCP tool creation, resource access, and stdio transport. After reading, users should be able to build a basic server. Does this scope match what you need?"

**Setting Up and Running Creation:**
- Once scope is aligned, create sandbox directory
- Detect chapter language and setup isolation
- Run the dual-agent loop: Author creates, Learner validates
- Present findings incrementally as they emerge

**Post-Creation Discussion:**
- Share what Learner discovered (gaps, confusions, successes)
- Discuss whether content covered the right scope
- Ask if user wants to expand or adjust specific areas
- Generate final artifacts (README, learning-log)

## Iteration Behavior

| Iteration | Author Action | Learner Action |
|-----------|--------------|----------------|
| 1 | Create initial content | Validate from scratch |
| 2+ | Fix reported gaps | Re-validate only changes |
| Final | N/A | Generate artifacts |

## Completion Conditions

Learner reports COMPLETE when:
- All documented steps can be followed
- Practical tasks execute successfully
- No blockers remain
- Gaps are minor or none

## Max Iterations

Default: 5 (configurable in `.docwise/config.yaml`)

Exceeding max iterations with remaining gaps indicates:
- Content may need restructuring
- Scope may be too complex for single session
- Consider splitting into smaller scenarios
