#!/bin/bash
# Claude Code Notification Hook for Linux
# Place this file in ~/.claude/notify-linux.sh
# Don't forget to: chmod +x ~/.claude/notify-linux.sh
# Install libnotify if needed: sudo apt install libnotify-bin

# Read Hook input from stdin
INPUT=$(cat)

# Parse JSON using jq
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "Unknown"')
SUCCESS=$(echo "$INPUT" | jq -r '.tool_response.success // "true"')

# Determine notification type based on success
if [ "$SUCCESS" = "true" ]; then
    ICON="dialog-information"
    URGENCY="normal"
    TITLE_PREFIX="Success"
else
    ICON="dialog-error"
    URGENCY="critical"
    TITLE_PREFIX="Failed"
fi

# Send notification using notify-send (libnotify)
notify-send \
    --icon="$ICON" \
    --urgency="$URGENCY" \
    "Claude Code: $TITLE_PREFIX" \
    "Tool $TOOL_NAME ${SUCCESS:+succeeded}${SUCCESS:-failed}"

exit 0
