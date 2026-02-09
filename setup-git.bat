@echo off
cd /d "C:\Users\miria\Desktop\גיבויים\מגדלור\25.1"

echo Initializing Git repository...
if not exist .git (
    git init
)

echo Adding remote repository...
git remote remove origin 2>nul
git remote add origin git@github.com:Business-by-aRLi/executive-hub.git

echo Adding all files...
git add .

echo Committing changes...
git commit -m "Add task recurrence functionality with dynamic date pickers and validation"

echo Setting main branch...
git branch -M main

echo Pushing to GitHub...
git push -u origin main

echo Done!
pause
