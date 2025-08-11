# 🚂 Railway Deployment Troubleshooting Guide

## הבעיה הנוכחית
האפליקציה מוצבת בהצלחה ב-Railway, אבל הלינק מראה מסך לא פעיל.

## 🔍 בדיקת הבעיה

### 1. בדיקת לוגים ב-Railway
1. היכנס ל-Railway Dashboard
2. בחר את הפרויקט שלך
3. לחץ על "Deployments" 
4. בחר את ה-Deployment האחרון
5. לחץ על "View Logs"

### 2. בדיקת Environment Variables
וודא שיש לך את המשתנים הבאים ב-Railway:
```
NODE_ENV=production
PORT=3000
RAILWAY_ENVIRONMENT=production
```

### 3. בדיקת Build Process
וודא שה-Build עבר בהצלחה:
- `npm install --legacy-peer-deps` ✅
- `npx playwright install chromium --with-deps` ✅

## 🛠️ פתרונות אפשריים

### פתרון 1: בדיקת Endpoints
הרץ את הסקריפט `verify_deployment.js` כדי לבדוק איזה endpoints עובדים:

```bash
node verify_deployment.js
```

### פתרון 2: בדיקת Health Check
נסה לגשת ל:
- `https://your-app.up.railway.app/health`
- `https://your-app.up.railway.app/test`

### פתרון 3: Rebuild ו-Redeploy
1. ב-Railway Dashboard, לחץ על "Deploy"
2. וודא שה-Build עובר בהצלחה
3. חכה שה-Deployment יסתיים

### פתרון 4: בדיקת Port Configuration
וודא שה-Application מאזין על Port הנכון:
```javascript
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
```

## 📱 איך להשתמש באפליקציה

### דרך Web Interface
1. גש ל: `https://your-app.up.railway.app`
2. הזן את פרטי ה-LinkedIn שלך
3. בחר מילות חיפוש
4. לחץ על "התחל חילוץ"

### דרך API
```bash
# התחלת חילוץ
curl -X POST https://your-app.up.railway.app/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword","searchQuery":"Python Developer"}'

# בדיקת סטטוס
curl https://your-app.up.railway.app/api/results/JOB_ID

# הורדת תוצאות
curl https://your-app.up.railway.app/api/download/JOB_ID
```

## 🔧 בדיקות מקומיות

### הרצה מקומית
```bash
npm install
npm start
```

### בדיקת Endpoints מקומיים
```bash
curl http://localhost:3000/health
curl http://localhost:3000/test
```

## 📞 תמיכה
אם הבעיה נמשכת:
1. בדוק את הלוגים ב-Railway
2. וודא שה-Build עובר בהצלחה
3. בדוק שה-Environment Variables מוגדרים נכון
4. נסה Rebuild ו-Redeploy

## 🎯 מה האפליקציה עושה
זו **אפליקציית Web** שמאפשרת:
- חילוץ מפתחי Python מ-LinkedIn
- ממשק משתמש בעברית
- API לשימוש אוטומטי
- הורדת תוצאות ב-CSV
- הרצה דרך דפדפן ללא התקנות
