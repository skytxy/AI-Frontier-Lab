#!/usr/bin/env bash
# DEPRECATED: Use new-agent-topic.sh or new-algo-topic.sh instead

set -euo pipefail

echo "========================================"
echo "  WARNING: This script is deprecated"
echo "========================================"
echo ""
echo "Please use the new scripts instead:"
echo "  - For Agent topics: ./new-agent-topic.sh <number> <name>"
echo "  - For Algo topics:  ./new-algo-topic.sh <domain> <name> [year]"
echo ""
echo "Example:"
echo "  ./new-agent-topic.sh 005 langchain-integration"
echo "  ./new-algo-topic.sh transformer original 2017"
echo ""
exit 1
