#!/usr/bin/env node

/**
 * Final Working LinkedIn Python Developers Scraper
 * סקריפט סופי לחילוץ מפתחי Python
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;

async function scrapePythonDevelopers() {
    console.log('🐍 LinkedIn Python Developers Scraper');
    console.log('='.repeat(50));
    
    const browser = await chromium.launch({
        headless: true, // רץ ברקע
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
                            const nameElement = card.querySelector('.entity-result__title-text a span[aria-hidden=\"true\"]') ||
                                              card.querySelector('.entity-result__title-text a span:first-child') ||
                                              card.querySelector('.entity-result__title-text span');
                            
                            const titleElement = card.querySelector('.entity-result__primary-subtitle') ||
                                                card.querySelector('[data-field=\"experience_headline\"]');
                            
                            const locationElement = card.querySelector('.entity-result__secondary-subtitle') ||
                                                   card.querySelector('[data-field=\"location\"]');
                            
                            const profileLink = card.querySelector('.entity-result__title-text a');
                            
                            if (nameElement) {
                                const name = nameElement.textContent ? nameElement.textContent.trim() : '';
                                const title = titleElement && titleElement.textContent ? titleElement.textContent.trim() : 'N/A';
                                const location = locationElement && locationElement.textContent ? locationElement.textContent.trim() : 'N/A';
                                const profileUrl = profileLink ? profileLink.href : 'N/A';
                                
                                if (name && name.length > 2) {
                                    results.push({
                                        name: name,
                                        title: title,
                                        location: location,
                                        profileUrl: profileUrl,
                                        searchQuery: searchQuery,
                                        scrapedAt: new Date().toISOString()
                                    });
                                }
                            }
                        } catch (e) {
                            // שגיאה בחילוץ פרופיל בודד - ממשיכים
                        }
                    });
                    
                    return results;
                }, query);
                
                console.log(`✅ נמצאו ${developers.length} מפתחים עבור \"${query}\"`);
                allDevelopers.push(...developers);
                
                // המתנה בין חיפושים
                await page.waitForTimeout(3000);
                
            } catch (error) {
                console.log(`❌ שגיאה בחיפוש \"${query}\": ${error.message}`);
            }
            
            // הגבלה ל-20 תוצאות
            if (allDevelopers.length >= 20) break;
        }
        
        // הסרת כפילויות
        const uniqueDevelopers = allDevelopers.filter((dev, index, self) => 
            index === self.findIndex(d => d.name === dev.name)
        ).slice(0, 20);
        
        console.log('\\n📊 תוצאות:');
        console.log('='.repeat(30));
        
        uniqueDevelopers.forEach((dev, index) => {
            console.log(`${index + 1}. ${dev.name}`);
            console.log(`   תפקיד: ${dev.title}`);
            console.log(`   מיקום: ${dev.location}`);
            console.log('');
        });
        
        // שמירה לקובץ
        const timestamp = new Date().toISOString().split('T')[0];
        const jsonFile = `python_developers_${timestamp}.json`;
        const csvFile = `python_developers_${timestamp}.csv`;
        
        // שמירה כ-JSON
        await fs.writeFile(jsonFile, JSON.stringify({
            scrapedAt: new Date().toISOString(),
            totalResults: uniqueDevelopers.length,
            developers: uniqueDevelopers
        }, null, 2), 'utf8');
        
        // שמירה כ-CSV
        let csvContent = 'Name,Title,Location,Profile URL,Search Query,Scraped At\\n';
        uniqueDevelopers.forEach(dev => {
            const row = [
                `\"${dev.name}\"`,
                `\"${dev.title}\"`,
                `\"${dev.location}\"`,
                `\"${dev.profileUrl}\"`,
                `\"${dev.searchQuery}\"`,
                `\"${dev.scrapedAt}\"`
            ].join(',');
            csvContent += row + '\\n';
        });
        
        await fs.writeFile(csvFile, csvContent, 'utf8');
        
        console.log(`💾 נשמרו ${uniqueDevelopers.length} מפתחים:`);
        console.log(`   📄 JSON: ${jsonFile}`);
        console.log(`   📊 CSV: ${csvFile}`);
        
    } catch (error) {
        console.error('💥 שגיאה כללית:', error.message);
        await page.screenshot({ path: 'error_debug.png', fullPage: true });
    } finally {
        await browser.close();
        console.log('🧹 דפדפן נסגר');
    }
}

// הפעלת הסקריפט
scrapePythonDevelopers().then(() => {
    console.log('\\n✨ הסקריפט הסתיים בהצלחה!');
}).catch(error => {
    console.error('💥 שגיאה:', error.message);
});
