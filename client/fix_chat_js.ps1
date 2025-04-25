# PowerShell script to fix the duplicate handleUserSelect function in Chat.js

# Make a backup of the original file
Copy-Item src/components/chat/Chat.js src/components/chat/Chat.js.backup

# Read the contents of the file
$content = Get-Content -Path src/components/chat/Chat.js -Raw

# Find the duplicate function declaration
$duplicateFunction = 'const handleUserSelect = \(user\) => {'

# Find position of duplicate function
$pattern = '\n\s*' + [regex]::Escape($duplicateFunction) + '[\s\S]*?\n\s*\}\;\s*\n'

# Replace the entire duplicate function with a comment
$replacement = "`n  // Removed duplicate handleUserSelect function that was causing compilation error`n`n"

# Apply the replacement
$updatedContent = [regex]::Replace($content, $pattern, $replacement)

# Write the modified content back to the file
$updatedContent | Set-Content -Path src/components/chat/Chat.js

Write-Host "Fixed Chat.js by removing the duplicate handleUserSelect function" 