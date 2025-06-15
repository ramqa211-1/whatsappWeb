const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.query('SELECT NOW()')
    .then(res => {
        console.log('📦 DB Connected at:', res.rows[0].now);
    })
    .catch(err => {
        console.error('❌ DB Connection Failed:', err);
    });

const app = express();
const port = process.env.PORT || 3001;

// 👇 הוספת שני הפארסרים החשובים:
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
        const { to, subject, text } = req.body;
        const file = req.file;

        console.log("📥 Body:", req.body);
        console.log("📎 File:", file);

        const attachments = [];

        if (file && file.path) {
            attachments.push({
                path: file.path,
                filename: file.originalname || 'uploaded_file'
            });
        } else {
            console.warn("⚠️ No file received. Sending email without attachment.");
        }


        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to || 'ramvt2@gmail.com',
            subject: subject || 'No Subject Provided',
            text: text || 'No message provided.',
            ...(attachments.length > 0 ? { attachments } : {}) // ✅ כך עושים את זה נכון
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent!");
        res.status(200).send('Email sent ✅');

        await pool.query(
            'INSERT INTO email_logs (recipient, subject, success, sent_at) VALUES ($1, $2, $3, NOW())',
            [to, subject, true]
        );

    } catch (err) {
        console.error('❌ Error sending email:', err);
        res.status(500).send('Failed to send email');

        await pool.query(
            'INSERT INTO email_logs (recipient, subject, success, sent_at) VALUES ($1, $2, $3, NOW())',
            [req.body?.to || 'unknown', req.body?.subject || '', false]
        );
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

// ✅ DON'T FORGET THIS:
app.listen(port, () => {
    console.log(`📨 Email server running on http://localhost:${port}`);
});
