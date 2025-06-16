# Use lightweight Node.js base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Install missing dependencies for open-wa without full Chrome
RUN apt-get update && apt-get install -y \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcomposite1 \
  libxdamage1 libxrandr2 libgbm1 libasound2 libxshmfence1 \
  wget curl unzip && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy rest of the code
COPY . .

# Expose port for express (adjust if needed)
EXPOSE 3001

# Default command
CMD ["node", "whatsappBot.js"]
