#!/usr/bin/env bash
# Usage: ./new-algo-topic.sh <domain> "<tech-name>" ["paper-year"]
# Example: ./new-algo-topic.sh transformer "original" 2017

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TEMPLATE_DIR="$REPO_ROOT/algo/_template"

if [ $# -lt 2 ]; then
    echo "Usage: $0 <domain> <tech-name> [paper-year]"
    echo "Example: $0 transformer original 2017"
    exit 1
fi

DOMAIN="$1"
NAME="$2"
YEAR="${3:-$(date +%Y)}"

# Validate domain exists
DOMAIN_DIR="$REPO_ROOT/algo/$DOMAIN"
if [ ! -d "$DOMAIN_DIR" ]; then
    echo "Creating domain directory: $DOMAIN_DIR"
    mkdir -p "$DOMAIN_DIR"
fi

TOPIC_DIR="$DOMAIN_DIR/$NAME"

if [ -d "$TOPIC_DIR" ]; then
    echo "Error: $TOPIC_DIR already exists."
    exit 1
fi

# Copy template
cp -r "$TEMPLATE_DIR" "$TOPIC_DIR"

# Replace placeholders in README.md
TODAY=$(date +%Y-%m-%d)
perl -pi -e "s/YYYY-MM-DD/$TODAY/g" "$TOPIC_DIR/README.md"
perl -pi -e "s/Topic Title/${NAME}/g" "$TOPIC_DIR/README.md"

# Update sort field
if [ -n "$YEAR" ]; then
    perl -pi -e "s/sort: YYYY.MM/sort: ${YEAR}.01/" "$TOPIC_DIR/README.md"
    perl -pi -e "s/paper_year: YYYY/paper_year: ${YEAR}/" "$TOPIC_DIR/README.md"
fi

echo "Created new algo topic: $TOPIC_DIR"
echo "Next steps:"
echo "  1. Edit $TOPIC_DIR/README.md - update title, tags, category, difficulty"
echo "  2. Add paper information if applicable"
echo "  3. Start exploring!"
