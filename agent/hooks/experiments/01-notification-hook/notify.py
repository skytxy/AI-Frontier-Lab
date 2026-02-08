#!/usr/bin/env python3
"""
Claude Code Notification Hook - Cross-platform
Supports: macOS, Linux, Windows
Place this file in ~/.claude/notify.py
"""

import json
import sys
import platform
import subprocess


def send_notification(title: str, message: str, success: bool = True) -> None:
    """Send platform-specific desktop notification"""
    system = platform.system()

    if system == "Darwin":  # macOS
        sound = "Glass" if success else "Basso"
        subprocess.run([
            "osascript",
            "-e",
            f'display notification "{message}" with title "{title}" sound name "{sound}"'
        ])

    elif system == "Linux":
        icon = "dialog-information" if success else "dialog-error"
        urgency = "normal" if success else "critical"
        subprocess.run([
            "notify-send",
            "--icon", icon,
            "--urgency", urgency,
            title, message
        ])

    elif system == "Windows":
        import ctypes
        flags = 0x00000001 if success else 0x00000002
        ctypes.windll.user32.MessageBoxW(0, message, title, flags)


def main() -> int:
    # Read Hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        # If no valid input, show generic notification
        send_notification("Claude Code", "Task completed")
        return 0

    tool_name = input_data.get("tool_name", "Unknown")
    success = input_data.get("tool_response", {}).get("success", True)

    if success:
        title = "Claude Code: Task Complete"
        message = f"Tool {tool_name} executed successfully"
    else:
        title = "Claude Code: Task Failed"
        message = f"Tool {tool_name} execution failed"

    send_notification(title, message, success)
    return 0


if __name__ == "__main__":
    sys.exit(main())
