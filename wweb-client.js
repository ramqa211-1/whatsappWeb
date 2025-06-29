const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// נתיב לשמירת קובץ ה־QR
const qrPath = path.join(__dirname, 'qr_code.png');

// פונקציה לשליחת אימייל
async function sendQrToEmail(filePath, subject = '🔑 WhatsApp QR Code', text = 'מצורף QR להתחברות') {
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

    console.log('✅ QR נשלח למייל בהצלחה');
}

// יצירת הלקוח
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// קבלת QR והמרה לתמונה
client.on('qr', async qr => {
    console.log('📸 QR נוצר - שולח למייל...');
    try {
        await qrcode.toFile(qrPath, qr);
        await sendQrToEmail(qrPath);
    } catch (err) {
        console.error('❌ שגיאה בשליחת QR:', err);
    }
});

// התחברות מוכנה
client.on('ready', async () => {
    console.log('✅ WhatsApp מחובר ומוכן!');
    const info = await client.info;
    console.log(`📱 Connected to: ${info.pushname || 'Unknown'} (${info.wid._serialized})`);
    const name = info?.pushname || 'Unknown';
    const number = info?.id?.user || 'N/A';

    await sendQrToEmail(null, '✅ Bot Connected', `Bot connected:\nNumber: ${number}\nName: ${name}`);
});

// הודעה נכנסת
client.on('message', async msg => {
    console.log(`📩 הודעה מ-${msg.from}: ${msg.body}`);

    if (msg.body.toLowerCase().includes('שלום')) {
        await msg.reply('היי! קיבלתי אותך ✨');
    }
});

// התחלת החיבור
client.initialize();
