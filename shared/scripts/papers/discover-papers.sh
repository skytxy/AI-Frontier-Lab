#!/usr/bin/env bash
# Paper discovery script - scans arXiv, HuggingFace, Paper Digest
# Usage: ./discover-papers.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
CANDIDATES_DIR="$REPO_ROOT/docs/candidates"
TODAY=$(date +%Y-%m-%d)
OUTPUT_FILE="$CANDIDATES_DIR/$TODAY-candidates.md"

mkdir -p "$CANDIDATES_DIR"

echo "Starting paper discovery for $TODAY..."

# TODO: Implement actual discovery logic
# - Query arXiv API for cs.AI, cs.LG, cs.CL
# - Check HuggingFace trending models
# - Query Paper Digest API

# Create placeholder output
cat > "$OUTPUT_FILE" << OUTEOF
---
date: $TODAY
scanner: "auto-discover-v1"
---

# 候选论文推荐

## 📊 高置信度候选

_暂无候选 - 脚本待实现_

## 🤔 中等置信度候选
_待实现_

## 📋 低置信度候选
_待实现_
OUTEOF

echo "Discovery complete: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "  1. Review candidates"
echo "  2. Create proposal: cp docs/proposals/_template.md docs/proposals/PROPO-$(date +%Y)-001-title.md"
