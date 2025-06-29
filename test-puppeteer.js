const puppeteer = require('puppeteer-core');

(async () => {
    await puppeteer.launch({
        executablePath: 'C:/Users/RamWalastal/.cache/puppeteer/chrome/win64-138.0.7204.49/chrome-win64/chrome.exe',
        headless: false,
        userDataDir: 'C:/Users/RamWalastal/wpp-data/test-profile',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('🔥 chrome ok - launched');
})();
