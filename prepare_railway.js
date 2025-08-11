#!/usr/bin/env node

/**
 * Prepare Railway Deployment Package
 * מכין חבילה מלאה לפריסה ב-Railway
 */

const fs = require('fs').promises;
const path = require('path');

async function prepareRailwayPackage() {
    console.log('📦 מכין חבילה ל-Railway...');
    
    const deploymentDir = 'railway-deployment';
    
    try {
        // יצירת תיקיית deployment
        await fs.mkdir(deploymentDir, { recursive: true });
        await fs.mkdir(path.join(deploymentDir, 'public'), { recursive: true });
        
        console.log('✅ תיקיות נוצרו');
        
        // רשימת קבצים להעתקה
        const filesToCopy = [
            'server.js',
            'package.json',
            'railway.json',
            'Dockerfile',
            'env.example',
            'RAILWAY_DEPLOYMENT.md'
        ];
        
        // העתקת קבצים ראשיים
        for (const file of filesToCopy) {
            try {
                const content = await fs.readFile(file, 'utf8');
                await fs.writeFile(path.join(deploymentDir, file), content);
                console.log(`✅ הועתק: ${file}`);
            } catch (error) {
                console.log(`⚠️  לא נמצא: ${file}`);
            }
        }
        
        // העתקת קבצי public
        try {
            const indexHtml = await fs.readFile('public/index.html', 'utf8');
            await fs.writeFile(path.join(deploymentDir, 'public', 'index.html'), indexHtml);
            console.log('✅ הועתק: public/index.html');
        } catch (error) {
            console.log('⚠️  לא נמצא: public/index.html');
        }
        
        // יצירת README מיוחד לפריסה
        const readmeContent = `# LinkedIn Python Scraper - Railway Deployment

## 🚀 Quick Deploy to Railway:

1. **Create GitHub Repository:**
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   \`\`\`

2. **Deploy to Railway:**
   - Go to https://railway.app/
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose this repository
   - Wait for deployment (~5 minutes)

3. **Access Your App:**
   - Railway will provide a URL like: \`https://your-app-name.up.railway.app\`
   - Share this URL with your clients!

## 🎯 Features:
- ✅ Beautiful web interface
- ✅ Real-time scraping progress
- ✅ CSV download
- ✅ Mobile responsive
- ✅ Secure (no data stored)

## 💡 Client Usage:
1. Visit the URL
2. Enter LinkedIn credentials
3. Select search parameters
4. Click "Start Scraping"
5. Download results as CSV

## 📞 Support:
For any issues, check the Railway deployment logs or contact support.
`;
        
        await fs.writeFile(path.join(deploymentDir, 'README.md'), readmeContent);
        console.log('✅ נוצר: README.md');
        
        // יצירת .gitignore
        const gitignoreContent = `node_modules/
.env
*.log
.DS_Store
screenshots/
linkedin_results/
*.csv
*.json
!package.json
!railway.json`;
        
        await fs.writeFile(path.join(deploymentDir, '.gitignore'), gitignoreContent);
        console.log('✅ נוצר: .gitignore');
        
        // יצירת package.json מעודכן
        const packageJson = {
            "name": "linkedin-python-scraper-api",
            "version": "1.0.0",
            "description": "LinkedIn Python Developers Scraper API for Railway",
            "main": "server.js",
            "scripts": {
                "start": "node server.js",
                "dev": "node server.js"
            },
            "keywords": ["linkedin", "scraper", "python", "developers", "api", "railway"],
            "author": "Ram Walas Tal",
            "license": "MIT",
            "dependencies": {
                "express": "^4.18.2",
                "playwright": "^1.40.0",
                "cors": "^2.8.5",
                "helmet": "^7.1.0",
                "dotenv": "^16.3.1"
            },
            "engines": {
                "node": ">=18.0.0"
            }
        };
        
        await fs.writeFile(
            path.join(deploymentDir, 'package.json'), 
            JSON.stringify(packageJson, null, 2)
        );
        console.log('✅ עודכן: package.json');
        
        console.log('\\n🎉 חבילה מוכנה לפריסה!');
        console.log('📁 מיקום:', path.resolve(deploymentDir));
        console.log('\\n📋 שלבים הבאים:');
        console.log('1. cd', deploymentDir);
        console.log('2. git init && git add . && git commit -m "Initial commit"');
        console.log('3. git remote add origin YOUR_GITHUB_REPO_URL');
        console.log('4. git push -u origin main');
        console.log('5. Deploy to Railway from GitHub');
        console.log('\\n🌐 אחרי הפריסה תקבל URL כמו:');
        console.log('   https://your-app-name.up.railway.app');
        
    } catch (error) {
        console.error('💥 שגיאה:', error.message);
    }
}

prepareRailwayPackage();

