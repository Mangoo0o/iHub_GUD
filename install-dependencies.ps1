# Install Dependencies Script for CSF IHUB
# This script fixes npm offline mode and installs dependencies

Write-Host "Installing dependencies for CSF IHUB..." -ForegroundColor Green

# Add Node.js to PATH
$nodePath = "C:\Program Files\nodejs"
if (Test-Path $nodePath) {
    $env:PATH = "$env:PATH;$nodePath"
} else {
    Write-Host "ERROR: Node.js not found at $nodePath" -ForegroundColor Red
    exit 1
}

# Navigate to project directory
$projectDir = "c:\Users\mildred\Desktop\ojt\CSF_IHUB"
Set-Location $projectDir

# Remove offline mode from npm config
Write-Host "`nFixing npm configuration..." -ForegroundColor Cyan
& "$nodePath\npm.cmd" config delete offline
& "$nodePath\npm.cmd" config set offline false

# Clean previous installations
Write-Host "`nCleaning previous installations..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    Write-Host "Removed node_modules" -ForegroundColor Gray
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
    Write-Host "Removed package-lock.json" -ForegroundColor Gray
}

# Install dependencies with legacy peer deps
Write-Host "`nInstalling dependencies (this may take a few minutes)..." -ForegroundColor Cyan
& "$nodePath\npm.cmd" install --legacy-peer-deps

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDependencies installed successfully!" -ForegroundColor Green
    Write-Host "`nYou can now run: npm start" -ForegroundColor Cyan
} else {
    Write-Host "`nInstallation failed. Trying alternative method..." -ForegroundColor Yellow
    
    # Try with force flag
    Write-Host "`nTrying with --force flag..." -ForegroundColor Cyan
    & "$nodePath\npm.cmd" install --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nDependencies installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "`nInstallation failed. Please check the error messages above." -ForegroundColor Red
        exit 1
    }
}
