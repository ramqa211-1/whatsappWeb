# בסיס רשמי של Node.js
FROM node:18-bullseye-slim

# התקן curl לבריאות השירות
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

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

# הפעלת האפליקציה הפשוטה
CMD ["node", "simple_server.js"]
