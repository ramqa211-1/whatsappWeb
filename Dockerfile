FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# העתק רק את הקוד הדרוש
COPY package*.json ./
RUN npm install

COPY whatsappBot.js email-server.js ./

USER pptruser

CMD ["npm", "run", "start"]
