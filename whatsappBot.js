const wppconnect = require('@wppconnect-team/wppconnect');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// שימוש בתיקיות שיש לנו הרשאות עליהן
const sessionPath = '/tmp/wpp-session';
const tokensPath = '/tmp/tokens'; // שינוי מ-/app/tokens ל-/tmp/tokens
const sessionFile = `${sessionPath}/default/session.default.json`;

console.log('🚀 Starting WhatsApp bot setup');

try {
    // יצירת תיקיות אם הן לא קיימות
    fs.mkdirSync(`${sessionPath}/default`, { recursive: true });
    fs.mkdirSync(tokensPath, { recursive: true });
    console.log(`📁 Session directory ensured at: ${sessionPath}/default`);
    console.log(`📁 Tokens directory ensured at: ${tokensPath}`);
} catch (err) {
    console.error('❌ Failed to create directories:', err);
}

if (fs.existsSync(sessionFile)) {
    console.log('✅ Session token found:', sessionFile);
} else {
    console.warn('⚠️ No session token found, will require QR scan');
}

// בדיקת נתיבים אפשריים לכרום
function findChromePath() {
    const possiblePaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/opt/google/chrome/chrome'
    ];

    for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
            console.log(`✅ Found Chrome at: ${path}`);
            return path;
        }
    }

    console.log('⚠️ Chrome not found in standard locations');
    return '/usr/bin/google-chrome-stable'; // default fallback
}

const chromePath = findChromePath();
console.log('🔧 Initializing wppconnect...');

const wppOptions = {
    session: 'default',
    sessionPath,
    browserSessionTokenDir: tokensPath,
    catchQR: (base64Qrimg, asciiQR) => {
        console.log('🔑 QR CODE GENERATED — SCAN IT:\n', asciiQR);
    },
    headless: true,
    disableWelcome: true,
    logQR: true,
    executablePath: chromePath,
    browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-zygote',
        '--single-process'
    ],
    puppeteerOptions: {
        executablePath: chromePath,
        userDataDir: tokensPath,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-zygote',
            '--single-process'
        ]
    }
};

console.log(`🔧 Using browser: ${chromePath}`);

wppconnect.create(wppOptions)
    .then((client) => {
        console.log('🤖 WhatsApp client is ready and listening...');

        client.onMessage(async (message) => {
            console.log(`📥 Incoming message from ${message.from}:`, message.body);

            if (/docs\.google\.com\/spreadsheets/.test(message.body)) {
                console.log('📩 Google Sheets link detected, preparing to forward to n8n...');
                try {
                    await axios.post('https://primary-production-a35f4.up.railway.app/webhook-test/97866fe6-a0e4-487f-b21e-804701239ab0', {
                        message: message.body,
                        from: message.from,
                        chatName: message.chat?.name || '',
                        timestamp: message.timestamp,
                    });
                    console.log('✅ Message forwarded to n8n successfully');
                } catch (err) {
                    console.error('❌ Failed to send message to n8n:', err.message);
                }
            }
        });
    })
    .catch((error) => {
        console.error('❌ Failed to initialize WhatsApp client:', error);
        process.exit(1);
    });