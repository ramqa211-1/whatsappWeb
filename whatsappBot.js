// whatsappBot.js
const wppconnect = require('@wppconnect-team/wppconnect');
const puppeteer  = require('puppeteer');        // ← puppeteer הרגיל
const axios      = require('axios');
const fs         = require('fs');
const nodemailer = require('nodemailer');
const path       = require('path');
const os         = require('os');
require('dotenv').config(); // ← חובה אם אתה לא עובד עם Railway/Env מובנה


// נתיבי דאטה מקומיים (בתוך /root או /home/runner)
const baseDataPath = path.join(os.homedir(), 'wpp-data');
const sessionDir   = path.join(baseDataPath, 'whatsapp-sessions');
const tokensDir    = path.join(baseDataPath, 'tokens');
fs.mkdirSync(sessionDir, { recursive: true });
fs.mkdirSync(tokensDir,  { recursive: true });

async function sendQrToEmail(filePath = null, override = {}) {
    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transport.sendMail({
        from: `"WhatsApp Bot" <${process.env.EMAIL_USER}>`,
        to: 'ramvt2@gmail.com',
        subject: override.subject || '🔑 WhatsApp QR Code',
        text: override.text || 'מצורפת תמונת QR לסריקה והתחברות',
        attachments: filePath ? [{ filename: 'qr_code.png', path: filePath }] : []
    });
    console.log('📧 Email sent');
}

(async () => {
    // 1) פותחים את Chromium שה-puppeteer התקין באופן אוטומטי
    const browser = await puppeteer.launch({
        headless: true,                                   // אין GUI
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        userDataDir: '/tmp/wpp-session'                   // כתיבה בטוחה
    });
    console.log('🔥 puppeteer browser launched');

    // 2) מחברים ל-WPPConnect
    const client = await wppconnect.create({
        session: 'default',
        browser,
        browserSessionTokenDir: tokensDir,
        logQR: true,
        disableWelcome: true,
        catchQR: async (base64, ascii) => {
            console.log('🔑 QR CODE:\n', ascii);
            const img = path.join(baseDataPath, 'qr_code.png');
            fs.writeFileSync(img, Buffer.from(base64.split(',')[1], 'base64'));
            await sendQrToEmail(img);
        }
    });

    // 3) חיבור הצליח
    console.log('🤖 WhatsApp client ready');

    try {
        const info = await client.getHostDevice();
        const name = info?.pushname || 'Unknown';
        const number = info?.wid?.user || 'N/A';
        console.log(`✅ Connected as ${name} (${number})`);
        await sendQrToEmail(null, {
            subject: '✅ Bot Connected',
            text: `Bot connected:\nNumber: ${number}\nName: ${name}`
        });
    } catch (err) {
        console.error('❌ Failed to verify WhatsApp connection:', err);
        await sendQrToEmail(null, {
            subject: '❌ WhatsApp Connection Failed',
            text: `The bot started but failed to verify connection.\nError: ${err.message}`
        });
    }


    // 4) האזנה להודעות
    client.onMessage(async ({ body, from, chat, timestamp }) => {
        console.log(`📥 ${from}: ${body}`);
        if (/docs\.google\.com\/spreadsheets/.test(body)) {
            await axios.post(
                'https://primary-production-a35f4.up.railway.app/webhook/97866fe6-a0e4-487f-b21e-804701239ab0',
                { message: body, from, chatName: chat?.name || '', timestamp }
            );
        }
        if (body.toLowerCase().includes('שער שניר')) {
            await axios.post(
                'https://primary-production-a35f4.up.railway.app/webhook/open-gate',
                { trigger: 'whatsapp', message: body, from }
            );
        }
    });
})().catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
