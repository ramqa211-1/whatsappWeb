FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app
COPY . .
RUN chown -R pptruser:pptruser /app

USER pptruser

RUN npm install

CMD ["npm", "run", "start"]
