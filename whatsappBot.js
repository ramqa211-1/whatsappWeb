const wppconnect = require('@wppconnect-team/wppconnect');
const axios = require('axios');
const fs = require('fs');
const sessionPath = '/tmp/wpp-session';
const sessionFile = `${sessionPath}/default/session.default.json`;

console.log('🚀 Starting WhatsApp bot setup');

try {
    fs.mkdirSync(`${sessionPath}/default`, { recursive: true });
    console.log(`📁 Session directory ensured at: ${sessionPath}/default`);
} catch (err) {
    console.error('❌ Failed to create session directory:', err);
}

if (fs.existsSync(sessionFile)) {
    console.log('✅ Session token found:', sessionFile);
} else {
    console.warn('⚠️ No session token found, will require QR scan');
}

console.log('🔧 Initializing wppconnect...');

wppconnect.create({
    session: 'default',
    sessionPath,
    catchQR: (base64Qrimg, asciiQR) => {
        console.log('🔑 QR CODE GENERATED — SCAN IT:\n', asciiQR);
    },
    headless: true,
    disableWelcome: true,
    logQR: true,
    browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
    ],
    browserSessionTokenDir: `${sessionPath}/default`
})
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
    });
