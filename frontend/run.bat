@echo off
chcp 65001 > nul
title Happy Farmer - Launch Frontend

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org
    pause
    exit /b
)

if not exist "node_modules\.bin\vite.cmd" (
    echo Installing dependencies...
    call npm install
)

start "" "http://localhost:5173"
call npx vite --host 0.0.0.0 --port 5173
pause
