FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# רק קבצים נחוצים להתקנה
COPY package*.json ./

# ודא שההרשאות מספיקות – בלי chown
RUN chmod -R 755 /app && npm install

# עכשיו העתק רק את הקוד שאתה צריך
COPY whatsappBot.js email-server.js ./

# עובר ל־pptruser – שהוא המוגדר בתמונה
USER pptruser

CMD ["npm", "run", "start"]
