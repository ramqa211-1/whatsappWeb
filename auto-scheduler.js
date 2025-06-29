const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;
const SERVICE_ID = process.env.SERVICE_ID;
const GRAPHQL_URL = 'https://backboard.railway.app/graphql/v2';

async function scaleService(quantity) {
    try {
        const response = await axios.post(
            GRAPHQL_URL,
            {
                query: `
          mutation serviceScale($input: ServiceScaleInput!) {
            serviceScale(input: $input) {
              service { id }
            }
          }
        `,
                variables: {
                    input: { serviceId: SERVICE_ID, quantity }
                }
            },
            {
                headers: {
                    Authorization: RAILWAY_TOKEN,
                    'Content-Type': 'application/json',
                }
            }
        );
        console.log(`✅ Service scaled to ${quantity} at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
        console.error('❌ Scaling failed:', error.response?.data || error.message);
    }
}

// הרדמה כל לילה ב-22:00
cron.schedule('0 22 * * *', () => {
    console.log('🌙 Scale to 0 — 22:00');
    scaleService(0);
});

// הפעלה ב-07:00
cron.schedule('0 7 * * *', () => {
    console.log('☀️ Scale to 1 — 07:00');
    scaleService(1);
});
