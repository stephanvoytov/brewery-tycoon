@echo off
cd /d "%~dp0"
echo Installing dependencies...
pip install -r backend\requirements.txt
echo.
echo Starting Brewery Tycoon server...
echo Open http://localhost:8000 in your browser
echo.
uvicorn backend.main:app --reload --port 8000
pause