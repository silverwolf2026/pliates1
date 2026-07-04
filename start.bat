@echo off
title Pilates Health App
cd /d "%~dp0"
color 0a

echo ================================================
echo        Pilates Health Assessment - Starting
echo ================================================
echo.

echo Step 1/5: Checking Node.js...
where node >nul 2>&1 && echo [OK] Node.js found || (
    echo [FAIL] Node.js not found
    pause
    exit /b 1
)

echo Step 2/5: Checking PostgreSQL...
pg_isready >nul 2>&1 && echo [OK] PostgreSQL is running || (
    echo [FAIL] PostgreSQL is not running
    echo Please start PostgreSQL first
    pause
    exit /b 1
)

echo Step 3/5: Database migration...
cd /d "%~dp0backend"
set PGPASSWORD=1
call npx.cmd prisma db push --accept-data-loss
if errorlevel 1 (
    echo [FAIL] Migration failed
    pause
    exit /b 1
)
echo [OK] Database ready
echo.

echo Step 4/5: Starting backend...
start "Pilates-Backend" cmd /c "cd /d "%~dp0backend" && npm run dev"
echo [OK] Backend starting on port 3001
echo.

echo Step 5/5: Starting frontend...
start "Pilates-Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"
echo [OK] Frontend starting on port 5173
echo.

echo Waiting for backend...
:wait1
timeout /t 2 /nobreak >nul
curl -s http://localhost:3001/api/v1/health >nul 2>&1
if errorlevel 1 goto wait1
echo [OK] Backend is ready!

echo Waiting for frontend...
:wait2
timeout /t 2 /nobreak >nul
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 goto wait2
echo [OK] Frontend is ready!

echo.
echo ================================================
echo   All services are running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo ================================================
start http://localhost:5173

echo.
echo Press ENTER to stop...
pause >nul

echo Stopping...
taskkill /f /fi "WindowTitle eq Pilates-Backend" >nul 2>&1
taskkill /f /fi "WindowTitle eq Pilates-Frontend" >nul 2>&1
echo [OK] Stopped. Goodbye!
timeout /t 2 >nul
