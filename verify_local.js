const http = require('http');

// Configuration for local testing
const BASE_URL = 'http://localhost:3000';

console.log('🔍 בדיקת האפליקציה המקומית...');
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
        const url = `${BASE_URL}${path}`;
        
        const req = http.get(url, (res) => {
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
                        console.log(`   Playwright: ${jsonData.playwright ? 'Available' : 'Not Available'}`);
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
        
        req.setTimeout(5000, () => {
            console.log(`⏰ ${name} (${path})`);
            console.log(`   Timeout: Request took too long`);
            console.log('');
            req.destroy();
            resolve();
        });
    });
}

async function runTests() {
    console.log('🚀 Starting local endpoint tests...\n');
    
    for (const endpoint of endpoints) {
        await testEndpoint(endpoint.path, endpoint.name);
    }
    
    console.log('📋 Test Summary:');
    console.log(`🌐 Your local application should be accessible at: ${BASE_URL}`);
    console.log(`📱 Web interface: ${BASE_URL}`);
    console.log(`🔧 API endpoints: ${BASE_URL}/api/*`);
    console.log('');
    console.log('💡 If tests fail:');
    console.log('   1. Make sure the server is running (npm start)');
    console.log('   2. Check if port 3000 is available');
    console.log('   3. Verify all dependencies are installed');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   1. If local tests pass, push to Railway');
    console.log('   2. If local tests fail, fix issues first');
}

// Run the tests
runTests().catch(console.error);
