# Setup script for CSF IHUB React Native Project
# This script adds Node.js to PATH and installs dependencies

Write-Host "Setting up CSF IHUB project..." -ForegroundColor Green

# Add Node.js to PATH for this session
$nodePath = "C:\Program Files\nodejs"
if (Test-Path $nodePath) {
    $env:PATH = "$env:PATH;$nodePath"
    Write-Host "Node.js path added to session PATH" -ForegroundColor Yellow
} else {
    Write-Host "ERROR: Node.js not found at $nodePath" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Verify Node.js and npm
Write-Host "`nVerifying Node.js installation..." -ForegroundColor Cyan
$nodeVersion = & "$nodePath\node.exe" --version
$npmVersion = & "$nodePath\npm.cmd" --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host "npm version: $npmVersion" -ForegroundColor Green

# Navigate to project directory
$projectDir = "c:\Users\mildred\Desktop\ojt\CSF_IHUB"
if (Test-Path $projectDir) {
    Set-Location $projectDir
    Write-Host "`nChanged to project directory: $projectDir" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: Project directory not found: $projectDir" -ForegroundColor Red
    exit 1
}

# Clear npm cache if needed
Write-Host "`nClearing npm cache..." -ForegroundColor Cyan
& "$nodePath\npm.cmd" cache clean --force

# Configure npm to use online mode
Write-Host "Configuring npm..." -ForegroundColor Cyan
& "$nodePath\npm.cmd" config set cache "" --global
& "$nodePath\npm.cmd" config delete cache

# Clean previous installations if they exist
if (Test-Path "node_modules") {
    Write-Host "`nRemoving old node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Write-Host "Removing package-lock.json..." -ForegroundColor Yellow
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
}

# Install dependencies using legacy peer deps to avoid conflicts
Write-Host "`nInstalling project dependencies..." -ForegroundColor Cyan
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
& "$nodePath\npm.cmd" install --legacy-peer-deps

# Install Expo packages with correct versions
Write-Host "`nInstalling Expo-compatible packages..." -ForegroundColor Cyan
& "$nodePath\npm.cmd" exec expo install --fix

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Dependencies installed successfully!" -ForegroundColor Green
    Write-Host "`nYou can now run: npm start" -ForegroundColor Cyan
} else {
    Write-Host "`n✗ Installation failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}
