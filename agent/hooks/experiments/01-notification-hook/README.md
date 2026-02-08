---
title: "实验 01：任务完成通知 Hook"
experiment: 1
parent: hooks
tags: [hooks, notifications, cross-platform, automation]
difficulty: beginner
prerequisites:
  - macOS: `jq` (via `brew install jq`)
  - Linux: `jq` (via package manager)
  - Windows: PowerShell 7+ (includes `ConvertFrom-Json`)
---

# Exp-01: 任务完成通知 Hook

## 学习目标

完成本实验后，你将能够：

- [ ] 配置 Claude Code Hooks 实现任务完成通知
- [ ] 编写跨平台通知脚本（macOS/Linux/Windows）
- [ ] 理解 Hook 事件流和输入/输出机制
- [ ] 使用不同通知类型区分任务结果

## 为什么需要通知 Hook？

**问题场景**：

1. 你启动了一个长时间的 Claude 任务（如重构整个代码库）
2. 你切换到其他工作（浏览网页、处理邮件）
3. 你需要反复检查终端确认任务是否完成

**解决方案**：

配置 Hook 在任务完成时发送桌面通知，让你可以放心切换工作。

## 前置准备

在开始之前，请确保系统已安装 `jq`（用于 JSON 解析）：

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt install jq

# Fedora/RHEL
sudo dnf install jq

# Arch Linux
sudo pacman -S jq

# Windows
# PowerShell 7+ 内置 ConvertFrom-Json，无需额外安装
```

> **说明**: bash 脚本使用 `jq` 解析 Hook 传入的 JSON 数据。Windows PowerShell 用户可直接使用内置的 `ConvertFrom-Json`。

## 实验步骤

### Step 1: 创建通知脚本

#### macOS 通知脚本

创建 `~/.claude/notify-macos.sh`：

```bash
#!/bin/bash

# 从 stdin 读取 Hook 输入
INPUT=$(cat)

# 解析 JSON（需要 jq）
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
SUCCESS=$(echo "$INPUT" | jq -r '.tool_response.success // true')

# 根据结果选择通知类型
if [ "$SUCCESS" = "true" ]; then
    TITLE="Claude Code: 任务完成"
    MESSAGE="工具 $TOOL_NAME 执行成功"
    SOUND="Glass"  # macOS 系统声音
else
    TITLE="Claude Code: 任务失败"
    MESSAGE="工具 $TOOL_NAME 执行失败"
    SOUND="Basso"  # 错误声音
fi

# 方式 1: 使用 osascript（推荐，无需额外安装）
osascript -e "display notification \"$MESSAGE\" with title \"$TITLE\" sound name \"$SOUND\""

# 方式 2: 使用 terminal-notifier（需要先安装）
# brew install terminal-notifier
# terminal-notifier -title "$TITLE" -message "$MESSAGE" -sound "$SOUND"

exit 0
```

#### Linux 通知脚本

创建 `~/.claude/notify-linux.sh`：

```bash
#!/bin/bash

# 从 stdin 读取 Hook 输入
INPUT=$(cat)

# 解析 JSON
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
SUCCESS=$(echo "$INPUT" | jq -r '.tool_response.success // true')

# 根据结果选择通知图标
if [ "$SUCCESS" = "true" ]; then
    ICON="dialog-information"
    URGENCY="normal"
else
    ICON="dialog-error"
    URGENCY="critical"
fi

# 使用 notify-send（libnotify）
# 安装：sudo apt install libnotify-bin 或 sudo dnf install libnotify
notify-send \
    --icon="$ICON" \
    --urgency="$URGENCY" \
    "Claude Code: $TOOL_NAME" \
    "任务执行${SUCCESS:+成功}${SUCCESS:-失败}"

exit 0
```

#### PowerShell 通知脚本（Windows）

创建 `$env:USERPROFILE\.claude\notify-windows.ps1`：

```powershell
# 从 stdin 读取 Hook 输入
$input = [Console]::In.ReadToEnd()

# 解析 JSON（PowerShell 7+ 有 ConvertFrom-Json）
$data = $input | ConvertFrom-Json

$toolName = $data.tool_name
$success = if ($data.tool_response.success) { $true } else { $false }

# 加载 Windows Forms 程序集
Add-Type -AssemblyName System.Windows.Forms

# 创建通知对象
$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Icon = [System.Drawing.SystemIcons]::Information
$notify.Visible = $true

# 根据结果设置图标
if ($success) {
    $notify.Icon = [System.Drawing.SystemIcons]::Information
    $title = "Claude Code: 任务完成"
} else {
    $notify.Icon = [System.Drawing.SystemIcons]::Error
    $title = "Claude Code: 任务失败"
}

# 显示通知
$notify.ShowBalloonTip(
    3000,  # 显示时间（毫秒）
    $title,
    "工具 $toolName 执行${SUCCESS:+成功}${SUCCESS:-失败}",
    [System.Windows.Forms.ToolTipIcon]::Info
)

# 等待用户查看或超时
Start-Sleep -Seconds 3

# 清理
$notify.Dispose()
```

### Step 2: 赋予执行权限

```bash
# macOS/Linux
chmod +x ~/.claude/notify-macos.sh
chmod +x ~/.claude/notify-linux.sh
```

### Step 3: 配置 Hook

编辑 `~/.claude/settings.json`（全局）或 `.claude/settings.json`（项目级）：

#### macOS 配置

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/notify-macos.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code 完成响应\" with title \"任务完成\" sound name \"Glass\"'"
          }
        ]
      }
    ]
  }
}
```

#### Linux 配置

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/notify-linux.sh"
          }
        ]
      }
    ]
  }
}
```

#### Windows 配置

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "pwsh -ExecutionPolicy Bypass -File \"$env:USERPROFILE\\.claude\\notify-windows.ps1\""
          }
        ]
      }
    ]
  }
}
```

### Step 4: 测试 Hook

#### 快速独立测试（无需 Claude Code 会话）

在配置 Hook 之前，可以先手动测试脚本是否正常工作：

```bash
# 测试成功通知
echo '{"tool_name":"Write","tool_response":{"success":true}}' | ~/.claude/notify-macos.sh

# 测试失败通知
echo '{"tool_name":"Bash","tool_response":{"success":false}}' | ~/.claude/notify-macos.sh
```

Linux 用户：
```bash
echo '{"tool_name":"Write","tool_response":{"success":true}}' | ~/.claude/notify-linux.sh
```

Windows PowerShell 用户：
```powershell
'{"tool_name":"Write","tool_response":{"success":true}}' | & "$env:USERPROFILE\.claude\notify-windows.ps1"
```

#### 在 Claude Code 中测试

1. **保存配置后重启 Claude Code 或运行 `/hooks` 重新加载**

2. **测试简单通知**：
   ```
   让 Claude 创建一个测试文件
   ```
   你应该看到桌面通知弹出。

3. **测试 Stop Hook**：
   ```
   让 Claude 完成一个简单任务
   ```
   Stop Hook 应该在 Claude 完成响应时触发。

## 高级配置

### 仅对特定工具通知

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash|Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/notify.sh"
          }
        ]
      }
    ]
  }
}
```

### 区分成功/失败声音

修改脚本，根据 `tool_response.success` 播放不同声音：

```bash
#!/bin/bash
INPUT=$(cat)
SUCCESS=$(echo "$INPUT" | jq -r '.tool_response.success // true')

if [ "$SUCCESS" = "true" ]; then
    SOUND="/System/Library/Sounds/Glass.aiff"
else
    SOUND="/System/Library/Sounds/Basso.aiff"
fi

afplay "$SOUND" 2>/dev/null || echo "Sound failed"
```

### 通知频率限制（避免刷屏）

```bash
#!/bin/bash
LOCKFILE="/tmp/claude-notify-lock"
LAST_RUN=0

# 检查距离上次通知是否不足 5 秒
if [ -f "$LOCKFILE" ]; then
    LAST_RUN=$(cat "$LOCKFILE")
fi

NOW=$(date +%s)
if [ $((NOW - LAST_RUN)) -lt 5 ]; then
    exit 0  # 跳过此次通知
fi

echo "$NOW" > "$LOCKFILE"

# 发送通知...
```

## 跨平台通用脚本

如果你需要一个跨平台工作的脚本，可以用 Python：

```python
#!/usr/bin/env python3
"""
Cross-platform notification script for Claude Code Hooks
Supports: macOS, Linux, Windows
"""

import json
import sys
import platform
import subprocess


def send_notification(title: str, message: str, success: bool = True):
    """Send platform-specific desktop notification"""
    system = platform.system()

    if system == "Darwin":  # macOS
        if success:
            sound = "Glass"
        else:
            sound = "Basso"
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
        if success:
            flags = 0x00000001  # NIIF_INFO
        else:
            flags = 0x00000002  # NIIF_WARNING
        ctypes.windll.user32.MessageBoxW(0, message, title, flags)


def main():
    # Read Hook input from stdin
    input_data = json.load(sys.stdin)

    tool_name = input_data.get("tool_name", "Unknown")
    success = input_data.get("tool_response", {}).get("success", True)

    if success:
        title = "Claude Code: 任务完成"
        message = f"工具 {tool_name} 执行成功"
    else:
        title = "Claude Code: 任务失败"
        message = f"工具 {tool_name} 执行失败"

    send_notification(title, message, success)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

保存为 `~/.claude/notify.py`，配置为：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/notify.py"
          }
        ]
      }
    ]
  }
}
```

## 验证清单

- [ ] 脚本已创建并赋予执行权限
- [ ] Hook 配置已添加到 settings.json
- [ ] 使用 `/hooks` 命令确认 Hook 已加载
- [ ] 执行测试任务时收到通知
- [ ] 不同操作结果（成功/失败）显示不同通知

## 常见问题

### Q: 通知没有弹出？

**排查步骤**：

1. 检查脚本是否可执行：`ls -l ~/.claude/notify.sh`
2. 检查 Hook 是否加载：在 Claude Code 中运行 `/hooks`
3. 启用 verbose 模式（按 `Ctrl+O`）查看 Hook 错误
4. 手动测试脚本：
   ```bash
   echo '{"tool_name":"Write","tool_response":{"success":true}}' | ~/.claude/notify.sh
   ```

### Q: macOS 提示 "osascript: command not found"？

osascript 是 macOS 内置工具，不应该找不到。如果确实报错：

1. 确认你在 macOS 上运行（而非通过远程 SSH）
2. 尝试完整路径：`/usr/bin/osascript`

### Q: Linux 提示 "notify-send: command not found"？

安装 libnotify：

```bash
# Ubuntu/Debian
sudo apt install libnotify-bin

# Fedora/RHEL
sudo dnf install libnotify

# Arch Linux
sudo pacman -S libnotify
```

### Q: Windows PowerShell 脚本执行策略错误？

```powershell
# 临时允许脚本执行
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# 或者使用 -ExecutionPolicy Bypass 参数
pwsh -ExecutionPolicy Bypass -File script.ps1
```

### Q: 通知太频繁，很烦人？

添加频率限制（见上文"通知频率限制"），或者：

1. 只对特定工具通知（使用 `matcher`）
2. 只在 Stop 事件通知（而非每个工具调用）
3. 添加工作时间检测（非工作时间不通知）

## 延伸实验

完成基础通知后，可以尝试：

1. **添加通知分组**：将相关操作的通知合并
2. **通知历史**：记录所有通知到日志文件
3. **自定义声音**：根据任务类型播放不同声音
4. **通知操作按钮**：某些平台支持带操作按钮的通知
5. **集成第三方服务**：如 Slack、Discord、Telegram 通知

## 参考资料

- [Claude Code Hooks 官方文档](https://code.claude.com/docs/en/hooks-guide)
- [terminal-notifier GitHub](https://github.com/julienXX/terminal-notifier)
- [libnotify 文档](https://developer.gnome.org/libnotify/)
- [跨平台通知库 - node-notifier](https://github.com/mikaelbr/node-notifier)
