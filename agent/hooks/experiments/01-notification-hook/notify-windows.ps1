# Claude Code Notification Hook for Windows
# Place this file in ~/.claude/notify-windows.ps1
# Run: Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Read Hook input from stdin
$input = [Console]::In.ReadToEnd()

# Parse JSON
$data = $input | ConvertFrom-Json

$toolName = if ($data.tool_name) { $data.tool_name } else { "Unknown" }
$success = if ($data.tool_response.success -eq $true) { $true } else { $false }

# Load Windows Forms
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Create notification icon
$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Visible = $true

# Set icon based on result
if ($success) {
    $notify.Icon = [System.Drawing.SystemIcons]::Information
    $title = "Claude Code: Task Complete"
    $tooltipIcon = [System.Windows.Forms.ToolTipIcon]::Info
} else {
    $notify.Icon = [System.Drawing.SystemIcons]::Error
    $title = "Claude Code: Task Failed"
    $tooltipIcon = [System.Windows.Forms.ToolTipIcon]::Error
}

# Show balloon notification
$notify.ShowBalloonTip(
    3000,  # display duration in milliseconds
    $title,
    "Tool $toolName execution $(if ($success) { 'succeeded' } else { 'failed' })",
    $tooltipIcon
)

# Wait for notification to be seen
Start-Sleep -Seconds 3

# Cleanup
$notify.Dispose()
