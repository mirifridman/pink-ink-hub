@echo off
cd /d "C:\Users\miria\Desktop\גיבויים\מגדלור\25.1"
git add .
git commit -m "feat: notifications system with email summary

- Add notifications table and hooks
- Add notification bell icon with dropdown
- Add notifications page with filtering
- Add daily email summary via Resend (cron 18:00)
- Add automatic notifications for task assignment and completion
- Add hourly deadline reminder check
- Auto-link employees to user profiles by email"
git push
pause
