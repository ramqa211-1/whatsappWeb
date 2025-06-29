// whatsappBot.js
const wppconnect = require('@wppconnect-team/wppconnect');
const puppeteer  = require('puppeteer-core');
const axios      = require('axios');
const fs         = require('fs');
const nodemailer = require('nodemailer');
const path       = require('path');
const os         = require('os');

// ---------- נתיבים ----------
const baseDataPath = path.join(os.homedir(), 'wpp-data');
const sessionDir   = path.join(baseDataPath, 'whatsapp-sessions');
const tokensDir    = path.join(baseDataPath, 'tokens');

// Chrome for Testing שהרצת עכשיו
const chromePath = 'C:/Users/RamWalastal/.cache/puppeteer/chrome/win64-138.0.7204.49/chrome-win64/chrome.exe';

// ---------- תיקיות מתמידות ----------
fs.mkdirSync(sessionDir, { recursive: true });
fs.mkdirSync(tokensDir,  { recursive: true });

// ---------- שליחת QR למייל ----------
async function sendQrToEmail(filePath = null, override = {}) {
    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transport.sendMail({
        from: `"WhatsApp Bot" <${process.env.EMAIL_USER}>`,
        to:   'ramvt2@gmail.com',
        subject: override.subject || '🔑 WhatsApp QR Code',
        text:    override.text    || 'מצורפת תמונת QR לסריקה והתחברות',
        attachments: filePath ? [{ filename: 'qr_code.png', path: filePath }] : []
    });
    console.log('📧 Email sent');
}

// ---------- MAIN ----------
(async () => {
    // 1) פותחים כרום עם אותם דגלים שבדקת
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: false,
        userDataDir: sessionDir,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('🔥 puppeteer browser launched');

    // 2) מחברים את WPPConnect לדפדפן הזה
    const client = await wppconnect.create({
        session: 'default',
        browser,                         // ⬅️ המופע הפתוח
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
    const info = await client.getHostDevice();
    console.log(`✅ Connected as ${info.pushname} (${info.wid.user})`);
    await sendQrToEmail(null, {
        subject: '✅ Bot Connected',
        text: `Bot connected:\nNumber: ${info.wid.user}\nName: ${info.pushname}`
    });

    // 4) האזנה להודעות
    client.onMessage(async ({ body, from, chat, timestamp }) => {
        console.log(`📥 ${from}: ${body}`);

        // לינק Google Sheets -> n8n
        if (/docs\.google\.com\/spreadsheets/.test(body)) {
            await axios.post(
                'https://primary-production-a35f4.up.railway.app/webhook/97866fe6-a0e4-487f-b21e-804701239ab0',
                { message: body, from, chatName: chat?.name || '', timestamp }
            );
        }

        // טריגר “שער שניר” -> פתיחת שער
        if (body.toLowerCase().includes('שער שניר')) {
            await axios.post(
                'https://primary-production-a35f4.up.railway.app/webhook/open-gate',
                { trigger: 'whatsapp', message: body, from }
            );
        }
    });
})().catch(async (err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
