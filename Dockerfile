FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

USER root

# התקנת Chromium ווידוא שהוא זמין
RUN apt-get update && apt-get install -y chromium chromium-browser && \
    ln -sf /usr/bin/chromium /usr/bin/google-chrome-stable && \
    ln -sf /usr/bin/chromium /usr/bin/google-chrome

# יצירת תיקיות עם הרשאות נכונות
RUN mkdir -p /tmp/wpp-session /tmp/tokens && \
    chown -R pptruser:pptruser /tmp/wpp-session /tmp/tokens && \
    chmod -R 755 /tmp/wpp-session /tmp/tokens

# העתקת package.json והתקנת תלויות
COPY package.json ./
RUN npm install

# התקנת Puppeteer browsers
RUN npx puppeteer browsers install chromium

# העתקת קוד האפליקציה
COPY . .

# מתן הרשאות לכל הקבצים
RUN chown -R pptruser:pptruser /app && \
    chmod -R 755 /app

# הגדרת משתני סביבה עבור Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# מעבר למשתמש pptruser
USER pptruser

CMD ["npm", "run", "start"]