# 📋 מדריך התקנה - LinkedIn Python Scraper

## 🎯 מה צריך להתקין במחשב:

### **1. Node.js (חובה)**
- **הורד מ:** https://nodejs.org/
- **גרסה:** 16.0 ומעלה
- **גודל:** ~50MB
- **זמן התקנה:** 2-3 דקות

### **2. התלויות של הפרויקט:**
```bash
npm install playwright node-cron
```
- **גודל:** ~200MB (כולל דפדפני Playwright)
- **זמן התקנה:** 3-5 דקות

### **3. דפדפני Playwright (אוטומטי):**
```bash
npx playwright install chromium
```
- **גודל:** ~150MB
- **זמן התקנה:** 2-3 דקות

---

## 🚀 התקנה מהירה (5 דקות):

### **שלב 1: התקנת Node.js**
1. לך ל-https://nodejs.org/
2. הורד את הגרסה הכחולה (LTS)
3. הרץ את הקובץ והתקן

### **שלב 2: הכנת הפרויקט**
```bash
# פתח Command Prompt או PowerShell
cd C:\path\to\your\folder
npm install playwright node-cron
npx playwright install chromium
```

### **שלב 3: הרצה**
```bash
node screenshot_scraper.js
```

---

## 💡 אלטרנטיבה - חבילה מוכנה:

אם אתה רוצה לתת למישהו את הסקריפט בלי שיצטרך להתקין דברים, אתה יכול:

### **אפשרות 1: Portable Version**
- ליצור קובץ .exe עם pkg
- לכלול את כל התלויות
- גודל: ~300MB

### **אפשרות 2: Docker Container**
- הכל ארוז בקונטיינר
- רק צריך Docker Desktop
- הרצה: `docker run linkedin-scraper`

### **אפשרות 3: Cloud Service**
- הרצה בענן (AWS/Google Cloud)
- גישה דרך דפדפן
- לא צריך התקנה כלל

---

## 📦 **סיכום מה צריך:**

✅ **חובה:**
- Node.js (50MB)
- npm install (200MB)
- חיבור אינטרנט

❌ **לא צריך:**
- Python
- Chrome/Firefox נפרד (Playwright כולל דפדפן)
- מסד נתונים
- שרת

**סך הכל: ~250MB + 10 דקות התקנה**

