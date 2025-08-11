#!/usr/bin/env node

/**
 * Create Portable LinkedIn Scraper
 * יוצר גרסה portable של הסקריפט
 */

const fs = require('fs').promises;
const path = require('path');

async function createPortablePackage() {
    console.log('📦 יוצר חבילה portable...');
    
    const packageContent = `
# LinkedIn Python Scraper - Portable
## הרצה פשוטה בלי התקנות

### מה כלול:
- ✅ הסקריפט המלא
- ✅ הוראות הרצה
- ✅ קבצי דוגמה

### איך להריץ:
1. הורד Node.js מ-https://nodejs.org/
2. פתח Command Prompt
3. רץ: npm install
4. רץ: node screenshot_scraper.js

### או:
השתמש בגרסת הענן: [קישור לשרת]
`;

    await fs.writeFile('PORTABLE_README.txt', packageContent, 'utf8');
    console.log('✅ נוצר: PORTABLE_README.txt');
    
    // יצירת batch file להרצה מהירה
    const batchContent = `@echo off
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

pause`;

    await fs.writeFile('RUN_SCRAPER.bat', batchContent, 'utf8');
    console.log('✅ נוצר: RUN_SCRAPER.bat');
    
    console.log('\\n🎉 חבילה portable מוכנה!');
    console.log('📁 קבצים:');
    console.log('   - screenshot_scraper.js (הסקריפט הראשי)');
    console.log('   - RUN_SCRAPER.bat (הרצה מהירה)');
    console.log('   - PORTABLE_README.txt (הוראות)');
}

createPortablePackage();

