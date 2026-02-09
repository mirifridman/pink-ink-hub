@echo off
cd /d "%~dp0"
git add .
git commit -m "Add task recurrence functionality: dynamic date pickers, validation, and alert notifications"
git push origin main
echo Done!
