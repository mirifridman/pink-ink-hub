# Setup Git and push to GitHub
cd "C:\Users\miria\Desktop\גיבויים\מגדלור\25.1"

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "Initializing Git repository..."
    git init
}

# Check if remote exists
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Adding remote repository..."
    git remote add origin git@github.com:Business-by-aRLi/executive-hub.git
} else {
    Write-Host "Remote already exists, updating..."
    git remote set-url origin git@github.com:Business-by-aRLi/executive-hub.git
}

# Add all files
Write-Host "Adding all files..."
git add .

# Commit changes
Write-Host "Committing changes..."
git commit -m "Add task recurrence functionality with dynamic date pickers and validation"

# Push to GitHub
Write-Host "Pushing to GitHub..."
git branch -M main
git push -u origin main

Write-Host "Done!"
