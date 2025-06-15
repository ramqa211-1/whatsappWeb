const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const path = require('path');

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()')
    .then(res => console.log('📦 DB Connected at:', res.rows[0].now))
    .catch(err => console.error('❌ DB Connection Failed:', err));

const app = express();
const port = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.use((req, res, next) => {
    res.setHeader("ngrok-skip-browser-warning", "true");
    next();
});

app.post('/send-email', upload.single('file'), async (req, res) => {
    try {
        console.log('📩 New email request received');
        const { to, subject, text } = req.body;
        const file = req.file;

        console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
        if (file) console.log('📎 File received:', file.originalname);
        else console.log('📎 No file received');

        // 🚫 Block if text is missing
        if (!text || text.trim() === '') {
            console.warn('⛔ Email blocked: text field is empty');
            return res.status(400).send("Email body (text) is required and cannot be empty.");
        }

        const attachments = [];
        if (file && file.path) {
            attachments.push({
                path: file.path,
                filename: file.originalname || 'uploaded_file'
            });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to || 'ramvt2@gmail.com',
            subject: subject || 'No Subject Provided',
            text: text,
            ...(attachments.length > 0 ? { attachments } : {})
        };

        console.log(`📤 Sending email to: ${mailOptions.to}`);
        console.log(`📝 Subject: ${mailOptions.subject}`);
        console.log(`🧾 Body: ${mailOptions.text}`);
        if (attachments.length > 0) {
            console.log(`📎 Attachments: ${attachments.map(a => a.filename).join(', ')}`);
        }

        await transporter.sendMail(mailOptions);
        console.log("✅ Email successfully sent!");

        res.status(200).send('Email sent ✅');

        await pool.query(
            'INSERT INTO email_logs (recipient, subject, success, sent_at) VALUES ($1, $2, $3, NOW())',
            [mailOptions.to, mailOptions.subject, true]
        );
        console.log("🗃️ Email log saved to DB");

    } catch (err) {
        console.error('❌ Error sending email:', err);

        res.status(500).send('Failed to send email');

        try {
            await pool.query(
                'INSERT INTO email_logs (recipient, subject, success, sent_at) VALUES ($1, $2, $3, NOW())',
                [req.body?.to || 'unknown', req.body?.subject || '', false]
            );
            console.log("🗃️ Error log saved to DB");
        } catch (dbErr) {
            console.error("❌ Failed to log error to DB:", dbErr);
        }
    }
});

app.get('/logs', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100'
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('❌ Failed to fetch email logs:', err);
        res.status(500).send('Failed to fetch email logs');
    }
});

app.listen(port, () => {
    console.log(`📨 Email server running on http://localhost:${port}`);
});
