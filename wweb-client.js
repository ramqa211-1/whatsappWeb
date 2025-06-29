const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

// התחברות מוצלחת
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

// הודעות נכנסות
client.on('message', async msg => {
    console.log(`📩 New message from ${msg.from}: ${msg.body}`);

    if (msg.body.toLowerCase().includes('שלום')) {
        await msg.reply('היי! קיבלתי אותך ✨');
    }
});

// הפעלת הבוט
client.initialize().catch(err => {
    console.error('❌ Fatal Error during initialize:', err);
});
