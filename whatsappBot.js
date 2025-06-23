const wppconnect = require('@wppconnect-team/wppconnect');
const axios = require('axios');
const fs = require('fs');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const path = require('path');

// נתיב שמכיל מידע שצריך לשרוד בין הפעלות
const persistentDataPath = '/app/wpp-data';
const sessionDir = path.join(persistentDataPath, 'whatsapp-sessions');
const tokensDir = path.join(persistentDataPath, 'tokens');

console.log('🚀 Starting WhatsApp bot setup');

try {
    fs.mkdirSync(sessionDir, { recursive: true });
    fs.mkdirSync(tokensDir, { recursive: true });
    console.log(`📁 Session directory ensured at: ${sessionDir}`);
    console.log(`📁 Tokens directory ensured at: ${tokensDir}`);
} catch (err) {
    console.error('❌ Failed to create directories:', err);
}

if (fs.existsSync(sessionDir) && fs.readdirSync(sessionDir).length > 0) {
    console.log('✅ Existing session data found in:', sessionDir);
} else {
    console.warn('⚠️ No session token found, will require QR scan');
}

function findChromePath() {
    const possiblePaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/opt/google/chrome/chrome'
    ];
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log(`✅ Found Chrome at: ${p}`);
            return p;
        }
    }
    console.log('⚠️ Chrome not found in standard locations');
    return '/usr/bin/google-chrome-stable';
}

async function sendQrToEmail(filePath = null, override = {}) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"WhatsApp Bot" <${process.env.EMAIL_USER}>`,
        to: 'ramvt2@gmail.com',
        subject: override.subject || '🔑 WhatsApp QR Code',
        text: override.text || 'מצורפת תמונת QR לסריקה והתחברות',
        attachments: filePath ? [{
            filename: 'qr_code.png',
            path: filePath
        }] : []
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('📧 Email sent successfully');
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
}

const chromePath = findChromePath();
console.log('🔧 Initializing wppconnect...');

const wppOptions = {
    session: 'default',
    sessionPath: sessionDir,
    browserSessionTokenDir: tokensDir,
    catchQR: async (base64Qrimg, asciiQR) => {
        console.log('🔑 QR CODE GENERATED — SCAN IT:\n', asciiQR);
        const rawPath = path.join(persistentDataPath, 'qr_code.png');
        const rawBuffer = Buffer.from(base64Qrimg.replace('data:image/png;base64,', ''), 'base64');
        fs.writeFileSync(rawPath, rawBuffer);
        console.log(`🖼️ QR code saved to: ${rawPath}`);
        await sendQrToEmail(rawPath);
    },
    headless: true,
    disableWelcome: true,
    logQR: true,
    executablePath: chromePath,
    browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-zygote',
        '--single-process'
    ],
    puppeteerOptions: {
        executablePath: chromePath,
        userDataDir: sessionDir,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-zygote',
            '--single-process'
        ]
    }
};

console.log(`🔧 Using browser: ${chromePath}`);

wppconnect.create(wppOptions)
    .then(async (client) => {
        console.log('🤖 WhatsApp client is ready and listening...');

        try {
            const info = await client.getHostDevice();
            console.log(`✅ Connected to: ${info.pushname} (${info.wid.user})`);
            await sendQrToEmail(null, {
                subject: '✅ WhatsApp Bot Connected!',
                text: `The bot is live and connected to WhatsApp:\n📱 Number: ${info.wid.user}\n👤 Name: ${info.pushname}`
            });
        } catch (err) {
            console.error('❌ Failed to verify WhatsApp connection:', err);
            await sendQrToEmail(null, {
                subject: '❌ WhatsApp Connection Failed',
                text: `The bot started but failed to verify connection.\nError: ${err.message}`
            });
        }

        client.onMessage(async (message) => {
            console.log(`📥 Incoming message from ${message.from}:`, message.body);

            // שליחה ל-n8n אם יש קישור ל-Google Sheets
            if (/docs\.google\.com\/spreadsheets/.test(message.body)) {
                console.log('📩 Google Sheets link detected, forwarding to n8n...');
                try {
                    await axios.post('https://primary-production-a35f4.up.railway.app/webhook-test/97866fe6-a0e4-487f-b21e-804701239ab0', {
                        message: message.body,
                        from: message.from,
                        chatName: message.chat?.name || '',
                        timestamp: message.timestamp
                    });
                    console.log('✅ Google Sheets link sent to n8n successfully');
                } catch (err) {
                    console.error('❌ Failed to send Google Sheets link to n8n:', err.message);
                }
            }

            // שליחה ל-n8n אם ההודעה מכילה את המילה "שער"
            if (message.body.toLowerCase().includes("שער שניר")) {
                console.log('🚪 Trigger word "שער" detected, sending to n8n webhook...');
                try {
                    await axios.post('https://primary-production-a35f4.up.railway.app/webhook-test/open-gate', {
                        trigger: 'whatsapp',
                        message: message.body,
                        from: message.from
                    });
                    console.log('✅ Gate trigger sent to n8n');
                } catch (error) {
                    console.error('❌ Failed to send gate trigger to n8n:', error.message);
                }
            }
        });
    })
    .catch((error) => {
        console.error('❌ Failed to initialize WhatsApp client:', error);
        process.exit(1);
    });
