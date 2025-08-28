# בסיס רשמי של Playwright עם Chromium וכל ה־deps
FROM mcr.microsoft.com/playwright:v1.54.2-jammy

# הגדר תיקיית עבודה
WORKDIR /app

# העתק package.json והתקן חבילות
COPY package*.json ./
RUN npm ci --only=production

# העתק את שאר הקוד
COPY . .

# Railway מזריק את PORT בזמן ריצה
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# הפעלת האפליקציה עם Playwright
CMD ["node", "simple_server.js"]
