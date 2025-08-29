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

// LinkedIn scraper function - NEW APPROACH!
async function scrapeLinkedInReal(email, password, searchQuery = 'Python Developer', maxResults = 20, retryCount = 0) {
    if (!chromium) {
        throw new Error('Playwright is not available. Cannot perform scraping.');
    }

    const browser = await chromium.launch({
        headless: false, // שינוי ל-false כדי לראות מה קורה
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // הגדרת viewport אמיתי
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // הסתרת Playwright
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    });

    try {
        console.log(`🔐 ניסיון ${retryCount + 1}: מתחיל תהליך התחברות ל-LinkedIn...`);
        console.log(`📧 אימייל: ${email}`);
        console.log(`🔑 סיסמה: ${password ? '***' + password.slice(-3) : 'לא הוזנה'}`);
        
        // הגדרת timeout
        page.setDefaultTimeout(120000); // 2 דקות
        page.setDefaultNavigationTimeout(120000);
        console.log('⏱️ Timeout הוגדר ל-2 דקות');
        
        // התחברות ל-LinkedIn
        console.log('🌐 מגיע לעמוד לוגין של LinkedIn...');
        await page.goto('https://www.linkedin.com/login', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });
        console.log('✅ הגעתי לעמוד לוגין של LinkedIn');
        
        // המתנה קצרה לטעינת הדף
        await page.waitForTimeout(3000);
        
        console.log('📝 ממלא פרטי התחברות...');
        await page.fill('#username', email);
        console.log('✅ אימייל הוזן');
        await page.fill('#password', password);
        console.log('✅ סיסמה הוזנה');
        
        console.log('🚀 לוחץ על כפתור התחברות...');
        await page.click('button[type="submit"]');
        console.log('✅ כפתור התחברות נלחץ');
        
        // הגישה החדשה - מחכים שהדף יטען בעצמו
        console.log('⏳ מחכה שהדף יטען אחרי לוגין...');
        console.log('🔄 LinkedIn יטען את הדף הראשי בעצמו...');
        
        // המתנה עד שהדף יטען נכון
        let attempts = 0;
        const maxAttempts = 30; // 30 ניסיונות של 2 שניות = דקה
        
        while (attempts < maxAttempts) {
            attempts++;
            console.log(`🔍 ניסיון ${attempts}/${maxAttempts}: בודק מצב הדף...`);
            
            try {
                const currentUrl = page.url();
                const currentTitle = await page.title();
                
                console.log(`📍 URL נוכחי: ${currentUrl}`);
                console.log(`📄 כותרת נוכחית: ${currentTitle}`);
                
                // בדיקה אם הדף נטען נכון
                if (currentUrl.includes('linkedin.com') && 
                    !currentUrl.includes('chrome-error://') && 
                    !currentUrl.includes('data:') && 
                    currentUrl !== 'about:blank' &&
                    currentTitle.length > 0) {
                    
                    console.log('✅ הדף נטען נכון!');
                    
                    // בדיקה אם אנחנו בדף הראשי
                    if (currentUrl.includes('/feed/') || currentUrl.includes('/in/') || currentUrl === 'https://www.linkedin.com/') {
                        console.log('🎉 הגעתי לדף הראשי של LinkedIn!');
                        break;
                    } else {
                        console.log('⚠️ הדף נטען אבל לא הגעתי לדף הראשי - ממשיך לחכות...');
                    }
                } else {
                    console.log('⏳ הדף עדיין לא נטען נכון - מחכה...');
                }
                
                // המתנה 2 שניות בין בדיקות
                await page.waitForTimeout(2000);
                
            } catch (error) {
                console.log(`⚠️ שגיאה בבדיקת הדף: ${error.message}`);
                await page.waitForTimeout(2000);
            }
        }
        
        if (attempts >= maxAttempts) {
            throw new Error('הדף לא נטען נכון אחרי דקה של המתנה');
        }
        
        // בדיקה סופית של הדף
        const finalUrl = page.url();
        const finalTitle = await page.title();
        console.log(`📍 URL סופי: ${finalUrl}`);
        console.log(`📄 כותרת סופית: ${finalTitle}`);
        
        // המתנה נוספת לטעינת התוכן
        console.log('⏳ ממתין 10 שניות לטעינת התוכן המלא...');
        await page.waitForTimeout(10000);
        
        // בדיקה אם LinkedIn דורש אימות נוסף
        console.log('🔒 בודק אם LinkedIn דורש אימות נוסף...');
        const pageText = await page.textContent('body');
        if (pageText.includes('captcha') || pageText.includes('verify') || pageText.includes('checkpoint')) {
            console.log('🚨 LinkedIn דורש אימות נוסף!');
            await page.screenshot({ path: 'linkedin_verification.png', fullPage: true });
            console.log('📸 צילום מסך של דף האימות נשמר');
            throw new Error('LinkedIn דורש אימות נוסף - לא ניתן להמשיך');
        }
        
        // חיפוש דרך הממשק הרגיל
        console.log(`🔍 מתחיל חיפוש עבור: "${searchQuery}"...`);
        
        try {
            // נסיון למצוא שדה חיפוש
            console.log('🔍 מחפש שדה חיפוש בדף...');
            const searchSelectors = [
                'input[placeholder*="Search"]',
                'input[aria-label*="Search"]',
                '.search-global-typeahead__input',
                'input[type="text"]',
                '[data-control-name="search_query"]'
            ];
            
            let searchInput = null;
            for (const selector of searchSelectors) {
                searchInput = await page.$(selector);
                if (searchInput) {
                    console.log(`✅ נמצא שדה חיפוש: ${selector}`);
                    break;
                }
            }
            
            if (searchInput) {
                console.log('🔍 לוחץ על שדה החיפוש...');
                await searchInput.click();
                await page.waitForTimeout(2000);
                
                console.log(`🔍 ממלא טקסט חיפוש: "${searchQuery}"...`);
                await searchInput.fill(searchQuery);
                await page.waitForTimeout(2000);
                
                console.log('🔍 לוחץ Enter לביצוע החיפוש...');
                await page.keyboard.press('Enter');
                console.log('✅ Enter נלחץ - החיפוש מתבצע...');
                
                // המתנה לטעינת תוצאות
                console.log('⏳ ממתין 15 שניות לטעינת תוצאות החיפוש...');
                await page.waitForTimeout(15000);
                
            } else {
                console.log('⚠️ לא נמצא שדה חיפוש - מנסה ניווט ישיר...');
                
                // ניווט ישיר לחיפוש
                const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`;
                console.log(`🌐 נווט ל-URL חיפוש: ${searchUrl}`);
                
                await page.goto(searchUrl, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 60000 
                });
                console.log('✅ הגעתי לעמוד החיפוש');
                
                // המתנה לטעינת תוצאות
                console.log('⏳ ממתין 15 שניות לטעינת תוצאות החיפוש...');
                await page.waitForTimeout(15000);
            }
            
        } catch (searchError) {
            console.log('❌ שגיאה בביצוע החיפוש:', searchError.message);
            throw searchError;
        }
        
        // בדיקה שהדף נטען נכון
        console.log('🔍 בודק שהדף נטען נכון...');
        const pageTitle = await page.title();
        const pageUrl = page.url();
        console.log(`📄 כותרת הדף: ${pageTitle}`);
        console.log(`🔗 URL נוכחי: ${pageUrl}`);
        
        // חילוץ נתונים
        console.log('📊 מתחיל חילוץ נתונים מהדף...');
        
        const developers = await page.evaluate(() => {
            const results = [];
            
            // נסיון ראשון - אלמנטים סטנדרטיים
            let cards = document.querySelectorAll('[data-view-name="search-entity-result-universal-template"]');
            
            // אם לא נמצאו, נסיון שני - אלמנטים חלופיים
            if (cards.length === 0) {
                cards = document.querySelectorAll('.search-result__info, .search-result, .result-card');
            }
            
            // אם עדיין לא נמצאו, נסיון שלישי - כל האלמנטים עם טקסט
            if (cards.length === 0) {
                const allElements = document.querySelectorAll('div, li, article');
                cards = Array.from(allElements).filter(el => {
                    const text = el.innerText || el.textContent || '';
                    return text.length > 20 && text.includes(' ') && !text.includes('LinkedIn');
                });
            }
            
            return {
                cardsCount: cards.length,
                cards: Array.from(cards).map((card, index) => {
                    try {
                        const allText = card.innerText || card.textContent || '';
                        const lines = allText.split('\n').filter(line => line.trim().length > 0);
                        
                        if (lines.length >= 2) {
                            const name = lines[0].trim();
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
                                return {
                                    index: index + 1,
                                    name: name,
                                    title: title || 'N/A',
                                    location: location,
                                    scrapedAt: new Date().toISOString()
                                };
                            }
                        }
                    } catch (e) {
                        // שגיאה תועבר לשרת
                    }
                    return null;
                }).filter(Boolean)
            };
        });
        
        console.log(`🔍 נמצאו ${developers.cardsCount} כרטיסים`);
        
        // עיבוד התוצאות
        const finalResults = developers.cards || [];
        
        console.log(`📊 מתחיל עיבוד ${finalResults.length} כרטיסים...`);
        
        finalResults.forEach((card, index) => {
            console.log(`📝 כרטיס ${index + 1}: ${card.name} | ${card.title} | ${card.location}`);
        });
        
        console.log(`✅ עיבוד כרטיסים הושלם!`);
        console.log(`✅ חילוץ הושלם! נמצאו ${finalResults.length} תוצאות`);
        
        // המתנה קצרה לפני סגירת הדפדפן
        await page.waitForTimeout(5000);
        await browser.close();
        
        return {
            success: true,
            totalResults: finalResults.length,
            developers: finalResults.slice(0, maxResults),
            scrapedAt: new Date().toISOString(),
            retryCount: retryCount
        };

    } catch (error) {
        console.error(`❌ שגיאה בניסיון ${retryCount + 1}:`, error.message);
        await browser.close();
        
        // אם זה לא הניסיון האחרון, ננסה שוב
        if (retryCount < 2) {
            console.log(`🔄 מנסה שוב... (ניסיון ${retryCount + 2}/3)`);
            await new Promise(resolve => setTimeout(resolve, 10000)); // המתנה 10 שניות
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