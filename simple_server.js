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

    try {
        console.log(`🔐 ניסיון ${retryCount + 1}: מתחבר ל-LinkedIn...`);
        
        // הגדלת timeout ל-60 שניות
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);
        
        // התחברות ל-LinkedIn
        console.log('📝 ממלא פרטי התחברות...');
        await page.goto('https://www.linkedin.com/login', { 
            waitUntil: 'domcontentloaded', // רק DOM, לא כל הדף
            timeout: 60000 
        });
        
        await page.fill('#username', email);
        await page.fill('#password', password);
        await page.click('button[type="submit"]');
        
        // המתנה פשוטה - 10 שניות אחרי לוגין
        console.log('⏳ ממתין 10 שניות אחרי לוגין...');
        await page.waitForTimeout(10000);
        console.log('✅ המתנה הושלמה, ממשיכים...');
        
        // חיפוש - עכשיו מחפש כל מילה שאתה מזין
        console.log(`🔍 מחפש: "${searchQuery}"...`);
        const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`;
        
        console.log(`🌐 נווט ל: ${searchUrl}`);
        await page.goto(searchUrl, { 
            waitUntil: 'domcontentloaded', // רק DOM, לא כל הדף
            timeout: 60000 
        });
        
        console.log('⏳ ממתין 10 שניות לטעינת תוצאות החיפוש...');
        await page.waitForTimeout(10000);
        console.log('✅ המתנה הושלמה, מחלץ נתונים...');

        // חילוץ נתונים אמיתיים - עכשיו לוקח את כל התוצאות
        console.log('📊 מחלץ נתונים מהדף...');
        const developers = await page.evaluate(() => {
            const results = [];
            const cards = document.querySelectorAll('[data-view-name="search-entity-result-universal-template"]');
            
            console.log(`🔍 נמצאו ${cards.length} כרטיסי תוצאות`);
            
            // לוג נוסף לדיבוג
            if (cards.length === 0) {
                console.log('⚠️ לא נמצאו כרטיסי תוצאות!');
                console.log('🔍 מחפש אלמנטים אחרים...');
                
                // נסיון למצוא אלמנטים אחרים
                const alternativeCards = document.querySelectorAll('.search-result__info');
                console.log(`🔍 אלמנטים חלופיים: ${alternativeCards.length}`);
                
                const allDivs = document.querySelectorAll('div');
                console.log(`🔍 סה"כ divs בדף: ${allDivs.length}`);
            }
            
            cards.forEach((card, index) => {
                try {
                    const allText = card.innerText || card.textContent || '';
                    const lines = allText.split('\n').filter(line => line.trim().length > 0);
                    
                    if (lines.length >= 2) {
                        const name = lines[0].trim();
                        // עכשיו לוקח את כל התפקידים, לא רק תפקידים ספציפיים
                        const title = lines.find(line => 
                            line.length > 3 && 
                            !line.includes('Connect') && 
                            !line.includes('View') &&
                            !line.includes('Message') &&
                            !line.includes('Follow')
                        ) || lines[1];
                        
                        const location = lines.find(line => 
                            line.includes(',') || 
                            line.toLowerCase().includes('israel') ||
                            line.toLowerCase().includes('tel aviv') ||
                            line.toLowerCase().includes('jerusalem') ||
                            line.toLowerCase().includes('united states') ||
                            line.toLowerCase().includes('usa')
                        ) || 'N/A';

                        if (name && name.length > 2 && !name.includes('Connect') && !name.includes('View')) {
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