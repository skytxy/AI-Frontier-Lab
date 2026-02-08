# Docwise: Check - Check Categories

Detailed definitions of each validation check type.

## Links

### External Links
Verify all external URLs are accessible.

**Check method**: HTTP HEAD request or curl
**Pass criteria**: 2xx-3xx status code
**Fail criteria**: 4xx-5xx status code, timeout, DNS failure

**Examples**:
```bash
# Check link status
curl -s -o /dev/null -w "%{http_code}" https://example.com
# Expected: 200, 301, 302
# Failed: 404, 500, timeout
```

### Internal Links
Verify all internal cross-references point to existing files.

**Check method**: File existence check
**Pass criteria**: File exists at referenced path
**Fail criteria**: File not found

**Note**: Internal links use web routes, not physical paths.

### Link Extension Format
Verify internal links don't include `.md` extension.

**Check method**: Pattern matching
**Pass criteria**: No `.md` in web route links
**Fail criteria**: `.md` present (causes 404 on built site)

**Rationale**: Astro generates extensionless routes.

**Correct**: `/topics/mcp-basics/concepts/protocol`
**Incorrect**: `/topics/mcp-basics/concepts/protocol.md`

## Logic

### Step Sequence
Verify documented steps can be followed in order.

**Check method**: Learner executes steps sequentially
**Pass criteria**: All steps complete without blockers
**Fail criteria**: Step references missing prerequisite

### Contradictions
Verify content has no internal contradictions.

**Check method**: Content analysis
**Pass criteria**: No contradictory statements
**Fail criteria**: Statement A contradicts statement B

### Referenced Concepts
Verify all referenced concepts are explained.

**Check method**: Cross-reference check
**Pass criteria**: Concept exists in content or declared prerequisites
**Fail criteria**: Concept mentioned but not explained

### Prerequisites
Verify prerequisites are declared and accessible.

**Check method**: Dependency check
**Pass criteria**: All prerequisites exist and are readable
**Fail criteria**: Prerequisite not found

## Content

### Completeness
Verify all concepts are adequately explained.

**Check method**: Zero-knowledge learner understanding test
**Pass criteria**: Learner can explain concept after reading
**Fail criteria**: Learner has unanswered questions

### Clarity
Verify content is understandable by target audience.

**Check method**: Learner attempts to explain content
**Pass criteria**: Learner's explanation matches intent
**Fail criteria**: Learner misunderstands or confused

### Examples
Verify code examples are provided and work.

**Check method**: Execute code examples in sandbox
**Pass criteria**: Code runs without errors
**Fail criteria**: Code has syntax or runtime errors

## Theme (requires web verification)

Checks for visual rendering issues in Light and Dark modes.

**Verification method**: Build site, inspect in browser

### Code Blocks
- **Pass**: Syntax highlighting works in both themes
- **Fail**: Code unreadable in one theme

### Inline Code
- **Pass**: Contrast sufficient in both themes (>=4.5:1)
- **Fail**: Color-dependent meaning, poor contrast

### Tables
- **Pass**: Borders visible in both themes
- **Fail**: Borders invisible in one theme

### Images
- **Pass**: Legible in both themes
- **Fail**: Hardcoded background makes text unreadable

**Build command**: `cd site && npm run build:no-check`

## Priority Levels

| Priority | Issues | Action |
|----------|--------|--------|
| critical | broken_links, code_errors, blocker_steps | Block publishing |
| important | missing_concepts, unclear_steps | Fix before publishing |
| minor | formatting, minor_clarity_issues | Fix if time |
