# PowerShell script to set up Tailwind CSS properly in VS Code

Write-Host "Setting up Tailwind CSS for VS Code..." -ForegroundColor Green

# Install necessary VS Code extensions
Write-Host "Installing VS Code extensions..." -ForegroundColor Yellow
code --install-extension bradlc.vscode-tailwindcss
code --install-extension csstools.postcss
code --install-extension stylelint.vscode-stylelint

# Install npm packages (if not already installed)
Write-Host "Installing required npm packages..." -ForegroundColor Yellow
npm install -D tailwindcss@3.3.3 postcss@8.4.27 autoprefixer@10.4.14 stylelint stylelint-config-standard

# Restart VS Code
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Please restart VS Code completely for changes to take effect." -ForegroundColor Cyan
Write-Host "After restart, the @tailwind and @apply directives should no longer show warnings." -ForegroundColor Cyan 