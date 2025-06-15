const { create } = require('@open-wa/wa-automate');
const axios = require('axios');

create().then(client => {
    console.log('🤖 WhatsApp bot ready and listening...');

    client.onMessage(async message => {
        console.log('📥 New message:', message.body); // ראה כל הודעה

        if (/docs\.google\.com\/spreadsheets/.test(message.body)) {
            console.log('📩 Google Sheets link detected, sending to n8n...');

            try {
                await axios.post('https://ramqa.app.n8n.cloud/webhook/97866fe6-a0e4-487f-b21e-804701239ab0', {
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
