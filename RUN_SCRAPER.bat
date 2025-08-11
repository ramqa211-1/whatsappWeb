@echo off
echo Starting LinkedIn Scraper...
echo.
echo Checking Node.js...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found! Please install from https://nodejs.org/
    pause
    exit /b 1
)

echo Installing dependencies...
npm install playwright node-cron

echo Running scraper...
node screenshot_scraper.js

pause