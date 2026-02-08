#!/bin/bash
# Claude Code Notification Hook for macOS
# Place this file in ~/.claude/notify-macos.sh
# Don't forget to: chmod +x ~/.claude/notify-macos.sh

# Read Hook input from stdin
INPUT=$(cat)

# Parse JSON using jq
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "Unknown"')
SUCCESS=$(echo "$INPUT" | jq -r '.tool_response.success // "true"')

# Determine notification type based on success
if [ "$SUCCESS" = "true" ]; then
    TITLE="Claude Code: Task Complete"
    MESSAGE="Tool $TOOL_NAME executed successfully"
    SOUND="Glass"
else
    TITLE="Claude Code: Task Failed"
    MESSAGE="Tool $TOOL_NAME execution failed"
    SOUND="Basso"
fi

# Send notification using osascript (built-in, no installation needed)
osascript -e "display notification \"$MESSAGE\" with title \"$TITLE\" sound name \"$SOUND\""

exit 0
