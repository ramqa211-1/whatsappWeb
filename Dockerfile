FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# התקנת תלויות כ-root
COPY package*.json ./
RUN npm install

# העתקת שאר הקבצים
COPY whatsappBot.js email-server.js ./

# רק כאן מחליפים יוזר
USER pptruser

CMD ["npm", "run", "start"]
