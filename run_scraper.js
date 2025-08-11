#!/usr/bin/env node

/**
 * Enhanced LinkedIn Scraper Runner
 * גרסה משופרת עם טיפול טוב יותר בשגיאות
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function runSimpleScraper() {
    console.log('🚀 מתחיל סקריפט LinkedIn פשוט...');
    
    let browser, page;
    
    try {
        // פתיחת דפדפן עם הגדרות מותאמות
        browser = await chromium.launch({
            headless: false, // 👀 נראה את הדפדפן לדיבוג
            slowMo: 1000,    // האטה לדיבוג
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        page = await browser.newPage({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        
        // הגדלת timeout
        page.setDefaultTimeout(60000); // 60 שניות
        
        console.log('🌐 נווט ל-LinkedIn...');
        await page.goto('https://www.linkedin.com/login', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });
        
        console.log('📝 ממלא פרטי התחברות...');
        await page.fill('#username', 'ramqaveles@gmail.com');
        await page.fill('#password', '2918rmvt');
        
        console.log('🔑 לוחץ על כפתור התחברות...');
        await page.click('button[type="submit"]');
        
        // המתנה לטעינת הדף הראשי
        console.log('⏳ ממתין לטעינת הדף הראשי...');
        await page.waitForURL('**/feed/**', { timeout: 30000 });
        
        console.log('✅ התחברות הצליחה!');
        
        // מעבר לחיפוש
        console.log('🔍 מחפש Python Developers...');
        const searchUrl = 'https://www.linkedin.com/search/results/people/?keywords=Python%20Developer';
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
        
        // המתנה לטעינת תוצאות
        await page.waitForSelector('[data-view-name="search-entity-result-universal-template"]', { timeout: 15000 });
        
        // חילוץ נתונים
        console.log('📊 מחלץ נתונים...');
        const developers = await page.evaluate(() => {
            const results = [];
            const profileCards = document.querySelectorAll('[data-view-name="search-entity-result-universal-template"]');
            
            profileCards.forEach((card, index) => {
                try {
                    const nameElement = card.querySelector('.entity-result__title-text a span[aria-hidden="true"]');
                    const titleElement = card.querySelector('.entity-result__primary-subtitle');
                    const locationElement = card.querySelector('.entity-result__secondary-subtitle');
                    
                    if (nameElement && titleElement) {
                        results.push({
                            index: index + 1,
                            name: nameElement.textContent.trim(),
                            title: titleElement.textContent.trim(),
                            location: locationElement ? locationElement.textContent.trim() : 'N/A',
                            scrapedAt: new Date().toISOString()
                        });
                    }
                } catch (e) {
                    console.log('שגיאה בחילוץ פרופיל:', e.message);
                }
            });
            
            return results;
        });
        
        console.log(`\n🎯 נמצאו ${developers.length} מפתחי Python:`);
        console.log('='.repeat(50));
        
        developers.forEach(dev => {
            console.log(`${dev.index}. ${dev.name}`);
            console.log(`   תפקיד: ${dev.title}`);
            console.log(`   מיקום: ${dev.location}`);
            console.log('');
        });
        
        // שמירה לקובץ
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `python_developers_${timestamp}.json`;
        
        await fs.writeFile(filename, JSON.stringify({
            scrapedAt: new Date().toISOString(),
            totalResults: developers.length,
            developers: developers
        }, null, 2), 'utf8');
        
        console.log(`💾 התוצאות נשמרו בקובץ: ${filename}`);
        
        // המתנה קצרה לפני סגירה
        console.log('⏳ ממתין 5 שניות לפני סגירה...');
        await page.waitForTimeout(5000);
        
    } catch (error) {
        console.error('💥 שגיאה:', error.message);
        
        if (page) {
            try {
                console.log('📸 צילום מסך לדיבוג...');
                await page.screenshot({ path: 'debug_screenshot.png', fullPage: true });
                console.log('💾 צילום מסך נשמר: debug_screenshot.png');
            } catch (screenshotError) {
                console.log('לא ניתן לצלם מסך');
            }
        }
    } finally {
        if (browser) {
            await browser.close();
            console.log('🧹 דפדפן נסגר');
        }
    }
}

// הפעלת הסקריפט
runSimpleScraper().then(() => {
    console.log('\n✨ הסקריפט הסתיים בהצלחה!');
}).catch(error => {
    console.error('💥 שגיאה כללית:', error.message);
});

