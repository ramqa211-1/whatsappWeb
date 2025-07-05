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

const qrPath = path.join(__dirname, 'qr_code.png');

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

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: '/app/wpp-data'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// QR
client.on('qr', async qr => {
    console.log('📸 QR code generated, saving and sending by email...');
    try {
        await qrcode.toFile(qrPath, qr);
        await sendQrToEmail(qrPath);
    } catch (err) {
        console.error('❌ Error sending QR:', err);
    }
});

// מחובר
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
});

// לוגיקה משותפת לכל הודעה
async function handleMessage(msg, source = 'event') {
    const body = msg.body?.toLowerCase?.() || '';
    const timestamp = msg.timestamp;
    let from = msg.from || msg.to || 'unknown';
    const chatName = msg._data?.notifyName || '';

    // 🔍 בדיקת קבוצה וזיהוי השולח
    try {
        const chatObj = await msg.getChat();
        if (chatObj.isGroup) {
            const contact = await msg.getContact();
            const senderNumber = contact.number + '@c.us';
            console.log(`🔍 Group message from: ${senderNumber}`);
            from = senderNumber;
        }
    } catch (e) {
        console.error('❌ Failed to extract contact info:', e.message);
    }

    console.log(`📩 [${source}] Message from ${from}: ${body}`);

    if (/docs\.google\.com\/spreadsheets/.test(body)) {
        console.log('🔗 Google Sheet detected. Sending to n8n...');
        try {
            await axios.post('https://primary-production-a35f4.up.railway.app/webhook/97866fe6-a0e4-487f-b21e-804701239ab0', {
                message: msg.body,
                from,
                chatName,
                timestamp
            });
            console.log('✅ Google Sheets link forwarded to n8n');
        } catch (err) {
            console.error('❌ Failed to forward to n8n:', err.message);
        }
    }
//
    if (body.includes('מייל') || body.includes('סכם') || body.includes('מצא לי') || body.includes('חפש לי')) {
        console.log('🧠 Detected potential AI command, forwarding to n8n...');
        try {
            await axios.post('https://primary-production-a35f4.up.railway.app/webhook/ai-command', {
                message: msg.body,
                from,
                chatName,
                timestamp
            });
            console.log('✅ AI command sent to n8n');
        } catch (err) {
            console.error('❌ Failed to send AI command:', err.message);
        }
    }

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
}

// הודעות נכנסות
client.on('message', async msg => {
    await handleMessage(msg, 'message');
});

// הודעות שאתה שלחת (כולל לקבוצות)
client.on('message_create', async msg => {
    if (msg.fromMe && msg.to.includes('@g.us')) {
        await handleMessage(msg, 'message_create');
    }
});

// הפעלת הבוט
client.initialize().catch(err => {
    console.error('❌ Fatal Error during initialize:', err);
});

// endpoint חיצוני לשליחת הודעות
app.post('https://whatsappweb-production-a290.up.railway.app/send-message', async (req, res) => {
    console.log('📨 Incoming request to /send-message:', req.body);

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