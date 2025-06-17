FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# רק קבצים נחוצים להתקנת תלויות
COPY package.json ./
RUN npm install

# קוד אפליקציה
COPY . .

# הפעלה עם המשתמש של Puppeteer (הכל עובד איתו חלק)
USER pptruser

CMD ["npm", "run", "start"]
