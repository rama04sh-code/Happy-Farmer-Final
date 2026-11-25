@echo off
chcp 65001 > nul
title Happy Farmer - Preview Production Build

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org
    pause
    exit /b
)

start "" "http://localhost:4173"
call npx vite preview --port 4173
pause
