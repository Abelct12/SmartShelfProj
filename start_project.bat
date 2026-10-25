@echo off
setlocal enabledelayedexpansion

:: 1. Always set working directory to project root reliably
cd /d "%~dp0"
set "PROJECT_ROOT=%~dp0"
if "%PROJECT_ROOT:~-1%"=="\" set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"
set "PYTHONPATH=%PROJECT_ROOT%"

echo =====================================================================
echo  AI and Data Science-Based Food Shelf Life Prediction System
echo  One-Command Localhost Startup
echo =====================================================================
echo.

:: 2. Verify folder structure
if not exist "backend\app\main.py" (
    echo [!] ERROR: backend\app\main.py not found. Please ensure you are in the project root.
    exit /b 1
)
if not exist "frontend\package.json" (
    echo [!] ERROR: frontend\package.json not found.
    exit /b 1
)

:: 3. Detect Python runtime (Check venv first, then system Python)
set "PYTHON_EXE=python"
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
    echo [*] Detected Python virtual environment in .venv
) else if exist "venv\Scripts\python.exe" (
    set "PYTHON_EXE=venv\Scripts\python.exe"
    echo [*] Detected Python virtual environment in venv
) else (
    %PYTHON_EXE% --version >nul 2>&1
    if errorlevel 1 (
        echo [!] ERROR: Python was not found in PATH. Please install Python 3.10+ and add it to PATH.
        exit /b 1
    )
)

:: 4. Verify Node / npm
where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo [!] ERROR: npm.cmd was not found. Please ensure Node.js is installed.
    exit /b 1
)

:: 5. Verify Machine Learning Artifacts
if not exist "models\food_shelf_life_pipeline.joblib" (
    echo [*] ML model artifact not found. Initializing dataset and training models...
    %PYTHON_EXE% scripts\generate_dataset.py
    %PYTHON_EXE% scripts\train_model.py
    %PYTHON_EXE% scripts\seed_demo_predictions.py
)

:: 6. Check if Backend is ALREADY running on port 8000
%PYTHON_EXE% -c "import urllib.request, sys; sys.exit(0 if getattr(urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=1.5), 'status', 0) == 200 else 1)" >nul 2>&1
if not errorlevel 1 (
    echo [OK] Backend service is ALREADY running on http://127.0.0.1:8000. Reusing existing instance.
    goto CHECK_FRONTEND
)

echo [*] Starting FastAPI Backend on http://127.0.0.1:8000...
start "FoodShelf-Backend" /D "%PROJECT_ROOT%" cmd /k "title FoodShelf-Backend && %PYTHON_EXE% -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

:CHECK_FRONTEND
:: 7. Check if Frontend is ALREADY running on port 5173
%PYTHON_EXE% -c "import urllib.request, sys; sys.exit(0 if getattr(urllib.request.urlopen('http://127.0.0.1:5173/', timeout=1.5), 'status', 0) == 200 else 1)" >nul 2>&1
if not errorlevel 1 (
    echo [OK] Frontend service is ALREADY running on http://127.0.0.1:5173. Reusing existing instance.
    goto VERIFY_SERVICES
)

echo [*] Starting Vite Frontend on http://127.0.0.1:5173...
start "FoodShelf-Frontend" /D "%PROJECT_ROOT%\frontend" cmd /k "title FoodShelf-Frontend && npm.cmd run dev -- --host 127.0.0.1 --port 5173"

:VERIFY_SERVICES
:: 8. Readiness Verification Loop (Max 25 seconds)
echo [*] Verifying application readiness...
set /a attempts=0

:VERIFY_LOOP
set /a attempts+=1
powershell -NoProfile -Command "Start-Sleep -Seconds 1"

set "BACKEND_OK=0"
%PYTHON_EXE% -c "import urllib.request, sys; sys.exit(0 if getattr(urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=1.5), 'status', 0) == 200 else 1)" >nul 2>&1
if not errorlevel 1 set "BACKEND_OK=1"

set "FRONTEND_OK=0"
%PYTHON_EXE% -c "import urllib.request, sys; sys.exit(0 if getattr(urllib.request.urlopen('http://127.0.0.1:5173/', timeout=1.5), 'status', 0) == 200 else 1)" >nul 2>&1
if not errorlevel 1 set "FRONTEND_OK=1"

echo [*] Attempt !attempts!/25: Backend=!BACKEND_OK!, Frontend=!FRONTEND_OK!...

if "!BACKEND_OK!"=="1" if "!FRONTEND_OK!"=="1" (
    echo [OK] Both services confirmed healthy and responsive!
    goto ALL_READY
)

if !attempts! LSS 25 goto VERIFY_LOOP

:: If timed out, show actual failure diagnostics
echo.
echo =====================================================================
echo  [!] STARTUP FAILURE: Application failed readiness verification!
echo =====================================================================
if "!BACKEND_OK!"=="0" echo  [X] Backend failed to respond on http://127.0.0.1:8000/api/health
if "!BACKEND_OK!"=="1" echo  [OK] Backend is healthy on http://127.0.0.1:8000
if "!FRONTEND_OK!"=="0" echo  [X] Frontend failed to respond on http://127.0.0.1:5173/
if "!FRONTEND_OK!"=="1" echo  [OK] Frontend is ready on http://127.0.0.1:5173
echo.
echo Please inspect the open "FoodShelf-Backend" and "FoodShelf-Frontend"
echo command windows to view the full runtime error logs.
echo =====================================================================
exit /b 1

:ALL_READY
echo.
echo =====================================================================
echo  AI Food Shelf Life Prediction System is LIVE and READY!
echo =====================================================================
echo   Frontend Dashboard:      http://127.0.0.1:5173
echo   Backend REST API:        http://127.0.0.1:8000
echo   Interactive API Docs:    http://127.0.0.1:8000/docs
echo   Backend Health Check:    http://127.0.0.1:8000/api/health
echo =====================================================================
echo.
echo  To stop all services safely, run:
echo    .\stop_project.bat
echo.
