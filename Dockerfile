FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# יצירת תיקיות עם הרשאות נכונות
USER root
RUN mkdir -p /tmp/wpp-session /app/tokens && \
    chown -R pptruser:pptruser /tmp/wpp-session /app/tokens && \
    chmod -R 755 /tmp/wpp-session /app/tokens

# העתקת package.json והתקנת תלויות
COPY package.json ./
RUN npm install

# העתקת קוד האפליקציה
COPY . .

# מתן הרשאות לכל הקבצים
RUN chown -R pptruser:pptruser /app && \
    chmod -R 755 /app

# מעבר למשתמש pptruser
USER pptruser

CMD ["npm", "run", "start"]