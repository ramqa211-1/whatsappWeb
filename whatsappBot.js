const wppconnect = require('@wppconnect-team/wppconnect');
const axios = require('axios');
const fs = require('fs');

// שימוש בתיקיות שיש לנו הרשאות עליהן
const path = require('path');

// נתיב אחד קבוע לכל המידע שצריך לשרוד בין הפעלות
const persistentDataPath = '/app/wpp-data';
// שינוי כאן: הגדרת sessionDir ו-tokensDir לנתיבים ברורים יותר
const sessionDir = path.join(persistentDataPath, 'whatsapp-sessions'); // תיקייה ייעודית ל-session
const tokensDir = path.join(persistentDataPath, 'tokens'); // אפשר להשאיר את ה-tokens בנפרד אם תרצה, או לשלב אותם

// הערה: אין צורך ב-sessionFile כמשתנה נפרד יותר, הכל יטופל אוטומטית ע"י wppconnect בתוך sessionDir

console.log('🚀 Starting WhatsApp bot setup');

try {
    // יצירת תיקיות אם הן לא קיימות
    fs.mkdirSync(sessionDir, { recursive: true }); // יצירת התיקייה החדשה
    fs.mkdirSync(tokensDir, { recursive: true });
    console.log(`📁 Session directory ensured at: ${sessionDir}`);
    console.log(`📁 Tokens directory ensured at: ${tokensDir}`);
} catch (err) {
    console.error('❌ Failed to create directories:', err);
}

// בדיקת קיום session - כעת נבדוק אם יש קבצים כלשהם בתוך תיקיית ה-session
// דרך קצת יותר כללית לבדוק אם קיים session
if (fs.existsSync(sessionDir) && fs.readdirSync(sessionDir).length > 0) {
    console.log('✅ Existing session data found in:', sessionDir);
} else {
    console.warn('⚠️ No session token found, will require QR scan');
}

// בדיקת נתיבים אפשריים לכרום
function findChromePath() {
    const possiblePaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/opt/google/chrome/chrome'
    ];

    for (const p of possiblePaths) { // שיניתי את שם המשתנה מ-path ל-p כדי למנוע התנגשות
        if (fs.existsSync(p)) {
            console.log(`✅ Found Chrome at: ${p}`);
            return p;
        }
    }

    console.log('⚠️ Chrome not found in standard locations');
    return '/usr/bin/google-chrome-stable'; // default fallback
}

const chromePath = findChromePath();
console.log('🔧 Initializing wppconnect...');

// *** כאן ממוקם ה-wppOptions המעודכן שלך עם הנתיבים החדשים ***
const wppOptions = {
    session: 'default',
    // כל המידע יישמר תחת אותו נתיב קבוע
    sessionPath: sessionDir, // מצביע לתיקייה החדשה
    browserSessionTokenDir: tokensDir, // אפשר להשאיר את זה כך או להפנות ל-sessionDir
    catchQR: (base64Qrimg, asciiQR) => {
        console.log('🔑 QR CODE GENERATED — SCAN IT:\n', asciiQR);
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
        // חשוב מאוד: Puppeteer ישמור כאן את נתוני המשתמש (כולל קבצי ה-session)
        userDataDir: sessionDir, // מצביע לתיקיית ה-session החדשה
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
    .then((client) => {
        console.log('🤖 WhatsApp client is ready and listening...');

        client.onMessage(async (message) => {
            console.log(`📥 Incoming message from ${message.from}:`, message.body);

            if (/docs\.google\.com\/spreadsheets/.test(message.body)) {
                console.log('📩 Google Sheets link detected, preparing to forward to n8n...');
                try {
                    await axios.post('https://primary-production-a35f4.up.railway.app/webhook-test/97866fe6-a0e4-487f-b21e-804701239ab0', {
                        message: message.body,
                        from: message.from,
                        chatName: message.chat?.name || '',
                        timestamp: message.timestamp,
                    });
                    console.log('✅ Message forwarded to n8n successfully');
                } catch (err) {
                    console.error('❌ Failed to send message to n8n:', err.message);
                }
            }
        });
    })
    .catch((error) => {
        console.error('❌ Failed to initialize WhatsApp client:', error);
        process.exit(1);
    });