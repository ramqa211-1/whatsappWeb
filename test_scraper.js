#!/usr/bin/env node

/**
 * Test LinkedIn Scraper with Visual Debugging
 * סקריפט בדיקה עם דפדפן נראה לדיבוג
 */

const { chromium } = require('playwright');

async function testScraper() {
    console.log('🧪 מתחיל סקריפט בדיקה...');
    
    const browser = await chromium.launch({
        headless: false, // 👀 דפדפן נראה
        slowMo: 2000,    // האטה של 2 שניות בין פעולות
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    try {
        console.log('🌐 נווט ל-LinkedIn...');
        await page.goto('https://www.linkedin.com/login');
        
        console.log('📝 ממלא פרטי התחברות...');
        await page.fill('#username', 'ramqaveles@gmail.com');
        await page.fill('#password', '2918rmvt');
        
        console.log('🔑 לוחץ על התחברות...');
        await page.click('button[type="submit"]');
        
        console.log('⏳ ממתין לטעינת הדף...');
        await page.waitForTimeout(10000); // המתנה של 10 שניות
        
        console.log('📸 צילום מסך אחרי התחברות...');
        await page.screenshot({ path: 'after_login.png', fullPage: true });
        
        console.log('🔍 מנווט לחיפוש...');
        await page.goto('https://www.linkedin.com/search/results/people/?keywords=Python%20Developer');
        
        console.log('⏳ ממתין לטעינת דף החיפוש...');
        await page.waitForTimeout(5000);
        
        console.log('📸 צילום מסך של דף החיפוש...');
        await page.screenshot({ path: 'search_page.png', fullPage: true });
        
        // בדיקה אם יש תוצאות
        const hasResults = await page.$('[data-view-name=\"search-entity-result-universal-template\"]');
        if (hasResults) {
            console.log('✅ נמצאו תוצאות חיפוש!');
            
            const count = await page.$$eval('[data-view-name=\"search-entity-result-universal-template\"]', elements => elements.length);
            console.log(`📊 מספר תוצאות: ${count}`);
            
        } else {
            console.log('❌ לא נמצאו תוצאות חיפוש');
            
            // בדיקה אם יש אלמנטים אחרים
            const bodyText = await page.textContent('body');
            console.log('📄 תוכן הדף (100 תווים ראשונים):');
            console.log(bodyText.substring(0, 100) + '...');
        }
        
        console.log('⏳ ממתין 30 שניות לפני סגירה (אתה יכול לבדוק את הדפדפן)...');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('💥 שגיאה:', error.message);
        await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
    } finally {
        await browser.close();
        console.log('🧹 דפדפן נסגר');
    }
}

testScraper().catch(console.error);

