const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
let chromium;

// Try to load Playwright, but don't fail if it's not available
try {
    chromium = require('playwright').chromium;
    console.log('✅ Playwright loaded successfully');
} catch (error) {
    console.warn('⚠️ Playwright not available:', error.message);
    console.log('🔧 Server will start but scraping functionality will be limited');
    console.log('💡 To enable scraping, ensure Playwright is properly installed');
}

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
 // Force port 3000 for Railway compatibility

// Railway specific configurations
if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('🚂 Running on Railway');
    console.log(`📍 Environment: ${process.env.RAILWAY_ENVIRONMENT}`);
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store for scraping results
let scrapingResults = new Map();

// LinkedIn scraper function
async function scrapeLinkedInPythonDevelopers(email, password, searchQuery = 'Python Developer', maxResults = 20) {
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
        // התחברות ל-LinkedIn
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle' });
        await page.fill('#username', email);
        await page.fill('#password', password);
        await page.click('button[type="submit"]');
        
        // המתנה לטעינה
        await page.waitForTimeout(10000);
        
        // חיפוש
        const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle' });
        await page.waitForTimeout(15000);

        // חילוץ נתונים
        const developers = await page.evaluate(() => {
            const results = [];
            const cards = document.querySelectorAll('[data-view-name="search-entity-result-universal-template"]');
            
            cards.forEach((card, index) => {
                try {
                    const allText = card.innerText || card.textContent || '';
                    const lines = allText.split('\\n').filter(line => line.trim().length > 0);
                    
                    if (lines.length >= 2) {
                        const name = lines[0].trim();
                        const title = lines.find(line => 
                            line.toLowerCase().includes('python') || 
                            line.toLowerCase().includes('developer') ||
                            line.toLowerCase().includes('engineer')
                        ) || lines[1];
                        
                        const location = lines.find(line => 
                            line.includes(',') || 
                            line.toLowerCase().includes('israel') ||
                            line.toLowerCase().includes('tel aviv') ||
                            line.toLowerCase().includes('jerusalem')
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
                    // שגיאה בפרופיל בודד
                }
            });
            
            return results;
        });

        await browser.close();
        return {
            success: true,
            totalResults: developers.length,
            developers: developers.slice(0, maxResults),
            scrapedAt: new Date().toISOString()
        };

    } catch (error) {
        await browser.close();
        throw error;
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Simple test endpoint
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Server is running!', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        railway: !!process.env.RAILWAY_ENVIRONMENT,
        playwright: !!chromium,
        status: 'ready'
    });
});

app.get('/health', (req, res) => {
    try {
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'LinkedIn Python Scraper API',
            port: PORT,
            environment: process.env.NODE_ENV || 'development',
            railway: !!process.env.RAILWAY_ENVIRONMENT,
            playwright: !!chromium,
            features: {
                scraping: !!chromium,
                api: true,
                webInterface: true
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            platform: process.platform,
            nodeVersion: process.version
        };
        
        res.json(healthData);
        console.log(`✅ Health check requested - Server is healthy`);
    } catch (error) {
        console.error('❌ Health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
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

    // הרצת החילוץ ברקע
    try {
        const results = await scrapeLinkedInPythonDevelopers(
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
        csvContent += `${dev.index},"${dev.name}","${dev.title}","${dev.location}","${dev.scrapedAt}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="python_developers_${jobId}.csv"`);
    res.send(csvContent);
});

// ניקוי תוצאות ישנות (כל שעה)
setInterval(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [jobId, result] of scrapingResults.entries()) {
        const startTime = new Date(result.startedAt).getTime();
        if (startTime < oneHourAgo) {
            scrapingResults.delete(jobId);
        }
    }
}, 60 * 60 * 1000);

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    console.error('🔧 Server will continue running but may be unstable');
    // Don't exit - let the server try to recover
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    console.error('🔧 Server will continue running but may be unstable');
    // Don't exit - let the server try to recover
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LinkedIn Scraper API running on port ${PORT}`);
    console.log(`📍 Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`🧪 Test endpoint: http://0.0.0.0:${PORT}/test`);
    console.log(`🌐 Web interface: http://0.0.0.0:${PORT}`);
    console.log(`🚂 Railway Environment: ${process.env.RAILWAY_ENVIRONMENT || 'local'}`);
    console.log(`📦 Node Version: ${process.version}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌍 Process Platform: ${process.platform}`);
    console.log(`📁 Current Directory: ${process.cwd()}`);
    console.log(`📋 Environment Variables:`, {
        PORT: process.env.PORT,
        NODE_ENV: process.env.NODE_ENV,
        RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
        RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL
    });
    console.log(`🎭 Playwright Status: ${chromium ? 'Available' : 'Not Available'}`);
    console.log(`✅ Server is ready to accept requests`);
    console.log(`🎯 All endpoints are configured and ready`);
});

server.on('error', (err) => {
    console.error('Server error:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
});