@echo off
title FlexBnb Launcher

echo ========================================
echo   Starting FlexBnb - Full Stack App
echo ========================================
echo.

:: Start Backend in a new CMD window
echo Starting Django Backend on http://localhost:8000 ...
start "FlexBnb Backend" cmd /k "cd /d "%~dp0backend\flexbnb_backend" && echo Activating virtual environment... && call newenv\Scripts\activate && echo Starting Django server... && python manage.py runserver"

:: Wait 3 seconds for backend to start
timeout /t 3 /nobreak > nul

:: Start Frontend in a new CMD window
echo Starting Next.js Frontend on http://localhost:3000 ...
start "FlexBnb Frontend" cmd /k "cd /d "%~dp0" && echo Installing packages if needed... && npm install && echo Starting Next.js server... && npm run dev"

echo.
echo ========================================
echo   Both servers are starting up!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo You can close this window.
pause
