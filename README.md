# 📬 WhatsApp Email Relay Server (Express + Railway)

Node.js microservice שמאזין לבקשות `POST` (למשל מ־n8n) ושולח מיילים עם או בלי קבצים מצורפים דרך Gmail.
מוכן לפריסה על Railway.

---

## 🚀 איך משתמשים

### 1. 🧰 התקנת תלויות מקומית
```bash
npm install
```

### 2. 🛠 צור קובץ `.env` (לא יועלה ל־git)
```env
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 3. 🧪 הפעלה מקומית
```bash
npm start
```
השרת יאזין על `http://localhost:3001/send-email`


## 📡 שליחת מייל
### 🔗 POST /send-email
- `to` (אימייל)
- `subject` (כותרת)
- `text` (תוכן)
- `file` (קובץ מצורף, אופציונלי)

### דוגמה ב־cURL:
```bash
curl -X POST http://localhost:3001/send-email \
  -F "to=ram@example.com" \
  -F "subject=Test" \
  -F "text=Hello from server" \
  -F "file=@./report.pdf"
```


## ☁️ פריסה ב־Railway
1. קשר את הריפו ל־Railway
2. הגדר את משתני הסביבה (`EMAIL_USER`, `EMAIL_PASS`)
3. ודא שהפורט בקובץ הוא:
```js
const port = process.env.PORT || 3001;
```
4. Railway יפעיל אוטומטית עם הפקודה `npm start`


## 🔒 הערות אבטחה
- Gmail דורש סיסמת אפליקציה (App Password) אם אתה משתמש ב־2FA
- הקפד לא להעלות `.env` ל־GitHub (כבר מוגן ע"י `.gitignore`)


## 📂 מבנה הפרויקט
```
📁 whatsappWeb/
├── email-server.js      # שרת Node.js
├── .env                 # (לוקלי בלבד)
├── package.json         # תלויות ופקודות
└── .gitignore           # כולל את .env
```

---

בהצלחה 💌
