#!/usr/bin/env node

/**
 * 🔍 בדיקת גרסאות Playwright
 * מוודא שהגרסאות בקוד ו-Docker תואמות
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 בודק גרסאות Playwright...\n');

// בדיקת package.json
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const playwrightVersion = packageJson.dependencies?.playwright;
    
    console.log('📦 package.json:');
    console.log(`   Playwright: ${playwrightVersion || 'לא נמצא'}`);
} catch (error) {
    console.log('❌ שגיאה בקריאת package.json:', error.message);
}

// בדיקת package-minimal.json
try {
    const packageMinimal = JSON.parse(fs.readFileSync('package-minimal.json', 'utf8'));
    const playwrightMinimal = packageMinimal.dependencies?.playwright;
    
    console.log('\n📦 package-minimal.json:');
    console.log(`   Playwright: ${playwrightMinimal || 'לא נמצא'}`);
} catch (error) {
    console.log('❌ שגיאה בקריאת package-minimal.json:', error.message);
}

// בדיקת Dockerfile
try {
    const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
    const dockerMatch = dockerfile.match(/FROM mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-jammy/);
    
    console.log('\n🐳 Dockerfile:');
    if (dockerMatch) {
        console.log(`   Playwright: v${dockerMatch[1]}`);
    } else {
        console.log('   Playwright: לא נמצא');
    }
} catch (error) {
    console.log('❌ שגיאה בקריאת Dockerfile:', error.message);
}

console.log('\n✅ בדיקה הושלמה!');
console.log('\n💡 אם יש אי התאמה, עדכן את הקבצים:');
console.log('   1. Dockerfile - גרסת image');
console.log('   2. package.json - גרסת dependency');
console.log('   3. package-minimal.json - גרסת dependency');
