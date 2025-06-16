const wppconnect = require('@wppconnect-team/wppconnect');
const axios = require('axios');

wppconnect.create({
    session: 'default',
    catchQR: (base64Qrimg, asciiQR) => {
        console.log('🔑 Scan this QR:\n', asciiQR);
    },
    headless: true,
    puppeteerOptions: {}, // ריק – בלי Chromium
    disableWelcome: true,
    logQR: true,
})
    .then((client) => {
        console.log('🤖 WhatsApp client ready');

        client.onMessage(async (message) => {
            console.log('📥 New message:', message.body);

            if (/docs\.google\.com\/spreadsheets/.test(message.body)) {
                console.log('📩 Google Sheets link detected, sending to n8n...');
                try {
                    await axios.post('https://primary-production-a35f4.up.railway.app/webhook-test/97866fe6-a0e4-487f-b21e-804701239ab0', {
                        message: message.body,
                        from: message.from,
                        chatName: message.chat?.name || '',
                        timestamp: message.timestamp,
                    });
                    console.log('✅ Sent to n8n successfully');
                } catch (err) {
                    console.error('❌ Failed to send to n8n:', err.message);
                }
            }
        });
    })
    .catch((error) => {
        console.error('❌ Failed to initialize WhatsApp client:', error);
    });
