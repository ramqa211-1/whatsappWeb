// Debug server for Railway
console.log('🚀 Starting debug server...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Environment variables:');
console.log('- PORT:', process.env.PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);

const express = require('express');
console.log('✅ Express loaded successfully');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔧 Setting up routes...');

app.get('/', (req, res) => {
    console.log('📝 Root route hit');
    res.send(`
        <h1>🎉 Server is working!</h1>
        <p>Port: ${PORT}</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>Node: ${process.version}</p>
        <p><a href="/health">Health Check</a></p>
    `);
});

app.get('/health', (req, res) => {
    console.log('🏥 Health check hit');
    res.json({
        status: 'OK',
        port: PORT,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

app.get('/debug', (req, res) => {
    console.log('🐛 Debug endpoint hit');
    res.json({
        env: process.env,
        versions: process.versions,
        platform: process.platform,
        uptime: process.uptime()
    });
});

console.log('🌐 Starting server on port', PORT);

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('✅ Server successfully started!');
    console.log('📍 Listening on port:', PORT);
    console.log('🌐 Access URLs:');
    console.log('  - Root: http://localhost:' + PORT);
    console.log('  - Health: http://localhost:' + PORT + '/health');
    console.log('  - Debug: http://localhost:' + PORT + '/debug');
});

server.on('error', (err) => {
    console.error('💥 Server error:', err);
});

process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled rejection:', reason);
});

console.log('🎯 Debug server setup complete');
