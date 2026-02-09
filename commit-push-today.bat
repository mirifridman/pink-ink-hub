@echo off
cd /d "C:\Users\miria\Desktop\גיבויים\מגדלור\25.1"
git add .
git commit -m "fix: logo and favicon updates + approval request modal fix

- Replace Sparkles icon with logo in login page
- Update favicon to use logo (favicon.ico)
- Fix ApprovalRequestModal to use useEffect instead of useState for loading team members
- Add logo to password reset page"
git push
pause
