@echo off
title AuraDesk Launcher
echo.
echo   ✨ Starting AuraDesk...
echo.

:: Start backend
start "AuraDesk Backend" cmd /k "cd /d "%~dp0server" && node index.js"
timeout /t 3 /nobreak >nul

:: Start frontend
start "AuraDesk Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"
timeout /t 4 /nobreak >nul

:: Open browser
start http://localhost:5173

echo   ✅ AuraDesk is running!
echo   🌐 Frontend: http://localhost:5173
echo   🔧 Backend:  http://localhost:3001
echo.
