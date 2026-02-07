#!/usr/bin/env bash
# Usage: ./new-agent-topic.sh <number> "<topic-name>"
# Example: ./new-agent-topic.sh 005 "langchain-integration"

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TEMPLATE_DIR="$REPO_ROOT/agent/_template"

if [ $# -ne 2 ]; then
    echo "Usage: $0 <number> <topic-name>"
    echo "Example: $0 005 langchain-integration"
    exit 1
fi

NUMBER="$1"
NAME="$2"
PADDED=$(printf "%03d" "$NUMBER")
TOPIC_DIR="$REPO_ROOT/agent/agent-${PADDED}-${NAME}"

if [ -d "$TOPIC_DIR" ]; then
    echo "Error: $TOPIC_DIR already exists."
    exit 1
fi

# Copy template
cp -r "$TEMPLATE_DIR" "$TOPIC_DIR"

# Replace placeholders in README.md
TODAY=$(date +%Y-%m-%d)
sed -i '' "s/YYYY-MM-DD/$TODAY/g" "$TOPIC_DIR/README.md"
sed -i '' "s/Topic Title/${NAME}/g" "$TOPIC_DIR/README.md"

# Add sort field
sed -i '' "/^status:/a\\
sort: ${TODAY//-/.}
" "$TOPIC_DIR/README.md"

echo "Created new agent topic: $TOPIC_DIR"
echo "Next steps:"
echo "  1. Edit $TOPIC_DIR/README.md - update title, tags, category, difficulty"
echo "  2. Start exploring!"
