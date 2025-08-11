#!/usr/bin/env node

/**
 * Working LinkedIn Python Developers Scraper
 * סקריפט עובד לחילוץ מפתחי Python
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;

async function scrapePythonDevelopers() {
    console.log('🐍 LinkedIn Python Developers Scraper');
    console.log('='.repeat(50));
    
    const browser = await chromium.launch({
        headless: true, // 🔇 רץ ברקע
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security'
        ]
    });
    
    const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    try {
        console.log('🔐 מתחבר ל-LinkedIn...');
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle' });
        
        await page.fill('#username', 'ramqaveles@gmail.com');
        await page.fill('#password', '2918rmvt');
        await page.click('button[type=\"submit\"]');
        
        // המתנה לטעינת הדף הראשי
        await page.waitForTimeout(8000);
        console.log('✅ התחברות הצליחה!');
        
        const allDevelopers = [];
        const searchQueries = [
            'Senior Python Developer',
            'Python Backend Developer', 
            'Full Stack Python Developer',
            'Python Software Engineer',
            'Django Developer'
        ];
        
        for (const query of searchQueries) {
            console.log(`🔍 מחפש: \"${query}\"...`);
            
            const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
            await page.goto(searchUrl, { waitUntil: 'networkidle' });
            
            // המתנה לטעינת תוצאות
            await page.waitForTimeout(5000);
            
            try {
                // חילוץ נתונים
                const developers = await page.evaluate((searchQuery) => {
                    const results = [];
                    const profileCards = document.querySelectorAll('[data-view-name=\"search-entity-result-universal-template\"]');
                    
                    profileCards.forEach(card => {
                        try {
                            const nameElement = card.querySelector('.entity-result__title-text a span[aria-hidden="true"]') ||
                                              card.querySelector('.entity-result__title-text a span:first-child') ||
                                              card.querySelector('.entity-result__title-text span');
                            
                            const titleElement = card.querySelector('.entity-result__primary-subtitle') ||
                                                card.querySelector('[data-field="experience_headline"]');
                            
                            const locationElement = card.querySelector('.entity-result__secondary-subtitle') ||
                                                   card.querySelector('[data-field="location"]');\n                            \n                            const profileLink = card.querySelector('.entity-result__title-text a');\n                            \n                            if (nameElement) {\n                                const name = nameElement.textContent?.trim();\n                                const title = titleElement?.textContent?.trim() || 'N/A';\n                                const location = locationElement?.textContent?.trim() || 'N/A';\n                                const profileUrl = profileLink?.href || 'N/A';\n                                \n                                if (name && name.length > 2) {\n                                    results.push({\n                                        name,\n                                        title,\n                                        location,\n                                        profileUrl,\n                                        searchQuery,\n                                        scrapedAt: new Date().toISOString()\n                                    });\n                                }\n                            }\n                        } catch (e) {\n                            // שגיאה בחילוץ פרופיל בודד - ממשיכים\n                        }\n                    });\n                    \n                    return results;\n                }, query);\n                \n                console.log(`✅ נמצאו ${developers.length} מפתחים עבור \"${query}\"`);\n                allDevelopers.push(...developers);\n                \n                // המתנה בין חיפושים\n                await page.waitForTimeout(3000);\n                \n            } catch (error) {\n                console.log(`❌ שגיאה בחיפוש \"${query}\": ${error.message}`);\n            }\n            \n            // הגבלה ל-20 תוצאות\n            if (allDevelopers.length >= 20) break;\n        }\n        \n        // הסרת כפילויות\n        const uniqueDevelopers = allDevelopers.filter((dev, index, self) => \n            index === self.findIndex(d => d.name === dev.name)\n        ).slice(0, 20);\n        \n        console.log('\\n📊 תוצאות:');\n        console.log('='.repeat(30));\n        \n        uniqueDevelopers.forEach((dev, index) => {\n            console.log(`${index + 1}. ${dev.name}`);\n            console.log(`   תפקיד: ${dev.title}`);\n            console.log(`   מיקום: ${dev.location}`);\n            console.log('');\n        });\n        \n        // שמירה לקובץ\n        const timestamp = new Date().toISOString().split('T')[0];\n        const jsonFile = `python_developers_${timestamp}.json`;\n        const csvFile = `python_developers_${timestamp}.csv`;\n        \n        // שמירה כ-JSON\n        await fs.writeFile(jsonFile, JSON.stringify({\n            scrapedAt: new Date().toISOString(),\n            totalResults: uniqueDevelopers.length,\n            developers: uniqueDevelopers\n        }, null, 2), 'utf8');\n        \n        // שמירה כ-CSV\n        let csvContent = 'Name,Title,Location,Profile URL,Search Query,Scraped At\\n';\n        uniqueDevelopers.forEach(dev => {\n            const row = [\n                `\"${dev.name}\"`,\n                `\"${dev.title}\"`,\n                `\"${dev.location}\"`,\n                `\"${dev.profileUrl}\"`,\n                `\"${dev.searchQuery}\"`,\n                `\"${dev.scrapedAt}\"`\n            ].join(',');\n            csvContent += row + '\\n';\n        });\n        \n        await fs.writeFile(csvFile, csvContent, 'utf8');\n        \n        console.log(`💾 נשמרו ${uniqueDevelopers.length} מפתחים:`);\n        console.log(`   📄 JSON: ${jsonFile}`);\n        console.log(`   📊 CSV: ${csvFile}`);\n        \n    } catch (error) {\n        console.error('💥 שגיאה כללית:', error.message);\n        await page.screenshot({ path: 'error_debug.png', fullPage: true });\n    } finally {\n        await browser.close();\n        console.log('🧹 דפדפן נסגר');\n    }\n}\n\n// הפעלת הסקריפט\nscrapePythonDevelopers().then(() => {\n    console.log('\\n✨ הסקריפט הסתיים בהצלחה!');\n}).catch(error => {\n    console.error('💥 שגיאה:', error.message);\n});
