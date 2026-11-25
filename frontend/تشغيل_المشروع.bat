@echo off
chcp 65001 > nul
title المزارع السعيد - تشغيل الواجهة الأمامية

echo ================================================================
echo       🍃 جاري تشغيل واجهة المزارع السعيد (Happy Farmer) 🍃
echo ================================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [خطأ] برنامج Node.js غير مثبت على جهازك!
    echo يرجى تحميله وتثبيته من الرابط: https://nodejs.org
    echo.
    pause
    exit /b
)

if not exist "node_modules\.bin\vite.cmd" (
    echo [1/2] جاري تثبيت الحزم والمكتبات اللازمة تلقائياً...
    call npm install
    echo.
)

echo [2/2] جاري فتح المتصفح وتشغيل خادم التطوير...
start "" "http://localhost:5173"
echo.
echo الخادم يعمل الآن على الرابط: http://localhost:5173
echo لا تغلق هذه النافذة أثناء تصفحك للموقع.
echo ================================================================
echo.

call npx vite --host 0.0.0.0 --port 5173

pause
