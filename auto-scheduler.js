// auto-scheduler.js
const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;
const SERVICE_ID = process.env.SERVICE_ID;
const GRAPHQL_URL = 'https://backboard.railway.app/graphql/v2';

async function scaleService(quantity) {
    try {
        await axios.post(GRAPHQL_URL, {
            query: `mutation serviceScale($input: ServiceScaleInput!) {
                serviceScale(input: $input) {
                    service { id }
                }
            }`,
            variables: { input: { serviceId: SERVICE_ID, quantity } }
        }, {
            headers: {
                Authorization: RAILWAY_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ Scaled to ${quantity} at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
        console.error('❌ Failed to scale:', err.response?.data || err.message);
    }
}

// 🌙 כל יום ב־22:00
cron.schedule('0 22 * * *', () => {
    console.log('🌙 Scale down at 22:00');
    scaleService(0);
});

// ☀️ כל יום ב־07:00
cron.schedule('0 7 * * *', () => {
    console.log('☀️ Scale up at 07:00');
    scaleService(1);
});

console.log('⏰ Cron running...');
setInterval(() => {}, 1 << 30); // מונע סיום הקובץ
