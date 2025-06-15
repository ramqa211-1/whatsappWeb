const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

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
            const fallbackFilePath = path.resolve(__dirname, 'Solving_Locator_Instability.docx');
            attachments.push({
                path: fallbackFilePath,
                filename: 'Solving_Locator_Instability.docx'
            });
            console.warn("⚠️ No file received. Using fallback:", fallbackFilePath);
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to || 'ramvt2@gmail.com',
            subject: subject || 'No Subject Provided',
            text: text || 'No message provided.',
            attachments
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent!");
        res.status(200).send('Email sent ✅');
    } catch (err) {
        console.error('❌ Error sending email:', err);
        res.status(500).send('Failed to send email');
    }
});

// ✅ DON'T FORGET THIS:
app.listen(port, () => {
    console.log(`📨 Email server running on http://localhost:${port}`);
});
