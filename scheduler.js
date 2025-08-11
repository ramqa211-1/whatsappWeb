#!/usr/bin/env node

/**
 * Daily Scheduler for Python Developers Scraper
 * מתזמן הפעלה יומית של סקריפט חילוץ מפתחי Python
 */

const cron = require('node-cron');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class DailyScheduler {
    constructor() {
        this.logFile = 'scheduler.log';
        this.isRunning = false;
    }

    async log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        
        console.log(message);
        
        try {
            await fs.appendFile(this.logFile, logMessage);
        } catch (error) {
            console.error('שגיאה בכתיבת לוג:', error.message);
        }
    }

    async runScraper() {
        if (this.isRunning) {
            await this.log('⚠️ הסקריפט כבר רץ, מדלג על הפעלה זו');
            return;
        }

        this.isRunning = true;
        await this.log('🚀 מתחיל הפעלה יומית של סקריפט חילוץ מפתחי Python');

        return new Promise((resolve) => {
            const child = spawn('node', ['daily_python_scraper.js'], {
                stdio: 'pipe',
                cwd: __dirname
            });

            let output = '';
            let errorOutput = '';

            child.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                console.log(text.trim());
            });

            child.stderr.on('data', (data) => {
                const text = data.toString();
                errorOutput += text;
                console.error(text.trim());
            });

            child.on('close', async (code) => {
                this.isRunning = false;
                
                if (code === 0) {
                    await this.log('✅ הסקריפט הסתיים בהצלחה!');
                } else {
                    await this.log(`❌ הסקריפט נכשל עם קוד: ${code}`);
                    if (errorOutput) {
                        await this.log(`שגיאות: ${errorOutput}`);
                    }
                }
                
                resolve(code);
            });

            child.on('error', async (error) => {
                this.isRunning = false;
                await this.log(`💥 שגיאה בהפעלת הסקריפט: ${error.message}`);
                resolve(1);
            });
        });
    }

    async start() {
        await this.log('📅 מתזמן יומי התחיל - ירוץ כל יום בשעה 09:00');
        
        // הפעלה יומית בשעה 09:00
        cron.schedule('0 9 * * *', async () => {
            await this.runScraper();
        }, {
            scheduled: true,
            timezone: "Asia/Jerusalem" // אזור זמן ישראל
        });

        // הפעלה מיידית לבדיקה (אופציונלי)
        if (process.argv.includes('--run-now')) {
            await this.log('🔄 הפעלה מיידית לבדיקה...');
            await this.runScraper();
        }

        await this.log('⏰ המתזמן פעיל - הסקריפט ירוץ כל יום בשעה 09:00');
        await this.log('💡 לביטול: Ctrl+C');
    }

    async stop() {
        await this.log('🛑 עוצר את המתזמן...');
        process.exit(0);
    }
}

// טיפול בסגירה נקייה
process.on('SIGINT', async () => {
    console.log('\n🛑 מקבל אות עצירה...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 מקבל אות סיום...');
    process.exit(0);
});

// הפעלת המתזמן
async function main() {
    console.log('📅 LinkedIn Python Developers Daily Scheduler');
    console.log('='.repeat(50));
    
    const scheduler = new DailyScheduler();
    await scheduler.start();
    
    // שמירה על התהליך פעיל
    setInterval(() => {
        // בדיקה כל דקה שהמתזמן עדיין פעיל
    }, 60000);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = DailyScheduler;


