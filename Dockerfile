FROM node:18-bullseye-slim

# התקנת תלויות מערכת נדרשות
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    && rm -rf /var/lib/apt/lists/*

# התקנת Google Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    && rm -rf /var/lib/apt/lists/*

# הוספת משתמש לא-root
RUN groupadd -r appuser && useradd -r -g appuser -G audio,video appuser \
    && mkdir -p /home/appuser/Downloads \
    && chown -R appuser:appuser /home/appuser

WORKDIR /app

# יצירת תיקיית המידע הקבוע עם הרשאות נכונות
# שימו לב לשינוי ההרשאות ל-777 (לצורך בדיקה ראשונית, ניתן לצמצם בהמשך)
RUN mkdir -p /app/wpp-data && \
    chown -R appuser:appuser /app/wpp-data && \
    chmod -R 777 /app/wpp-data

# העתקת package.json והתקנת תלויות
COPY package.json ./
RUN npm install && npm cache clean --force

# העתקת קוד האפליקציה
COPY . .

# מתן הרשאות לכל הקבצים (ודא שגם ל-/app יש הרשאות עבור appuser)
RUN chown -R appuser:appuser /app && \
    chmod -R 755 /app

# מעבר למשתמש appuser
# USER appuser   <-- מבטל את זה זמנית, שירוץ כ-root

CMD ["npm", "run", "start"]