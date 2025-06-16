const { create } = require('@open-wa/wa-automate');
const axios = require('axios');

create({
    qrTimeout: 0, // אל תפסיק את יצירת ה-QR
    headless: true,
    authTimeout: 60, // זמן לחכות להזדהות
    qrRefreshS: 15, // רענון QR כל 15 שניות
    chromiumArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    useChrome: false,
    browserWS: '',
    killProcessOnBrowserClose: true,
    popup: true, // ✅ מאפשר לפתוח ממשק ב־localhost:3000/qr
    cacheEnabled: false
}).then(client => {
    console.log('🤖 WhatsApp bot ready and listening...');

    client.onMessage(async message => {
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
});
