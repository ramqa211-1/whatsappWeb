const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000; // Fixed port for both local and Railway

// Basic middleware
app.use(express.json());
app.use(express.static('public'));

// Store for scraping results
let scrapingResults = new Map();

// Simple routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

    // הרצת החילוץ ברקע (כרגע רק simulation)
    setTimeout(() => {
        scrapingResults.set(jobId, {
            status: 'completed',
            startedAt: scrapingResults.get(jobId).startedAt,
            completedAt: new Date().toISOString(),
            data: {
                success: true,
                totalResults: 5,
                developers: [
                    { index: 1, name: 'John Doe', title: 'Python Developer', location: 'Tel Aviv, Israel' },
                    { index: 2, name: 'Jane Smith', title: 'Senior Python Developer', location: 'Jerusalem, Israel' },
                    { index: 3, name: 'Bob Johnson', title: 'Python Backend Developer', location: 'Haifa, Israel' },
                    { index: 4, name: 'Alice Brown', title: 'Full Stack Python Developer', location: 'Beer Sheva, Israel' },
                    { index: 5, name: 'Charlie Wilson', title: 'Python Engineer', location: 'Eilat, Israel' }
                ],
                scrapedAt: new Date().toISOString()
            }
        });
    }, 5000); // 5 שניות simulation
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
    res.setHeader('Content-Disposition', `attachment; filename="python_developers_${jobId}.csv"`);
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
