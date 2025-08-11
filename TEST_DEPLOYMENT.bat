@echo off
chcp 65001 >nul
echo 🚂 בדיקת Railway Deployment
echo ================================
echo.

echo 🔍 בודק את האפליקציה שלך ב-Railway...
echo.

node verify_deployment.js

echo.
echo 📋 אם הכל עובד, האפליקציה שלך זמינה ב:
echo 🌐 https://whatsappweb-production-8676.up.railway.app
echo.
echo 💡 אם יש בעיות, בדוק את הלוגים ב-Railway Dashboard
echo.

pause
