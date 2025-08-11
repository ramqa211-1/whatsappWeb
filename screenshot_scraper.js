#!/usr/bin/env node

/**
 * Screenshot-based LinkedIn Scraper
 * צילום מסך + חילוץ נתונים מהתמונה
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function screenshotScraper() {
    console.log('📸 סקריפט LinkedIn עם צילום מסך');
    console.log('='.repeat(50));
    
    const browser = await chromium.launch({
        headless: false, // 👀 דפדפן נראה
        args: [
            '--start-maximized',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    });
    
    const page = await browser.newPage({
        viewport: null // מסך מלא
    });
    
    try {
        console.log('🔐 מתחבר ל-LinkedIn...');
        await page.goto('https://www.linkedin.com/login');
        
        // מילוי פרטי התחברות
        await page.fill('#username', 'ramqaveles@gmail.com');
        await page.fill('#password', '2918rmvt');
        await page.click('button[type="submit"]');
        
        console.log('⏳ ממתין להתחברות... (20 שניות)');
        await page.waitForTimeout(20000);
        
        console.log('🔍 מחפש מפתחי Python...');
        await page.goto('https://www.linkedin.com/search/results/people/?keywords=Python%20Developer');
        
        console.log('⏳ ממתין לטעינת תוצאות... (30 שניות)');
        await page.waitForTimeout(30000);
        
        // יצירת תיקיית screenshots
        const screenshotDir = 'screenshots';
        try {
            await fs.mkdir(screenshotDir, { recursive: true });
        } catch (e) {}
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = path.join(screenshotDir, `linkedin_results_${timestamp}.png`);
        
        console.log('📸 צולם את התוצאות...');
        await page.screenshot({ 
            path: screenshotPath, 
            fullPage: true,
            type: 'png'
        });
        
        console.log(`✅ צילום מסך נשמר: ${screenshotPath}`);
        console.log(`📁 מיקום מלא: ${path.resolve(screenshotPath)}`);
        
        // צילום נוסף של האזור הראשי בלבד
        const mainScreenshot = path.join(screenshotDir, `linkedin_main_${timestamp}.png`);
        
        try {
            // חיפוש אזור התוצאות הראשי
            const resultsContainer = await page.$('.search-results-container, .search-results__list, main');
            if (resultsContainer) {
                await resultsContainer.screenshot({ 
                    path: mainScreenshot,
                    type: 'png'
                });
                console.log(`✅ צילום אזור ראשי: ${mainScreenshot}`);
            }
        } catch (e) {
            console.log('לא ניתן לצלם אזור ראשי נפרד');
        }
        
        // ניסיון חילוץ נתונים גם כן (לשם השוואה)
        console.log('🔍 ניסיון חילוץ נתונים מהדום...');
        const domResults = await page.evaluate(() => {
            const results = [];
            const cards = document.querySelectorAll('[data-view-name=\"search-entity-result-universal-template\"]');
            
            cards.forEach((card, index) => {
                try {
                    // חיפוש כל הטקסטים בכרטיס
                    const allText = card.innerText || card.textContent || '';
                    const lines = allText.split('\\n').filter(line => line.trim().length > 0);
                    
                    if (lines.length > 0) {
                        results.push({
                            index: index + 1,
                            allText: allText,
                            lines: lines,
                            html: card.innerHTML.substring(0, 500) // רק התחלה
                        });
                    }
                } catch (e) {
                    console.log(`שגיאה בכרטיס ${index + 1}`);
                }
            });
            
            return results;
        });
        
        console.log(`\\n📊 נמצאו ${domResults.length} כרטיסי תוצאות בדום:`);
        domResults.forEach((result, index) => {
            console.log(`\\nכרטיס ${result.index}:`);
            console.log(`טקסט: ${result.allText.substring(0, 100)}...`);
            console.log(`שורות: ${result.lines.slice(0, 3).join(' | ')}`);
        });
        
        // שמירת נתוני הדום לקובץ
        const domDataFile = path.join(screenshotDir, `dom_data_${timestamp}.json`);
        await fs.writeFile(domDataFile, JSON.stringify({
            scrapedAt: new Date().toISOString(),
            totalResults: domResults.length,
            results: domResults
        }, null, 2), 'utf8');
        
        console.log(`💾 נתוני DOM נשמרו: ${domDataFile}`);
        
        console.log('\\n🎯 סיכום:');
        console.log(`📸 צילום מלא: ${path.resolve(screenshotPath)}`);
        console.log(`📸 צילום ראשי: ${path.resolve(mainScreenshot)}`);
        console.log(`💾 נתוני DOM: ${path.resolve(domDataFile)}`);
        
        console.log('\\n📝 עכשיו אתה יכול:');
        console.log('1. לפתוח את התמונות ולראות את התוצאות');
        console.log('2. להשתמש ב-OCR כדי לחלץ שמות מהתמונה');
        console.log('3. לבדוק את נתוני ה-DOM בקובץ JSON');
        
        console.log('\\n⏳ הדפדפן יישאר פתוח למשך 60 שניות...');
        await page.waitForTimeout(60000);
        
    } catch (error) {
        console.error('💥 שגיאה:', error.message);
        
        // צילום מסך במקרה של שגיאה
        try {
            await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
            console.log('📸 צילום שגיאה נשמר: error_screenshot.png');
        } catch (e) {}
    } finally {
        await browser.close();
        console.log('🧹 דפדפן נסגר');
    }
}

// הרצת הסקריפט
console.log('🚀 מתחיל סקריפט צילום מסך...');
screenshotScraper().catch(console.error);

