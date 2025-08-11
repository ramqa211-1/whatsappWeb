const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Root route
app.get('/', (req, res) => {
    res.send(`
        <h1>🚀 LinkedIn Scraper API</h1>
        <p>Server is running on port ${PORT}</p>
        <p><a href="/health">Health Check</a></p>
        <p>Time: ${new Date().toISOString()}</p>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
});

module.exports = app;
