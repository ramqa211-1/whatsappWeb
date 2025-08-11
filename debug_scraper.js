#!/usr/bin/env node

/**
 * Debug LinkedIn Scraper - עם המתנה ארוכה יותר
 * הרץ: node debug_scraper.js
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function debugScrape() {
    console.log('🐛 סקריפט דיבוג LinkedIn');
    console.log('='.repeat(40));
    
    const browser = await chromium.launch({
        headless: false, // 👀 תראה את הדפדפן
        slowMo: 1000,    // האטה כדי לראות מה קורה
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
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
        
        console.log('⏳ ממתין לטעינת תוצאות... (30 שניות!) 🕐');
        await page.waitForTimeout(30000);
        
        console.log('📊 מתחיל חילוץ נתונים...');
        
        // בדיקה מה יש בעמוד
        const pageInfo = await page.evaluate(() => {
            const info = {
                title: document.title,
                url: window.location.href,
                bodyText: document.body.innerText.substring(0, 200)
            };
            
            // בדיקת סלקטורים שונים
            const selectors = [
                '[data-view-name="search-entity-result-universal-template"]',
                '.entity-result__item',
                '.search-result__wrapper',
                '[data-test-id="search-result"]',
                '.reusable-search__result-container',
                '.search-results-container',
                '[data-chameleon-result-urn]',
                '.artdeco-entity-lockup'
            ];
            
            info.selectorResults = {};
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                info.selectorResults[selector] = elements.length;
            });
            
            return info;
        });
        
        console.log('📄 מידע על הדף:');
        console.log(`   כותרת: ${pageInfo.title}`);
        console.log(`   URL: ${pageInfo.url}`);
        console.log(`   תחילת התוכן: ${pageInfo.bodyText}...`);
        console.log('');
        console.log('🔍 תוצאות סלקטורים:');
        Object.entries(pageInfo.selectorResults).forEach(([selector, count]) => {
            if (count > 0) {
                console.log(`   ✅ ${selector}: ${count} אלמנטים`);
            } else {
                console.log(`   ❌ ${selector}: 0 אלמנטים`);
            }
        });
        
        // ניסיון חילוץ עם הסלקטור שעבד
        const workingSelector = Object.entries(pageInfo.selectorResults).find(([_, count]) => count > 0);
        
        if (workingSelector) {
            console.log(`\\n🎯 משתמש בסלקטור: ${workingSelector[0]}`);
            
            const developers = await page.evaluate((selector) => {
                const results = [];
                const cards = document.querySelectorAll(selector);
                
                console.log(`נמצאו ${cards.length} כרטיסים`);
                
                cards.forEach((card, index) => {
                    try {
                        // ניסיון סלקטורים שונים לשם
                        const nameSelectors = [
                            '.entity-result__title-text a span[aria-hidden="true"]',
                            '.entity-result__title-text span:first-child',
                            '.entity-result__title-text span',
                            '.search-result__title a span',
                            'h3 a span',
                            '.t-16 strong',
                            '.artdeco-entity-lockup__title a',
                            '[data-anonymize="person-name"]'
                        ];
                        
                        let nameElement = null;
                        let usedNameSelector = '';
                        for (const sel of nameSelectors) {
                            nameElement = card.querySelector(sel);
                            if (nameElement && nameElement.textContent.trim()) {
                                usedNameSelector = sel;
                                break;
                            }
                        }
                        
                        // ניסיון סלקטורים שונים לתפקיד
                        const titleSelectors = [
                            '.entity-result__primary-subtitle',
                            '.search-result__headline',
                            '.t-14 span',
                            '.subline-level-1',
                            '.artdeco-entity-lockup__subtitle'
                        ];
                        
                        let titleElement = null;
                        for (const sel of titleSelectors) {
                            titleElement = card.querySelector(sel);
                            if (titleElement && titleElement.textContent.trim()) break;
                        }
                        
                        if (nameElement && nameElement.textContent) {
                            const name = nameElement.textContent.trim();
                            const title = titleElement ? titleElement.textContent.trim() : 'לא צוין';
                            
                            if (name && name.length > 2) {
                                results.push({
                                    index: index + 1,
                                    name: name,
                                    title: title,
                                    usedSelector: usedNameSelector,
                                    scrapedAt: new Date().toLocaleString('he-IL')
                                });
                                console.log(`${index + 1}. ${name} - ${title}`);
                            }
                        } else {
                            console.log(`כרטיס ${index + 1}: לא נמצא שם`);
                        }
                    } catch (e) {
                        console.log(`שגיאה בכרטיס ${index + 1}:`, e.message);
                    }
                });
                
                return results;
            }, workingSelector[0]);
            
            console.log(`\\n🎉 נמצאו ${developers.length} מפתחי Python!`);
            console.log('='.repeat(50));
            
            if (developers.length > 0) {
                developers.forEach(dev => {
                    console.log(`${dev.index}. ${dev.name}`);
                    console.log(`   תפקיד: ${dev.title}`);
                    console.log(`   סלקטור: ${dev.usedSelector}`);
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
                    workingSelector: workingSelector[0],
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
                console.log('❌ לא נמצאו תוצאות למרות שיש אלמנטים');
            }
        } else {
            console.log('❌ לא נמצא סלקטור שעובד');
        }
        
        console.log('\\n⏳ הדפדפן יישאר פתוח למשך 60 שניות לבדיקה ידנית...');
        await page.waitForTimeout(60000);
        
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
console.log('🚀 מתחיל סקריפט דיבוג מפורט...');
debugScrape().catch(console.error);

