FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# העתק קבצי package
COPY package*.json ./

# תקן הרשאות לפני התקנה
RUN chown -R root:root /app && chmod -R 755 /app

# התקנה כ-root
RUN npm install

# העתק שאר הקבצים
COPY whatsappBot.js email-server.js ./

# הרץ כ־pptruser
USER pptruser

CMD ["npm", "run", "start"]
