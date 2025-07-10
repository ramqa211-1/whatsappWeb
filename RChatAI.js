// Global error handlers — לפני כל require אחר
process.on('uncaughtException', err => {
    console.error('🔥 Uncaught Exception:', err);
});

process.on('unhandledRejection', reason => {
    console.error('💥 Unhandled Rejection:', reason);
});

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

// מחסן לקוחות
const clients = new Map(); // clientId -> Client instance
const clientEmails = new Map(); // clientId -> email for QR sending

// יצירת תיקיות נדרשות
const ensureDirectories = () => {
    const dirs = ['./qr_codes', './client_data'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });
};

ensureDirectories();

// פונקציה לשליחת מייל
async function sendEmail(to, subject, text, attachments = []) {
    console.log(`📧 Sending email to ${to}: ${subject}`);
    const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: `"WhatsApp Bot System" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        attachments
    });

    console.log(`✅ Email sent successfully to ${to}`);
}

// יצירת לקוח WhatsApp חדש
async function createWhatsAppClient(clientId, clientEmail) {
    console.log(`🆕 Creating WhatsApp client for: ${clientId}`);

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: clientId,
            dataPath: `./client_data/${clientId}`
        }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    // QR Code generation
    client.on('qr', async qr => {
        console.log(`📸 QR code generated for: ${clientId}`);

        const qrPath = `./qr_codes/${clientId}_qr.png`;

        try {
            await qrcode.toFile(qrPath, qr);

            // שליחת QR ללקוח
            await sendEmail(
                clientEmail,
                '🔑 קוד QR להפעלת הבוט שלך',
                `
היי!

הבוט WhatsApp החכם שלך מוכן להפעלה! 🤖

📱 איך להפעיל:
1. פתח WhatsApp בטלפון שלך
2. לחץ על שלוש הנקודות (⋮) בפינה הימנית העליונה  
3. בחר "WhatsApp Web"
4. סרוק את קוד ה-QR המצורף

הבוט יהיה פעיל תוך שניות ויתחיל לענות ללקוחות שלך אוטומטית! 🚀

בהצלחה!
צוות התמיכה
                `,
                [{ filename: 'qr_code.png', path: qrPath }]
            );

            // הודעה למנהל המערכת
            await sendEmail(
                'raiservices211@gmail.com',
                `📱 QR Generated: ${clientId}`,
                `QR code generated for client: ${clientId}\nEmail: ${clientEmail}\nWaiting for connection...`
            );

        } catch (error) {
            console.error(`❌ Error handling QR for ${clientId}:`, error);
        }
    });

    // Connection ready
    client.on('ready', async () => {
        console.log(`✅ Client ${clientId} WhatsApp connected!`);

        try {
            const info = client.info;
            const name = info?.pushname || 'Unknown';
            const number = info?.wid?.user || 'N/A';

            console.log(`📱 ${clientId} connected as: ${name} (${number})`);

            // הודעה ללקוח שהבוט פעיל
            await sendEmail(
                clientEmail,
                '✅ הבוט שלך פעיל!',
                `
🎉 מעולה! הבוט WhatsApp שלך פעיל ועובד!

📱 פרטי החיבור:
• שם: ${name}
• מספר: ${number}

🤖 הבוט שלך עכשיו:
✅ עונה ללקוחות אוטומטית 24/7
✅ מעביר כל הודעה למערכת החכמה
✅ שולח תגובות מקצועיות בשמך

💬 איך זה עובד:
כל הודעה שמגיעה אליך בWhatsApp תעבור דרך הבוט החכם. 
אתה תראה את כל השיחות כרגיל ותוכל להתערב בכל רגע.

הבוט מוכן לעבודה! 🚀
                `
            );

            // הודעה למנהל
            await sendEmail(
                'raiservices211@gmail.com',
                `✅ Client Connected: ${clientId}`,
                `
Client successfully connected!
• Client ID: ${clientId}
• Phone: ${number}
• Name: ${name}
• Email: ${clientEmail}
• Connected at: ${new Date().toLocaleString('he-IL')}
                `
            );

        } catch (error) {
            console.error(`❌ Error retrieving info for ${clientId}:`, error);
        }
    });

    // Handle disconnection
    client.on('disconnected', (reason) => {
        console.log(`❌ Client ${clientId} disconnected:`, reason);
    });

    // הודעות נכנסות - העברה נקייה ל-N8N
    client.on('message', async msg => {
        await handleMessage(msg, clientId);
    });

    // הפעלת הלקוח
    await client.initialize();

    // שמירה במחסן
    clients.set(clientId, client);
    clientEmails.set(clientId, clientEmail);

    return client;
}

// טיפול בהודעות - נקי ופשוט, רק העברה ל-N8N
async function handleMessage(msg, clientId) {
    const body = msg.body || '';
    const timestamp = msg.timestamp;
    let from = msg.from || 'unknown';
    const chatName = msg._data?.notifyName || '';

    // בדיקת קבוצה וזיהוי השולח
    try {
        const chatObj = await msg.getChat();
        if (chatObj.isGroup) {
            const contact = await msg.getContact();
            from = contact.number + '@c.us';
            console.log(`🔍 Group message from: ${from}`);
        }
    } catch (e) {
        console.error(`❌ Failed to extract contact info for ${clientId}:`, e.message);
    }

    console.log(`📩 [${clientId}] Message from ${from}: ${body}`);

    // שליחה ל-N8N - רק הנתונים הבסיסיים
    try {
        const webhookData = {
            // נתוני ההודעה
            Body: msg.body,
            From: from,
            timestamp: timestamp,
            chatName: chatName,

            // זיהוי הלקוח - N8N יטפל בכל השאר
            clientId: clientId,

            // זיהוי המקור
            source: 'whatsapp-multi-client'
        };

        await axios.post(
            process.env.N8N_WEBHOOK_URL || 'https://primary-production-a35f4.up.railway.app/webhook/9507413c-dd19-4820-a6ba-f092450bc548',
            webhookData
        );

        console.log(`✅ Message forwarded to N8N for client: ${clientId}`);

    } catch (err) {
        console.error(`❌ Failed to forward message for ${clientId}:`, err.message);
    }
}

// שליחת הודעה מטעם לקוח ספציפי
async function sendMessage(clientId, to, message) {
    const client = clients.get(clientId);

    if (!client) {
        throw new Error(`Client ${clientId} not found`);
    }

    try {
        await client.sendMessage(to, message);
        console.log(`📤 [${clientId}] Sent to ${to}: ${message}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Failed to send message for ${clientId}:`, error.message);
        throw error;
    }
}

// API Routes
// ===================================

// יצירת לקוח חדש
app.post('/create-client', async (req, res) => {
    try {
        const { clientId, email } = req.body;

        if (!clientId || !email) {
            return res.status(400).json({ error: 'Missing clientId or email' });
        }

        if (clients.has(clientId)) {
            return res.status(400).json({ error: 'Client already exists' });
        }

        await createWhatsAppClient(clientId, email);

        res.json({
            success: true,
            message: `Client ${clientId} created. QR code sent to ${email}`
        });
    } catch (err) {
        console.error('❌ Error creating client:', err);
        res.status(500).json({ error: 'Failed to create client' });
    }
});

// שליחת הודעה מטעם לקוח ספציפי
app.post('/send-message/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({ error: 'Missing "to" or "message" field' });
        }

        await sendMessage(clientId, to, message);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Error sending message:', err);
        res.status(500).json({ error: err.message });
    }
});

// רשימת לקוחות פעילים
app.get('/clients', (req, res) => {
    const clientList = Array.from(clients.keys()).map(clientId => ({
        clientId,
        email: clientEmails.get(clientId),
        connected: clients.get(clientId) ? true : false
    }));

    res.json({
        clients: clientList,
        totalClients: clientList.length,
        connectedClients: clientList.filter(c => c.connected).length
    });
});

// בדיקת בריאות המערכת
app.get('/health', (req, res) => {
    const totalClients = clients.size;
    const connectedClients = Array.from(clients.values()).filter(client =>
        client && client.info
    ).length;

    res.json({
        status: 'healthy',
        totalClients,
        connectedClients,
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// הפעלת השרת - תחליף את הקטע הזה בסוף הקוד:

app.listen(PORT, async () => {
    console.log(`🚀 Clean Multi-Client WhatsApp System running on port ${PORT}`);
    console.log('');
    console.log('📋 Available endpoints:');
    console.log('  POST /create-client - Create new WhatsApp client');
    console.log('  POST /send-message/:clientId - Send message via specific client');
    console.log('  GET /clients - List all clients and their status');
    console.log('  GET /health - System health check');
    console.log('  POST /quick-add-client - Quick add client with email');
    console.log('');
    console.log('💡 How to use:');
    console.log('  1. POST to /create-client with {clientId, email}');
    console.log('  2. Client receives QR code via email');
    console.log('  3. Client scans QR with their WhatsApp');
    console.log('  4. Bot is active and forwards all messages to N8N');
    console.log('  5. N8N processes and sends responses back via /send-message/:clientId');
    console.log('');
    console.log('🔗 All messages are forwarded to N8N webhook for AI processing');

    // בדיקת לקוח חדש מ-Environment Variable
    if (process.env.NEW_CLIENT_EMAIL) {
        console.log('');
        console.log('🆕 Found NEW_CLIENT_EMAIL environment variable');

        // בדיקה שיש את פרטי האימייל
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ Missing EMAIL_USER or EMAIL_PASS environment variables!');
            console.error('💡 Please add these variables in Railway:');
            console.error('   EMAIL_USER=your-gmail@gmail.com');
            console.error('   EMAIL_PASS=your-app-password');
            return;
        }

        console.log('🔄 Creating new client automatically...');

        try {
            const email = process.env.NEW_CLIENT_EMAIL;
            const clientId = `client_${Date.now()}`;

            console.log(`📧 Email: ${email}`);
            console.log(`🆔 Client ID: ${clientId}`);

            await createWhatsAppClient(clientId, email);

            console.log('');
            console.log('✅ NEW CLIENT CREATED SUCCESSFULLY!');
            console.log(`📧 QR code sent to: ${email}`);
            console.log(`🆔 Client ID: ${clientId}`);
            console.log('');
            console.log('💡 Remember to remove NEW_CLIENT_EMAIL from environment variables');
            console.log('   after the client has scanned the QR code');

        } catch (error) {
            console.error('');
            console.error('❌ Failed to create client from NEW_CLIENT_EMAIL:');
            console.error(error.message);
            console.error('');
            console.error('🔍 Common issues:');
            console.error('   - Check EMAIL_USER and EMAIL_PASS are correct');
            console.error('   - Make sure Gmail App Password is enabled');
            console.error('   - Verify email format is valid');
        }
    }
});

// 🚀 endpoint מהיר ליצירת לקוח
app.post('/quick-add-client', async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Missing email' });
        }

        const clientId = name ?
            `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}` :
            `client_${Date.now()}`;

        await createWhatsAppClient(clientId, email);

        res.json({
            success: true,
            message: `Client created successfully! QR code sent to ${email}`,
            clientId: clientId,
            email: email
        });

    } catch (err) {
        console.error('❌ Error in quick-add-client:', err);
        res.status(500).json({ error: 'Failed to create client' });
    }
});