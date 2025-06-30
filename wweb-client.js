const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


// נתיב לשמירת קובץ QR
const qrPath = path.join(__dirname, 'qr_code.png');

// שליחת QR במייל
async function sendQrToEmail(filePath, subject = '🔑 WhatsApp QR Code', text = 'מצורף QR להתחברות') {
    console.log('📧 Sending QR via email...');
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: `"WhatsApp Bot" <${process.env.EMAIL_USER}>`,
        to: 'ramvt2@gmail.com',
        subject,
        text,
        attachments: filePath ? [{ filename: 'qr_code.png', path: filePath }] : []
    });

    console.log('✅ Email sent successfully');
}

// יצירת לקוח WhatsApp עם שמירת סשן בתוך ה-volume
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: '/app/wpp-data' // ← נתיב שממופה ל-volume ב-Railway
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// QR שנוצר
client.on('qr', async qr => {
    console.log('📸 QR code generated, saving and sending by email...');
    try {
        await qrcode.toFile(qrPath, qr);
        await sendQrToEmail(qrPath);
    } catch (err) {
        console.error('❌ Error sending QR:', err);
    }
});


client.on('ready', async () => {
    console.log('✅ WhatsApp מחובר ומוכן!');
    try {
        const info = client.info;
        const name = info?.pushname || 'Unknown';
        const number = info?.wid?.user || 'N/A';

        console.log(`📱 Connected as: ${name} (${number})`);

        await sendQrToEmail(null, '✅ Bot Connected', `Bot connected:\nNumber: ${number}\nName: ${name}`);
    } catch (err) {
        console.error('❌ Error retrieving info:', err);
    }

    // ✅ זה המקום הנכון להדמיה!
    setTimeout(() => {
        client.emit('message', {
            body: 'סכם לי את המיילים של סלקום',
            from: '972548010190@c.us',
            _data: { notifyName: 'Ram QA Bot' },
            timestamp: Math.floor(Date.now() / 1000)
        });
    }, 5000);
});

// הודעות נכנסות
client.on('message', async msg => {
    console.log(`📩 New message from ${msg.from}: ${msg.body}`);

    const body = msg.body.toLowerCase();
    const timestamp = msg.timestamp;
    const from = msg.from;
    const chat = msg._data?.notifyName || '';

    // לינק של גוגל שיט
    if (/docs\.google\.com\/spreadsheets/.test(body)) {
        console.log('🔗 Google Sheet detected. Sending to n8n...');
        try {
            await axios.post('https://primary-production-a35f4.up.railway.app/webhook/97866fe6-a0e4-487f-b21e-804701239ab0', {
                message: msg.body,
                from,
                chatName: chat,
                timestamp
            });
            console.log('✅ Google Sheets link forwarded to n8n');
        } catch (err) {
            console.error('❌ Failed to forward to n8n:', err.message);
        }
    }

    // תנאי כללי לניתוח פקודות AI
    if (body.includes('מייל') || body.includes('סכם') || body.includes('מצא לי') || body.includes('חפש לי')) {
        console.log('🧠 Detected potential AI command, forwarding to n8n...');

        try {
            await axios.post('https://primary-production-a35f4.up.railway.app/webhook/ai-command', {
                message: msg.body,
                from,
                chatName: chat,
                timestamp
            });
            console.log('✅ AI command sent to n8n');
        } catch (err) {
            console.error('❌ Failed to send AI command:', err.message);
        }
    }


    // טריגר של שער
    if (body.includes('שער שניר')) {
        console.log('🚪 Detected gate trigger. Sending to n8n...');
        try {
            await axios.post('https://primary-production-a35f4.up.railway.app/webhook/open-gate', {
                trigger: 'whatsapp',
                message: msg.body,
                from
            });
            console.log('✅ Gate webhook sent to n8n');
        } catch (err) {
            console.error('❌ Failed to send gate webhook to n8n:', err.message);
        }
    }
});

// הפעלת הבוט
client.initialize().catch(err => {
    console.error('❌ Fatal Error during initialize:', err);
});

// Endpoint לשליחת הודעה לוואטסאפ מבחוץ (למשל מ-n8n)
app.post('/send-message', async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({ error: 'Missing "to" or "message" field' });
    }

    try {
        await client.sendMessage(to, message);
        console.log(`📤 Sent message to ${to}: ${message}`);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Failed to send message:', err.message);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Express server running on port ${PORT}`);
});

