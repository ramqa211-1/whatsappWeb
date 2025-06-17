FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app
COPY . .

RUN npm install

CMD ["npm", "run", "start"]
