const express = require('express');
const path = require('path');
let chromium;

// Try to load Playwright, but don't fail if it's not available
try {
    chromium = require('playwright').chromium;
    console.log('✅ Playwright loaded successfully');
} catch (error) {
    console.warn('⚠️ Playwright not available:', error.message);
    console.log('🔧 Server will start but scraping functionality will be limited');
}

const app = express();
const PORT = 3000; // Fixed port for both local and Railway

// Basic middleware
app.use(express.json());
app.use(express.static('public'));

// Store for scraping results
let scrapingResults = new Map();

// פונקציה לביצוע פעולות רנדומליות כמו משתמש אמיתי
async function performRandomUserAction(page) {
    const actions = [
        {
            name: 'לחיצה על פרופיל שלי',
            selector: 'a[href*="/in/"], .global-nav__me-photo, .nav-item__profile-member-photo',
            probability: 0.3,
            action: async (selector) => {
                const profileLink = await page.$(selector);
                if (profileLink) {
                    console.log('👤 לוחץ על פרופיל שלי...');
                    await profileLink.click();
                    await page.waitForTimeout(3000 + Math.random() * 5000); // 3-8 שניות
                    console.log('✅ הגעתי לפרופיל שלי');
                    return true;
                }
                return false;
            }
        },
        {
            name: 'לחיצה על פוסט ראשון/שני בפיד',
            selector: '.feed-shared-update-v2, .feed-shared-text, .feed-shared-update-v2__description',
            probability: 0.4,
            action: async (selector) => {
                const posts = await page.$$(selector);
                if (posts.length > 0) {
                    const randomPost = posts[Math.floor(Math.random() * Math.min(2, posts.length))];
                    console.log('📝 לוחץ על פוסט בפיד...');
                    await randomPost.click();
                    await page.waitForTimeout(2000 + Math.random() * 3000); // 2-5 שניות
                    console.log('✅ ליחצתי על פוסט בפיד');
                    return true;
                }
                return false;
            }
        },
        {
            name: 'לחיצה על תפריט הודעות',
            selector: 'a[href*="/messaging"], .nav-item__messaging, .global-nav__messaging',
            probability: 0.2,
            action: async (selector) => {
                const messagingLink = await page.$(selector);
                if (messagingLink) {
                    console.log('💬 לוחץ על תפריט הודעות...');
                    await messagingLink.click();
                    await page.waitForTimeout(2000 + Math.random() * 3000); // 2-5 שניות
                    console.log('✅ הגעתי לתפריט הודעות');
                    return true;
                }
                return false;
            }
        },
        {
            name: 'לחיצה על תפריט רשת',
            selector: 'a[href*="/mynetwork"], .nav-item__mynetwork, .global-nav__mynetwork',
            probability: 0.1,
            action: async (selector) => {
                const networkLink = await page.$(selector);
                if (networkLink) {
                    console.log('🌐 לוחץ על תפריט רשת...');
                    await networkLink.click();
                    await page.waitForTimeout(2000 + Math.random() * 3000); // 2-5 שניות
                    console.log('✅ הגעתי לתפריט רשת');
                    return true;
                }
                return false;
            }
        }
    ];
    
    // בחירת פעולה לפי הסתברות
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const action of actions) {
        cumulativeProbability += action.probability;
        if (random <= cumulativeProbability) {
            console.log(`🎲 נבחרה פעולה: ${action.name}`);
            
            try {
                const success = await action.action(action.selector);
                                    if (success) {
                        // המתנה רנדומלית אחרי הפעולה
                        const waitTime = 5000 + Math.random() * 10000; // 5-15 שניות
                        console.log(`⏳ ממתין ${Math.round(waitTime/1000)} שניות אחרי הפעולה...`);
                        await page.waitForTimeout(waitTime);
                        console.log('✅ המתנה אחרי הפעולה הושלמה');
                        
                        // חזרה לדף הראשי (לא תמיד)
                        if (Math.random() < 0.7) { // 70% מהמקרים
                            console.log('🏠 חוזר לדף הראשי...');
                            try {
                                await page.goto('https://www.linkedin.com/feed/', { 
                                    waitUntil: 'domcontentloaded',
                                    timeout: 30000 
                                });
                                await page.waitForTimeout(2000 + Math.random() * 3000); // 2-5 שניות
                                console.log('✅ חזרתי לדף הראשי');
                            } catch (error) {
                                console.log('⚠️ לא הצלחתי לחזור לדף הראשי:', error.message);
                            }
                        }
                        return;
                    }
            } catch (error) {
                console.log(`⚠️ הפעולה "${action.name}" נכשלה:`, error.message);
            }
        }
    }
    
    // אם אף פעולה לא עבדה, נחכה קצת
    console.log('⚠️ לא הצלחתי לבצע פעולה רנדומלית, מחכה קצת...');
    await page.waitForTimeout(3000 + Math.random() * 5000); // 3-8 שניות
}

// LinkedIn scraper function - REAL SCRAPING!
async function scrapeLinkedInReal(email, password, searchQuery = 'Python Developer', maxResults = 20, retryCount = 0) {
    if (!chromium) {
        throw new Error('Playwright is not available. Cannot perform scraping.');
    }

    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // הגדרת viewport אמיתי
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // הגדרת cookies ו-localStorage כדי להיראות כמו משתמש אמיתי
    await page.addInitScript(() => {
        // הגדרת localStorage
        localStorage.setItem('li_at', 'dummy_token');
        localStorage.setItem('JSESSIONID', 'dummy_session');
        
        // הגדרת cookies
        document.cookie = 'li_at=dummy_token; domain=.linkedin.com; path=/';
        document.cookie = 'JSESSIONID=dummy_session; domain=.linkedin.com; path=/';
    });

    try {
        console.log(`🔐 ניסיון ${retryCount + 1}: מתחיל תהליך התחברות ל-LinkedIn...`);
        console.log(`📧 אימייל: ${email}`);
        console.log(`🔑 סיסמה: ${password ? '***' + password.slice(-3) : 'לא הוזנה'}`);
        
        // הגדלת timeout ל-60 שניות
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);
        console.log('⏱️ Timeout הוגדר ל-60 שניות');
        
        // התחברות ל-LinkedIn
        console.log('🌐 מגיע לעמוד לוגין של LinkedIn...');
        await page.goto('https://www.linkedin.com/login', { 
            waitUntil: 'domcontentloaded', // רק DOM, לא כל הדף
            timeout: 60000 
        });
        console.log('✅ הגעתי לעמוד לוגין של LinkedIn');
        
        console.log('📝 ממלא פרטי התחברות...');
        await page.fill('#username', email);
        console.log('✅ אימייל הוזן');
        await page.fill('#password', password);
        console.log('✅ סיסמה הוזנה');
        
        console.log('🚀 לוחץ על כפתור התחברות...');
        await page.click('button[type="submit"]');
        console.log('✅ כפתור התחברות נלחץ');
        
        // המתנה מורחבת - 20 שניות אחרי לוגין (לפרוד)
        console.log('⏳ ממתין 20 שניות לטעינת הדף אחרי לוגין...');
        console.log('🔄 זה יכול לקחת זמן בפרוד...');
        await page.waitForTimeout(20000);
        console.log('✅ המתנה אחרי לוגין הושלמה');
        
        // המתנה נוספת לטעינת הדף הראשי
        console.log('⏳ ממתין 5 שניות נוספות לטעינת הדף הראשי...');
        await page.waitForTimeout(5000);
        console.log('✅ המתנה לטעינת הדף הראשי הושלמה');
        
        // פעולות רנדומליות כדי להיראות כמו משתמש אמיתי
        console.log('🎲 מבצע פעולה רנדומלית כדי להיראות כמו משתמש אמיתי...');
        await performRandomUserAction(page);
        
        // חיפוש - עכשיו מחפש כל מילה שאתה מזין
        console.log(`🔍 מתחיל חיפוש עבור: "${searchQuery}"...`);
        
        // נסיון ראשון - חיפוש דרך הדף הראשי
        try {
            console.log('🔍 נסיון ראשון: מחפש דרך הדף הראשי...');
            
            // לחץ על כפתור החיפוש אם קיים
            const searchButton = await page.$('input[placeholder*="Search"], input[aria-label*="Search"], .search-global-typeahead__input');
            if (searchButton) {
                console.log('🔍 נמצא שדה חיפוש בדף הראשי');
                await searchButton.click();
                await page.waitForTimeout(2000);
                await searchButton.fill(searchQuery);
                await page.waitForTimeout(2000);
                await page.keyboard.press('Enter');
                console.log('✅ חיפוש בוצע דרך הדף הראשי');
            } else {
                console.log('⚠️ לא נמצא שדה חיפוש בדף הראשי, מנסה URL ישיר...');
                throw new Error('לא נמצא שדה חיפוש');
            }
        } catch (error) {
            console.log('🔍 נסיון שני: נווט ישיר ל-URL חיפוש...');
            const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`;
            
            console.log(`🌐 נווט ל-URL חיפוש: ${searchUrl}`);
            
            // נסיון עם waitUntil: 'networkidle' במקום 'domcontentloaded'
            try {
                await page.goto(searchUrl, { 
                    waitUntil: 'networkidle',
                    timeout: 60000 
                });
                console.log('✅ הגעתי לעמוד תוצאות החיפוש עם networkidle');
            } catch (redirectError) {
                console.log('⚠️ networkidle נכשל, מנסה עם domcontentloaded...');
                await page.goto(searchUrl, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 60000 
                });
                console.log('✅ הגעתי לעמוד תוצאות החיפוש עם domcontentloaded');
            }
        }
        
        console.log('⏳ ממתין 15 שניות לטעינת תוצאות החיפוש...');
        console.log('🔄 זה יכול לקחת זמן בפרוד...');
        await page.waitForTimeout(15000);
        console.log('✅ המתנה לטעינת תוצאות החיפוש הושלמה');
        
        // המתנה נוספת לטעינת התוכן
        console.log('⏳ ממתין 5 שניות נוספות לטעינת התוכן...');
        await page.waitForTimeout(5000);
        console.log('✅ המתנה לטעינת התוכן הושלמה');

        // בדיקה שהדף נטען נכון
        console.log('🔍 בודק שהדף נטען נכון...');
        const pageTitle = await page.title();
        const pageUrl = page.url();
        console.log(`📄 כותרת הדף: ${pageTitle}`);
        console.log(`🔗 URL נוכחי: ${pageUrl}`);
        
        // בדיקה אם יש תוכן בדף
        console.log('📊 בודק גודל תוכן הדף...');
        const pageContent = await page.content();
        console.log(`📊 גודל תוכן הדף: ${pageContent.length} תווים`);
        
        if (pageContent.length < 1000) {
            console.log('⚠️ אזהרה: תוכן הדף קצר מדי - ייתכן שהדף לא נטען נכון');
        } else {
            console.log('✅ תוכן הדף נראה תקין');
        }
        
        // בדיקה אם LinkedIn דורש אימות נוסף
        console.log('🔒 בודק אם LinkedIn דורש אימות נוסף...');
        const pageText = await page.textContent('body');
        if (pageText.includes('captcha') || pageText.includes('verify') || pageText.includes('checkpoint')) {
            console.log('🚨 LinkedIn דורש אימות נוסף!');
            await page.screenshot({ path: 'linkedin_verification.png', fullPage: true });
            console.log('📸 צילום מסך של דף האימות נשמר');
            throw new Error('LinkedIn דורש אימות נוסף - לא ניתן להמשיך');
        }
        
        // בדיקה אם אנחנו בדף הראשי
        if (pageUrl.includes('linkedin.com/feed') || pageUrl.includes('linkedin.com/in/')) {
            console.log('✅ הגעתי לדף הראשי של LinkedIn');
        } else {
            console.log('⚠️ לא הגעתי לדף הראשי - ייתכן שיש בעיה בהתחברות');
            console.log(`📍 URL נוכחי: ${pageUrl}`);
        }

        // חילוץ נתונים אמיתיים - עכשיו לוקח את כל התוצאות
        console.log('📊 מתחיל חילוץ נתונים מהדף...');
        
        // בדיקה נוספת של הדף לפני חילוץ
        const currentUrl = page.url();
        const currentTitle = await page.title();
        console.log(`📍 URL נוכחי לפני חילוץ: ${currentUrl}`);
        console.log(`📄 כותרת נוכחית לפני חילוץ: ${currentTitle}`);
        
        // בדיקה אם אנחנו בדף תוצאות חיפוש
        if (!currentUrl.includes('search/results') && !currentTitle.toLowerCase().includes('search')) {
            console.log('⚠️ לא הגעתי לדף תוצאות חיפוש!');
            console.log('🔍 מנסה למצוא תוצאות בדף הנוכחי...');
        }
        
        const developers = await page.evaluate(() => {
            const results = [];
            console.log('🔍 מתחיל חיפוש אלמנטים בדף...');
            
            // נסיון ראשון - אלמנטים סטנדרטיים
            console.log('🔍 נסיון ראשון: מחפש אלמנטים סטנדרטיים...');
            let cards = document.querySelectorAll('[data-view-name="search-entity-result-universal-template"]');
            console.log(`🔍 נסיון ראשון - נמצאו ${cards.length} כרטיסי תוצאות`);
            
            // אם לא נמצאו, נסיון שני - אלמנטים חלופיים
            if (cards.length === 0) {
                console.log('⚠️ לא נמצאו כרטיסי תוצאות סטנדרטיים!');
                console.log('🔍 נסיון שני: מחפש אלמנטים חלופיים...');
                
                cards = document.querySelectorAll('.search-result__info, .search-result, .result-card');
                console.log(`🔍 נסיון שני - אלמנטים חלופיים: ${cards.length}`);
            }
            
            // אם עדיין לא נמצאו, נסיון שלישי - כל האלמנטים עם טקסט
            if (cards.length === 0) {
                console.log('⚠️ לא נמצאו אלמנטים חלופיים!');
                console.log('🔍 נסיון שלישי: מחפש כל האלמנטים עם טקסט...');
                
                const allElements = document.querySelectorAll('div, li, article');
                console.log(`🔍 סה"כ אלמנטים בדף: ${allElements.length}`);
                
                cards = Array.from(allElements).filter(el => {
                    const text = el.innerText || el.textContent || '';
                    return text.length > 20 && text.includes(' ') && !text.includes('LinkedIn');
                });
                console.log(`🔍 נסיון שלישי - אלמנטים עם טקסט: ${cards.length}`);
            }
            
            cards.forEach((card, index) => {
                try {
                    const allText = card.innerText || card.textContent || '';
                    const lines = allText.split('\n').filter(line => line.trim().length > 0);
                    
                    console.log(`📝 כרטיס ${index + 1}: ${lines.slice(0, 3).join(' | ')}`);
                    
                    if (lines.length >= 2) {
                        const name = lines[0].trim();
                        // עכשיו לוקח את כל התפקידים, לא רק תפקידים ספציפיים
                        const title = lines.find(line => 
                            line.length > 3 && 
                            !line.includes('Connect') && 
                            !line.includes('View') &&
                            !line.includes('Message') &&
                            !line.includes('Follow') &&
                            !line.includes('LinkedIn') &&
                            !line.includes('Search')
                        ) || lines[1];
                        
                        const location = lines.find(line => 
                            line.includes(',') || 
                            line.toLowerCase().includes('israel') ||
                            line.toLowerCase().includes('tel aviv') ||
                            line.toLowerCase().includes('jerusalem') ||
                            line.toLowerCase().includes('united states') ||
                            line.toLowerCase().includes('usa')
                        ) || 'N/A';

                        if (name && name.length > 2 && !name.includes('Connect') && !name.includes('View') && !name.includes('LinkedIn')) {
                            results.push({
                                index: index + 1,
                                name: name,
                                title: title || 'N/A',
                                location: location,
                                scrapedAt: new Date().toISOString()
                            });
                        }
                    }
                } catch (e) {
                    console.log(`⚠️ שגיאה בפרופיל ${index + 1}:`, e.message);
                }
            });
            
            return results;
        });

        console.log(`✅ חילוץ הושלם! נמצאו ${developers.length} תוצאות`);
        
        // בדיקה אם LinkedIn חסם אותנו
        if (developers.length === 0) {
            const pageText = await page.textContent('body');
            if (pageText.includes('captcha') || pageText.includes('verify') || pageText.includes('blocked')) {
                console.log('🚨 LinkedIn דורש אימות או חסם אותנו!');
                await page.screenshot({ path: 'linkedin_blocked.png', fullPage: true });
                console.log('📸 צילום מסך נשמר: linkedin_blocked.png');
            }
        }
        
        await browser.close();
        
        return {
            success: true,
            totalResults: developers.length,
            developers: developers.slice(0, maxResults),
            scrapedAt: new Date().toISOString(),
            retryCount: retryCount
        };

    } catch (error) {
        console.error(`❌ שגיאה בניסיון ${retryCount + 1}:`, error.message);
        await browser.close();
        
        // אם זה לא הניסיון האחרון, ננסה שוב
        if (retryCount < 2) {
            console.log(`🔄 מנסה שוב... (ניסיון ${retryCount + 2}/3)`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // המתנה 5 שניות
            return await scrapeLinkedInReal(email, password, searchQuery, maxResults, retryCount + 1);
        }
        
        throw new Error(`החיפוש נכשל אחרי 3 ניסיונות. השגיאה האחרונה: ${error.message}`);
    }
}

// Simple routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        message: 'Simple server is working!'
    });
});

app.get('/test', (req, res) => {
    res.json({ 
        message: 'Test endpoint working!', 
        timestamp: new Date().toISOString()
    });
});

// API endpoint לחילוץ מפתחי Python
app.post('/api/scrape', async (req, res) => {
    const { email, password, searchQuery, maxResults } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'LinkedIn email and password are required'
        });
    }

    const jobId = Date.now().toString();
    
    // התחלת תהליך חילוץ ברקע
    scrapingResults.set(jobId, { status: 'running', startedAt: new Date().toISOString() });
    
    res.json({
        success: true,
        jobId: jobId,
        message: 'Scraping started. Use /api/results/:jobId to check progress.',
        estimatedTime: '2-3 minutes'
    });

    // הרצת החילוץ האמיתי ברקע
    try {
        const results = await scrapeLinkedInReal(
            email, 
            password, 
            searchQuery || 'Python Developer', 
            maxResults || 20
        );
        
        scrapingResults.set(jobId, {
            status: 'completed',
            startedAt: scrapingResults.get(jobId).startedAt,
            completedAt: new Date().toISOString(),
            data: results
        });
    } catch (error) {
        scrapingResults.set(jobId, {
            status: 'failed',
            startedAt: scrapingResults.get(jobId).startedAt,
            failedAt: new Date().toISOString(),
            error: error.message
        });
    }
});

// בדיקת סטטוס ותוצאות
app.get('/api/results/:jobId', (req, res) => {
    const { jobId } = req.params;
    const result = scrapingResults.get(jobId);
    
    if (!result) {
        return res.status(404).json({
            success: false,
            error: 'Job not found'
        });
    }
    
    res.json({
        success: true,
        jobId: jobId,
        ...result
    });
});

// הורדת תוצאות כ-CSV
app.get('/api/download/:jobId', (req, res) => {
    const { jobId } = req.params;
    const result = scrapingResults.get(jobId);
    
    if (!result || result.status !== 'completed') {
        return res.status(404).json({
            success: false,
            error: 'Results not available'
        });
    }
    
    const developers = result.data.developers;
    let csvContent = 'Index,Name,Title,Location,Scraped At\n';
    
    developers.forEach(dev => {
        csvContent += `${dev.index},"${dev.name}","${dev.title}","${dev.location}","${new Date().toISOString()}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="linkedin_results_${jobId}.csv"`);
    res.send(csvContent);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Simple server running on port ${PORT}`);
    console.log(`📍 Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`🧪 Test endpoint: http://0.0.0.0:${PORT}/test`);
    console.log(`🌐 Web interface: http://0.0.0.0:${PORT}`);
    console.log(`🔧 API endpoints: /api/scrape, /api/results/:jobId, /api/download/:jobId`);
    console.log(`✅ Server is ready!`);
});

server.on('error', (err) => {
    console.error('❌ Server error:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});