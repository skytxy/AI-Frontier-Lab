#!/bin/bash
# Chapter Content Validator Shell Wrapper
# Provides convenient access to the Python validator

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"

# Default values
CHAPTER=""
SCENARIO=""
SIMPLE_SCENARIO=""
COMPLEX_SCENARIO=""
MAX_ITERATIONS=3

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --chapter)
      CHAPTER="$2"
      shift 2
      ;;
    --scenario)
      SCENARIO="$2"
      shift 2
      ;;
    --simple-scenario)
      SIMPLE_SCENARIO="$2"
      shift 2
      ;;
    --complex-scenario)
      COMPLEX_SCENARIO="$2"
      shift 2
      ;;
    --max-iterations)
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# Validate required arguments
if [[ -z "$CHAPTER" ]]; then
  echo "Error: --chapter is required" >&2
  echo "Usage: $0 --chapter=<chapter-id> [--scenario=<type>]" >&2
  exit 1
fi

# Run Python validator
python3 "${SCRIPT_DIR}/validator.py" \
  --chapter="$CHAPTER" \
  --repo-root="$REPO_ROOT"
