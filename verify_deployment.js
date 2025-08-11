const https = require('https');
const http = require('http');

// Configuration - Update this with your Railway URL
const BASE_URL = process.env.RAILWAY_URL || 'https://whatsappweb-production-8676.up.railway.app';

console.log('🔍 Verifying Railway Deployment...');
console.log(`📍 Testing URL: ${BASE_URL}`);
console.log('');

// Test endpoints
const endpoints = [
    { path: '/', name: 'Main Page' },
    { path: '/test', name: 'Test Endpoint' },
    { path: '/health', name: 'Health Check' }
];

async function testEndpoint(path, name) {
    return new Promise((resolve) => {
        const url = new URL(path, BASE_URL);
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const status = res.statusCode;
                const isSuccess = status >= 200 && status < 300;
                
                console.log(`${isSuccess ? '✅' : '❌'} ${name} (${path})`);
                console.log(`   Status: ${status}`);
                
                if (path === '/test' && isSuccess) {
                    try {
                        const jsonData = JSON.parse(data);
                        console.log(`   Response: ${JSON.stringify(jsonData, null, 2)}`);
                    } catch (e) {
                        console.log(`   Response: ${data.substring(0, 100)}...`);
                    }
                } else if (path === '/health' && isSuccess) {
                    try {
                        const jsonData = JSON.parse(data);
                        console.log(`   Service: ${jsonData.service}`);
                        console.log(`   Environment: ${jsonData.environment}`);
                    } catch (e) {
                        console.log(`   Response: ${data.substring(0, 100)}...`);
                    }
                } else if (path === '/' && isSuccess) {
                    console.log(`   Response: HTML page (${data.length} characters)`);
                }
                
                console.log('');
                resolve();
            });
        });
        
        req.on('error', (err) => {
            console.log(`❌ ${name} (${path})`);
            console.log(`   Error: ${err.message}`);
            console.log('');
            resolve();
        });
        
        req.setTimeout(10000, () => {
            console.log(`⏰ ${name} (${path})`);
            console.log(`   Timeout: Request took too long`);
            console.log('');
            req.destroy();
            resolve();
        });
    });
}

async function runTests() {
    console.log('🚀 Starting endpoint tests...\n');
    
    for (const endpoint of endpoints) {
        await testEndpoint(endpoint.path, endpoint.name);
    }
    
    console.log('📋 Test Summary:');
    console.log(`🌐 Your application should be accessible at: ${BASE_URL}`);
    console.log(`📱 Web interface: ${BASE_URL}`);
    console.log(`🔧 API endpoints: ${BASE_URL}/api/*`);
    console.log('');
    console.log('💡 If tests fail, check:');
    console.log('   1. Railway deployment logs');
    console.log('   2. Environment variables in Railway dashboard');
    console.log('   3. Build process completion');
    console.log('   4. Application startup in Railway logs');
}

// Run the tests
runTests().catch(console.error);
