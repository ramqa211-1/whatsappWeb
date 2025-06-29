// whatsappBot.js
const wppconnect = require('@wppconnect-team/wppconnect');
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');
const os = require('os');
require('dotenv').config();

const baseDataPath = path.join(os.homedir(), 'wpp-data');
const sessionDir = path.join(baseDataPath, 'whatsapp-sessions');
const tokensDir = path.join(baseDataPath, 'tokens');
fs.mkdirSync(sessionDir, { recursive: true });
fs.mkdirSync(tokensDir, { recursive: true });

async function sendQrToEmail(filePath = null, override = {}) {
    console.log('📤 Sending QR code email...');
    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    try {
        await transport.sendMail({
            from: `"WhatsApp Bot" <${process.env.EMAIL_USER}>`,
            to: 'ramvt2@gmail.com',
            subject: override.subject || '🔑 WhatsApp QR Code',
            text: override.text || 'מצורפת תמונת QR לסריקה והתחברות',
            attachments: filePath ? [{ filename: 'qr_code.png', path: filePath }] : []
        });
        console.log('✅ QR email sent successfully');
    } catch (err) {
        console.error('❌ Failed to send QR email:', err);
    }
}

async function waitForHostDevice(client, retries = 5, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`🔄 Checking device info (attempt ${i + 1}/${retries})...`);
            const info = await client.getHostDevice();
            if (info?.wid?.user) {
                console.log('✅ Device info received successfully');
                return info;
            }
        } catch {
            console.warn(`⏳ WAPI not ready yet (attempt ${i + 1})`);
        }
        await new Promise(res => setTimeout(res, delay));
    }
    throw new Error('WAPI is not defined after multiple retries');
}

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        userDataDir: '/tmp/wpp-session'
    });
    console.log('🔥 puppeteer browser launched');

    const client = await wppconnect.create({
        session: 'default',
        browser,
        browserSessionTokenDir: tokensDir,
        logQR: true,
        disableWelcome: true,
        catchQR: async (base64, ascii) => {
            console.log('📸 QR code generated:\n' + ascii);
            const img = path.join(baseDataPath, 'qr_code.png');
            fs.writeFileSync(img, Buffer.from(base64.split(',')[1], 'base64'));
            console.log(`🖼️ QR code saved at: ${img}`);
            await sendQrToEmail(img);
        }
    });

    console.log('🤖 WhatsApp client is ready');

    try {
        const info = await waitForHostDevice(client);
        const name = info?.pushname || 'Unknown';
        const number = info?.wid?.user || 'N/A';
        console.log(`✅ Successfully connected as: ${name} (${number})`);

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
        return;
    }

    console.log('📨 Listening for incoming WhatsApp messages...');

    client.onMessage(async ({ body, from, chat, timestamp }) => {
        console.log(`📩 Message from ${from} at ${new Date(timestamp * 1000).toISOString()}: ${body}`);

        if (/docs\.google\.com\/spreadsheets/.test(body)) {
            console.log('🔗 Google Sheet detected. Sending to n8n...');
            try {
                await axios.post('https://primary-production-a35f4.up.railway.app/webhook/97866fe6-a0e4-487f-b21e-804701239ab0', {
                    message: body,
                    from,
                    chatName: chat?.name || '',
                    timestamp
                });
                console.log('✅ Google Sheets link forwarded to n8n');
            } catch (err) {
                console.error('❌ Failed to forward to n8n:', err.message);
            }
        }

        if (body.toLowerCase().includes('שער שניר')) {
            console.log('🚪 Detected gate trigger. Sending to n8n...');
            try {
                await axios.post('https://primary-production-a35f4.up.railway.app/webhook/open-gate', {
                    trigger: 'whatsapp',
                    message: body,
                    from
                });
                console.log('✅ Gate webhook sent to n8n');
            } catch (err) {
                console.error('❌ Failed to send gate webhook to n8n:', err.message);
            }
        }
    });
})().catch((err) => {
    console.error('❌ Fatal error in main function:', err);
});