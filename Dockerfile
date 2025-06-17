FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# התקנת Chrome אם הוא לא קיים (כגיבוי)
USER root
RUN apt-get update && apt-get install -y \
    google-chrome-stable || \
    chromium-browser || \
    echo "Chrome already installed"

# יצירת תיקיות עם הרשאות נכונות
RUN mkdir -p /tmp/wpp-session /tmp/tokens && \
    chown -R pptruser:pptruser /tmp/wpp-session /tmp/tokens && \
    chmod -R 755 /tmp/wpp-session /tmp/tokens

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