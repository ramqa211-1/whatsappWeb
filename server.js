const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { chromium } = require('playwright');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store for scraping results
let scrapingResults = new Map();

// LinkedIn scraper function
async function scrapeLinkedInPythonDevelopers(email, password, searchQuery = 'Python Developer', maxResults = 20) {
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

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'LinkedIn Python Scraper API'
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
    let csvContent = 'Index,Name,Title,Location,Scraped At\\n';
    
    developers.forEach(dev => {
        csvContent += `${dev.index},"${dev.name}","${dev.title}","${dev.location}","${dev.scrapedAt}"\\n`;
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

app.listen(PORT, () => {
    console.log(`🚀 LinkedIn Scraper API running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Web interface: http://localhost:${PORT}`);
});
