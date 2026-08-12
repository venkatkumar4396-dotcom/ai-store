@echo off
title NexusForge Local Dev
echo ========================================================
echo   Starting NexusForge Development Servers (Bare-Metal)
echo   Laptop: Acer Nitro V Optimized
echo ========================================================

REM Run backend in a new window
echo Starting Backend (SQLite DB) in a new window...
start "Backend Service" cmd /k "cd /d %~dp0backend && npm install && npx prisma generate && npx prisma db push && npm run seed && npm run dev"

REM Run frontend in a new window
echo Starting Frontend (Next.js) in a new window...
start "Frontend Service" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

REM Run WhatsApp Bot Standalone in a new window
echo Starting WhatsApp Bot Standalone (Next.js) in a new window...
start "WhatsApp Bot Standalone" cmd /k "cd /d %~dp0whatsapp-bot && npm install && npm run dev -- -p 3001"

REM Run AI service in a new window
echo Starting Python AI Service in a new window...
start "AI Service" cmd /k "cd /d %~dp0ai-service && run.bat"

echo ========================================================
echo   All services have been launched in separate windows!
echo   - Frontend: http://localhost:3000
echo   - WhatsApp Bot Standalone: http://localhost:3001
echo   - Backend: http://localhost:5000
echo   - AI Service: http://localhost:8001
echo ========================================================
pause
