#!/usr/bin/env node

/**
 * Manual LinkedIn Scraper - גרסה להרצה ידנית
 * הרץ: node manual_scraper.js
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function manualScrape() {
    console.log('🎯 סקריפט LinkedIn ידני');
    console.log('='.repeat(40));
    
    const browser = await chromium.launch({
        headless: false, // 👀 תראה את הדפדפן
        slowMo: 500
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('🔐 מתחבר ל-LinkedIn...');
        await page.goto('https://www.linkedin.com/login');
        
        // מילוי פרטי התחברות
        await page.fill('#username', 'ramqaveles@gmail.com');
        await page.fill('#password', '2918rmvt');
        await page.click('button[type="submit"]');
        
        console.log('⏳ ממתין להתחברות... (15 שניות)');
        await page.waitForTimeout(15000);
        
        console.log('🔍 מחפש מפתחי Python...');
        await page.goto('https://www.linkedin.com/search/results/people/?keywords=Python%20Developer');
        
        console.log('⏳ ממתין לטעינת תוצאות... (10 שניות)');
        await page.waitForTimeout(10000);
        
        console.log('📊 מחלץ נתונים...');
        
        // ניסיון מספר סלקטורים שונים
        const developers = await page.evaluate(() => {
            const results = [];
            
            // ניסיון מספר סלקטורים
            const selectors = [
                '[data-view-name="search-entity-result-universal-template"]',
                '.entity-result__item',
                '.search-result__wrapper',
                '[data-test-id="search-result"]',
                '.reusable-search__result-container'
            ];
            
            let profileCards = [];
            for (const selector of selectors) {
                profileCards = document.querySelectorAll(selector);
                if (profileCards.length > 0) {
                    console.log(`נמצא עם הסלקטור: ${selector}`);
                    break;
                }
            }
            
            console.log(`נמצאו ${profileCards.length} כרטיסי פרופיל`);
            
            profileCards.forEach((card, index) => {
                try {
                    // ניסיון מספר סלקטורים לשם
                    const nameSelectors = [
                        '.entity-result__title-text a span[aria-hidden="true"]',
                        '.entity-result__title-text span',
                        '.search-result__title a',
                        'h3 a span',
                        '.t-16 strong'
                    ];
                    
                    let nameElement = null;
                    for (const selector of nameSelectors) {
                        nameElement = card.querySelector(selector);
                        if (nameElement) break;
                    }
                    
                    // ניסיון מספר סלקטורים לתפקיד
                    const titleSelectors = [
                        '.entity-result__primary-subtitle',
                        '.search-result__headline',
                        '.t-14 span',
                        '.subline-level-1'
                    ];
                    
                    let titleElement = null;
                    for (const selector of titleSelectors) {
                        titleElement = card.querySelector(selector);
                        if (titleElement) break;
                    }
                    
                    if (nameElement && nameElement.textContent) {
                        const name = nameElement.textContent.trim();
                        const title = titleElement ? titleElement.textContent.trim() : 'לא צוין';
                        
                        if (name && name.length > 2) {
                            results.push({
                                index: index + 1,
                                name: name,
                                title: title,
                                scrapedAt: new Date().toLocaleString('he-IL')
                            });
                        }
                    }
                } catch (e) {
                    console.log(`שגיאה בפרופיל ${index + 1}:`, e.message);
                }
            });
            
            return results;
        });
        
        console.log(`\\n🎉 נמצאו ${developers.length} מפתחי Python!`);
        console.log('='.repeat(50));
        
        if (developers.length > 0) {
            developers.forEach(dev => {
                console.log(`${dev.index}. ${dev.name}`);
                console.log(`   תפקיד: ${dev.title}`);
                console.log('');
            });
            
            // שמירת הקבצים
            const timestamp = new Date().toISOString().split('T')[0];
            const outputDir = 'linkedin_results';
            
            // יצירת תיקייה
            try {
                await fs.mkdir(outputDir, { recursive: true });
            } catch (e) {}
            
            // שמירה כ-JSON
            const jsonFile = path.join(outputDir, `python_developers_${timestamp}.json`);
            await fs.writeFile(jsonFile, JSON.stringify({
                scrapedAt: new Date().toISOString(),
                totalResults: developers.length,
                developers: developers
            }, null, 2), 'utf8');
            
            // שמירה כ-CSV
            const csvFile = path.join(outputDir, `python_developers_${timestamp}.csv`);
            let csvContent = 'מספר,שם,תפקיד,זמן חילוץ\\n';
            developers.forEach(dev => {
                csvContent += `${dev.index},"${dev.name}","${dev.title}","${dev.scrapedAt}"\\n`;
            });
            await fs.writeFile(csvFile, csvContent, 'utf8');
            
            console.log('💾 הקבצים נשמרו ב:');
            console.log(`   📁 תיקייה: ${path.resolve(outputDir)}`);
            console.log(`   📄 JSON: ${jsonFile}`);
            console.log(`   📊 CSV: ${csvFile}`);
            
        } else {
            console.log('❌ לא נמצאו תוצאות - יכול להיות שצריך להמתין יותר או שהסלקטורים השתנו');
        }
        
        console.log('\\n⏳ הדפדפן יישאר פתוח למשך 30 שניות לבדיקה...');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('💥 שגיאה:', error.message);
        
        // צילום מסך לדיבוג
        try {
            await page.screenshot({ path: 'debug_screenshot.png', fullPage: true });
            console.log('📸 צילום מסך נשמר: debug_screenshot.png');
        } catch (e) {}
    } finally {
        await browser.close();
        console.log('🧹 דפדפן נסגר');
    }
}

// הרצת הסקריפט
console.log('🚀 מתחיל סקריפט ידני...');
manualScrape().catch(console.error);

