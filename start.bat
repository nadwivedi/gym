@echo off
rem Double-click to start the gym software. Keep this window open while you use it.
cd /d "%~dp0"
if not exist "backend\node_modules" call npm --prefix backend install
if not exist "frontend\node_modules" call npm --prefix frontend install
if not exist "frontend\dist" call npm --prefix frontend run build
node backend\src\server.js
pause
