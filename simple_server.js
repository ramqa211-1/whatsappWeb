const express = require('express');
const path = require('path');
let chromium;

// Try to load Playwright, but don't fail if it's not available
try {
    chromium = require('playwright').chromium;
    console.log('✅ Playwright loaded successfully');
} catch (error) {
    console.warn('⚠️ Playwright not available:', error.message);
    console.log('🔧 Server will start but scraping functionality will be limited');
}

const app = express();
const PORT = 3000; // Fixed port for both local and Railway

// Basic middleware
app.use(express.json());
app.use(express.static('public'));

// Store for scraping results
let scrapingResults = new Map();

// פונקציה חדשה לטיפול בדף אימות אבטחה
async function handleSecurityCheckpoint(page, retryCount = 0) {
    console.log('🔒 מתחיל טיפול בדף אימות אבטחה...');
    
    try {
        // צילום מסך של דף האבטחה
        const screenshotPath = `linkedin_security_checkpoint_${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 צילום מסך נשמר: ${screenshotPath}`);
        
        // בדיקה מה סוג האימות
        const pageText = await page.textContent('body');
        const currentUrl = page.url();
        const currentTitle = await page.title();
        
        console.log(`📍 דף אבטחה: ${currentTitle}`);
        console.log(`🔗 URL אבטחה: ${currentUrl}`);
        
        // בדיקה אם החשבון נחסם או מוגבל
        if (pageText.toLowerCase().includes('account restricted') || 
            pageText.toLowerCase().includes('account suspended') ||
            pageText.toLowerCase().includes('temporarily restricted') ||
            pageText.toLowerCase().includes('unusual activity') ||
            pageText.toLowerCase().includes('policy violation') ||
            pageText.toLowerCase().includes('blocked') ||
            pageText.toLowerCase().includes('banned')) {
            console.log('🚫 החשבון נחסם או מוגבל!');
            throw new Error('החשבון נחסם או מוגבל על ידי LinkedIn - יש ליצור קשר עם תמיכת LinkedIn');
        }
        
        // ניסיון לזהות אלמנטים שניתן ללחוץ עליהם
        try {
            const clickableElements = await page.$$('button, a, input[type="submit"], .btn, [role="button"]');
            console.log(`🔍 נמצאו ${clickableElements.length} אלמנטים שניתן ללחוץ עליהם`);
            
            // בדיקה אם יש כפתור "Skip" או "Continue" או "Verify Later"
            const skipButtons = await page.$$('button:has-text("Skip"), button:has-text("Continue"), button:has-text("Verify Later"), button:has-text("Not Now")');
            if (skipButtons.length > 0) {
                console.log('🎯 נמצא כפתור Skip/Continue - מנסה ללחוץ עליו...');
                await skipButtons[0].click();
                await page.waitForTimeout(5000);
                
                // בדיקה אם עברתי את האימות
                const newUrl = page.url();
                const newTitle = await page.title();
                
                if (!newUrl.includes('/checkpoint/') && 
                    !newTitle.toLowerCase().includes('security verification') &&
                    !newTitle.toLowerCase().includes('verification') &&
                    !newTitle.toLowerCase().includes('checkpoint')) {
                    console.log('✅ הצלחתי לעבור את האימות!');
                    return true;
                }
            }
            
            // בדיקה אם יש שדות טקסט שניתן למלא
            const textInputs = await page.$$('input[type="text"], input[type="email"], input[type="tel"], textarea');
            if (textInputs.length > 0) {
                console.log(`🔍 נמצאו ${textInputs.length} שדות טקסט - מנסה לזהות מה צריך למלא...`);
                
                // בדיקה אם יש שדה "Full Name" או "Name"
                const nameInputs = await page.$$('input[placeholder*="Name"], input[placeholder*="Full"], input[aria-label*="Name"], input[name*="name"]');
                if (nameInputs.length > 0) {
                    console.log('📝 נמצא שדה שם - ממלא פרטים...');
                    try {
                        await nameInputs[0].fill('John Doe');
                        console.log('✅ שם הוזן');
                        
                        // חיפוש כפתור Submit
                        const submitButtons = await page.$$('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Continue")');
                        if (submitButtons.length > 0) {
                            console.log('🚀 לוחץ על כפתור Submit...');
                            await submitButtons[0].click();
                            await page.waitForTimeout(5000);
                            
                            // בדיקה אם עברתי את האימות
                            const newUrl = page.url();
                            const newTitle = await page.title();
                            
                            if (!newUrl.includes('/checkpoint/') && 
                                !newTitle.toLowerCase().includes('security verification') &&
                                !newTitle.toLowerCase().includes('verification') &&
                                !newTitle.toLowerCase().includes('checkpoint')) {
                                console.log('✅ הצלחתי לעבור את האימות!');
                                return true;
                            }
                        }
                    } catch (fillError) {
                        console.log('⚠️ לא הצלחתי למלא את השדה:', fillError.message);
                    }
                }
            }
        } catch (elementError) {
            console.log('⚠️ לא הצלחתי לזהות אלמנטים שניתן ללחוץ עליהם:', elementError.message);
        }
        
        // זיהוי סוג האימות
        if (pageText.toLowerCase().includes('phone') || pageText.toLowerCase().includes('sms') || pageText.toLowerCase().includes('verification code')) {
            console.log('📱 LinkedIn דורש אימות טלפון/SMS');
            throw new Error('LinkedIn דורש אימות טלפון/SMS - יש להיכנס לחשבון ידנית ולעבור את האימות');
        } else if (pageText.toLowerCase().includes('email') || pageText.toLowerCase().includes('inbox')) {
            console.log('📧 LinkedIn דורש אימות אימייל');
            throw new Error('LinkedIn דורש אימות אימייל - יש להיכנס לחשבון ידנית ולעבור את האימות');
        } else if (pageText.toLowerCase().includes('captcha') || pageText.toLowerCase().includes('robot')) {
            console.log('🤖 LinkedIn דורש אימות CAPTCHA');
            throw new Error('LinkedIn דורש אימות CAPTCHA - יש להיכנס לחשבון ידנית ולעבור את האימות');
        } else if (pageText.toLowerCase().includes('identity') || pageText.toLowerCase().includes('document')) {
            console.log('🆔 LinkedIn דורש אימות זהות');
            throw new Error('LinkedIn דורש אימות זהות - יש להיכנס לחשבון ידנית ולעבור את האימות');
        } else {
            console.log('❓ LinkedIn דורש אימות לא ידוע');
            throw new Error('LinkedIn דורש אימות לא ידוע - יש להיכנס לחשבון ידנית ולעבור את האימות');
        }
        
        // אם הגענו לכאן, לא הצלחנו לעבור את האימות
        return false;
        
    } catch (error) {
        console.log(`⚠️ שגיאה בטיפול בדף אבטחה: ${error.message}`);
        throw error;
    }
}

// LinkedIn scraper function - NEW APPROACH!
async function scrapeLinkedInReal(email, password, searchQuery = 'Python Developer', maxResults = 20, retryCount = 0) {
    if (!chromium) {
        throw new Error('Playwright is not available. Cannot perform scraping.');
    }

    const browser = await chromium.launch({
        headless: true, // בדוקר חייב להיות true
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayComitor',
            '--disable-blink-features=AutomationControlled',
            '--disable-xvfb',
            '--disable-software-rasterizer',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--disable-javascript',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection'
        ]
    });

    const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // הגדרת viewport אמיתי
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // הסתרת Playwright
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    });

    try {
        console.log(`🔐 ניסיון ${retryCount + 1}: מתחיל תהליך התחברות ל-LinkedIn...`);
        console.log(`📧 אימייל: ${email}`);
        console.log(`🔑 סיסמה: ${password ? '***' + password.slice(-3) : 'לא הוזנה'}`);
        
        // הגדרת timeout
        page.setDefaultTimeout(120000); // 2 דקות
        page.setDefaultNavigationTimeout(120000);
        console.log('⏱️ Timeout הוגדר ל-2 דקות');
        
        // התחברות ל-LinkedIn
        console.log('🌐 מגיע לעמוד לוגין של LinkedIn...');
        await page.goto('https://www.linkedin.com/login', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });
        console.log('✅ הגעתי לעמוד לוגין של LinkedIn');
        
        // המתנה קצרה לטעינת הדף
        await page.waitForTimeout(3000);
        
        console.log('📝 ממלא פרטי התחברות...');
        await page.fill('#username', email);
        console.log('✅ אימייל הוזן');
        await page.fill('#password', password);
        console.log('✅ סיסמה הוזנה');
        
        console.log('🚀 לוחץ על כפתור התחברות...');
        await page.click('button[type="submit"]');
        console.log('✅ כפתור התחברות נלחץ');
        
        // המתנה קצרה לטעינת הדף אחרי לוגין
        console.log('⏳ ממתין 5 שניות לטעינת הדף אחרי לוגין...');
        await page.waitForTimeout(5000);
        
        // בדיקה מוקדמת אם LinkedIn דורש אימות אבטחה
        console.log('🔒 בודק אם LinkedIn דורש אימות אבטחה...');
        try {
            const earlyUrl = page.url();
            const earlyTitle = await page.title();
            
            if (earlyUrl.includes('/checkpoint/') || 
                earlyTitle.toLowerCase().includes('security verification') ||
                earlyTitle.toLowerCase().includes('verification') ||
                earlyTitle.toLowerCase().includes('checkpoint')) {
                
                console.log('🚨 LinkedIn דורש אימות אבטחה מוקדם!');
                const canProceed = await handleSecurityCheckpoint(page);
                if (!canProceed) {
                    throw new Error('LinkedIn דורש אימות אבטחה - יש להיכנס לחשבון ידנית ולעבור את האימות');
                }
            }
        } catch (earlyCheckError) {
            console.log('⚠️ שגיאה בבדיקה מוקדמת:', earlyCheckError.message);
            throw earlyCheckError;
        }
        
        // הגישה החדשה - מחכים שהדף יטען בעצמו
        console.log('⏳ מחכה שהדף יטען אחרי לוגין...');
        console.log('🔄 LinkedIn יטען את הדף הראשי בעצמו...');
        
        // המתנה עד שהדף יטען נכון - שיפור משמעותי!
        let attempts = 0;
        const maxAttempts = 15; // הורדנו ל-15 ניסיונות של 3 שניות = 45 שניות
        let securityCheckpointDetected = false;
        
        while (attempts < maxAttempts && !securityCheckpointDetected) {
            attempts++;
            console.log(`🔍 ניסיון ${attempts}/${maxAttempts}: בודק מצב הדף...`);
            
            try {
                const currentUrl = page.url();
                const currentTitle = await page.title();
                
                console.log(`📍 URL נוכחי: ${currentUrl}`);
                console.log(`📄 כותרת נוכחית: ${currentTitle}`);
                
                // בדיקה מהירה אם LinkedIn דורש אימות אבטחה - בדיקה ראשונה!
                if (currentUrl.includes('/checkpoint/') || 
                    currentTitle.toLowerCase().includes('security verification') ||
                    currentTitle.toLowerCase().includes('verification') ||
                    currentTitle.toLowerCase().includes('checkpoint')) {
                    
                    console.log('🚨 LinkedIn דורש אימות אבטחה!');
                    securityCheckpointDetected = true;
                    try {
                        const canProceed = await handleSecurityCheckpoint(page);
                        if (!canProceed) {
                            throw new Error('LinkedIn דורש אימות אבטחה - יש להיכנס לחשבון ידנית ולעבור את האימות');
                        }
                        // אם הצלחנו לעבור את האימות, נמשיך
                        securityCheckpointDetected = false;
                        console.log('✅ עברתי את האימות - ממשיך...');
                    } catch (securityError) {
                        throw securityError;
                    }
                    break; // יציאה מהלולאה
                }
                
                // בדיקה אם הדף נטען נכון
                if (currentUrl.includes('linkedin.com') && 
                    !currentUrl.includes('chrome-error://') && 
                    !currentUrl.includes('data:') && 
                    currentUrl !== 'about:blank' &&
                    currentTitle.length > 0) {
                    
                    console.log('✅ הדף נטען נכון!');
                    
                    // בדיקה אם אנחנו בדף הראשי
                    if (currentUrl.includes('/feed/') || currentUrl.includes('/in/') || currentUrl === 'https://www.linkedin.com/') {
                        console.log('🎉 הגעתי לדף הראשי של LinkedIn!');
                        break;
                    } else {
                        console.log('⚠️ הדף נטען אבל לא הגעתי לדף הראשי - ממשיך לחכות...');
                        
                        // בדיקה נוספת - אולי זה דף אחר של LinkedIn
                        if (currentUrl.includes('/login') || currentUrl.includes('/signup')) {
                            console.log('⚠️ חזרתי לדף לוגין - ייתכן שהסיסמה שגויה');
                            throw new Error('חזרה לדף לוגין - ייתכן שהסיסמה שגויה או שהחשבון נחסם');
                        }
                    }
                } else {
                    console.log('⏳ הדף עדיין לא נטען נכון - מחכה...');
                }
                
                // המתנה 3 שניות בין בדיקות - הגדלנו ל-3 שניות
                await page.waitForTimeout(3000);
                
            } catch (error) {
                console.log(`⚠️ שגיאה בבדיקת הדף: ${error.message}`);
                // אם זו שגיאת אימות אבטחה, נפסיק את הלולאה
                if (error.message.includes('אימות אבטחה')) {
                    securityCheckpointDetected = true;
                    throw error;
                }
                await page.waitForTimeout(3000);
            }
        }
        
        if (attempts >= maxAttempts && !securityCheckpointDetected) {
            // בדיקה סופית מה קרה
            const finalUrl = page.url();
            const finalTitle = await page.title();
            
            if (finalUrl.includes('/checkpoint/') || 
                finalTitle.toLowerCase().includes('security verification') ||
                finalTitle.toLowerCase().includes('verification') ||
                finalTitle.toLowerCase().includes('checkpoint')) {
                const canProceed = await handleSecurityCheckpoint(page);
                if (!canProceed) {
                    throw new Error('LinkedIn דורש אימות אבטחה - יש להיכנס לחשבון ידנית ולעבור את האימות');
                }
            } else if (finalUrl.includes('/login') || finalUrl.includes('/signup')) {
                throw new Error('חזרה לדף לוגין - ייתכן שהסיסמה שגויה או שהחשבון נחסם');
            } else if (finalUrl.includes('chrome-error://') || finalUrl.includes('data:') || finalUrl === 'about:blank') {
                throw new Error('הדף לא נטען נכון - ייתכן שיש בעיה בחיבור או שהחשבון נחסם');
            } else {
                throw new Error(`הדף לא נטען נכון אחרי 45 שניות של המתנה. URL: ${finalUrl}, כותרת: ${finalTitle}`);
            }
        }
        
        // בדיקה סופית של הדף
        const finalUrl = page.url();
        const finalTitle = await page.title();
        console.log(`📍 URL סופי: ${finalUrl}`);
        console.log(`📄 כותרת סופית: ${finalTitle}`);
        
        // המתנה נוספת לטעינת התוכן
        console.log('⏳ ממתין 10 שניות לטעינת התוכן המלא...');
        await page.waitForTimeout(10000);
        
        // בדיקה אם LinkedIn דורש אימות נוסף
        console.log('🔒 בודק אם LinkedIn דורש אימות נוסף...');
        const pageText = await page.textContent('body');
        if (pageText.includes('captcha') || pageText.includes('verify') || pageText.includes('checkpoint')) {
            console.log('🚨 LinkedIn דורש אימות נוסף!');
            await page.screenshot({ path: 'linkedin_verification.png', fullPage: true });
            console.log('📸 צילום מסך של דף האימות נשמר');
            throw new Error('LinkedIn דורש אימות נוסף - לא ניתן להמשיך');
        }
        
        // חיפוש דרך הממשק הרגיל
        console.log(`🔍 מתחיל חיפוש עבור: "${searchQuery}"...`);
        
        try {
            // נסיון למצוא שדה חיפוש
            console.log('🔍 מחפש שדה חיפוש בדף...');
            const searchSelectors = [
                'input[placeholder*="Search"]',
                'input[aria-label*="Search"]',
                '.search-global-typeahead__input',
                'input[type="text"]',
                '[data-control-name="search_query"]'
            ];
            
            let searchInput = null;
            for (const selector of searchSelectors) {
                searchInput = await page.$(selector);
                if (searchInput) {
                    console.log(`✅ נמצא שדה חיפוש: ${selector}`);
                    break;
                }
            }
            
            if (searchInput) {
                console.log('🔍 לוחץ על שדה החיפוש...');
                await searchInput.click();
                await page.waitForTimeout(2000);
                
                console.log(`🔍 ממלא טקסט חיפוש: "${searchQuery}"...`);
                await searchInput.fill(searchQuery);
                await page.waitForTimeout(2000);
                
                console.log('🔍 לוחץ Enter לביצוע החיפוש...');
                await page.keyboard.press('Enter');
                console.log('✅ Enter נלחץ - החיפוש מתבצע...');
                
                // המתנה לטעינת תוצאות
                console.log('⏳ ממתין 15 שניות לטעינת תוצאות החיפוש...');
                await page.waitForTimeout(15000);
                
            } else {
                console.log('⚠️ לא נמצא שדה חיפוש - מנסה ניווט ישיר...');
                
                // ניווט ישיר לחיפוש
                const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`;
                console.log(`🌐 נווט ל-URL חיפוש: ${searchUrl}`);
                
                await page.goto(searchUrl, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 60000 
                });
                console.log('✅ הגעתי לעמוד החיפוש');
                
                // המתנה לטעינת תוצאות
                console.log('⏳ ממתין 15 שניות לטעינת תוצאות החיפוש...');
                await page.waitForTimeout(15000);
            }
            
        } catch (searchError) {
            console.log('❌ שגיאה בביצוע החיפוש:', searchError.message);
            throw searchError;
        }
        
        // בדיקה שהדף נטען נכון
        console.log('🔍 בודק שהדף נטען נכון...');
        const pageTitle = await page.title();
        const pageUrl = page.url();
        console.log(`📄 כותרת הדף: ${pageTitle}`);
        console.log(`🔗 URL נוכחי: ${pageUrl}`);
        
        // חילוץ נתונים
        console.log('📊 מתחיל חילוץ נתונים מהדף...');
        
        const developers = await page.evaluate(() => {
            const results = [];
            
            // נסיון ראשון - אלמנטים סטנדרטיים
            let cards = document.querySelectorAll('[data-view-name="search-entity-result-universal-template"]');
            
            // אם לא נמצאו, נסיון שני - אלמנטים חלופיים
            if (cards.length === 0) {
                cards = document.querySelectorAll('.search-result__info, .search-result, .result-card');
            }
            
            // אם עדיין לא נמצאו, נסיון שלישי - כל האלמנטים עם טקסט
            if (cards.length === 0) {
                const allElements = document.querySelectorAll('div, li, article');
                cards = Array.from(allElements).filter(el => {
                    const text = el.innerText || el.textContent || '';
                    return text.length > 20 && text.includes(' ') && !text.includes('LinkedIn');
                });
            }
            
            return {
                cardsCount: cards.length,
                cards: Array.from(cards).map((card, index) => {
                    try {
                        const allText = card.innerText || card.textContent || '';
                        const lines = allText.split('\n').filter(line => line.trim().length > 0);
                        
                        if (lines.length >= 2) {
                            const name = lines[0].trim();
                            const title = lines.find(line => 
                                line.length > 3 && 
                                !line.includes('Connect') && 
                                !line.includes('View') &&
                                !line.includes('Message') &&
                                !line.includes('Follow') &&
                                !line.includes('LinkedIn') &&
                                !line.includes('Search')
                            ) || lines[1];
                            
                            const location = lines.find(line => 
                                line.includes(',') || 
                                line.toLowerCase().includes('israel') ||
                                line.toLowerCase().includes('tel aviv') ||
                                line.toLowerCase().includes('jerusalem') ||
                                line.toLowerCase().includes('united states') ||
                                line.toLowerCase().includes('usa')
                            ) || 'N/A';

                            if (name && name.length > 2 && !name.includes('Connect') && !name.includes('View') && !name.includes('LinkedIn')) {
                                return {
                                    index: index + 1,
                                    name: name,
                                    title: title || 'N/A',
                                    location: location,
                                    scrapedAt: new Date().toISOString()
                                };
                            }
                        }
                    } catch (e) {
                        // שגיאה תועבר לשרת
                    }
                    return null;
                }).filter(Boolean)
            };
        });
        
        console.log(`🔍 נמצאו ${developers.cardsCount} כרטיסים`);
        
        // עיבוד התוצאות
        const finalResults = developers.cards || [];
        
        console.log(`📊 מתחיל עיבוד ${finalResults.length} כרטיסים...`);
        
        finalResults.forEach((card, index) => {
            console.log(`📝 כרטיס ${index + 1}: ${card.name} | ${card.title} | ${card.location}`);
        });
        
        console.log(`✅ עיבוד כרטיסים הושלם!`);
        console.log(`✅ חילוץ הושלם! נמצאו ${finalResults.length} תוצאות`);
        
        // המתנה קצרה לפני סגירת הדפדפן
        await page.waitForTimeout(5000);
        await browser.close();
        
        return {
            success: true,
            totalResults: finalResults.length,
            developers: finalResults.slice(0, maxResults),
            scrapedAt: new Date().toISOString(),
            retryCount: retryCount
        };

    } catch (error) {
        console.error(`❌ שגיאה בניסיון ${retryCount + 1}:`, error.message);
        await browser.close();
        
        // אם זה לא הניסיון האחרון, ננסה שוב
        if (retryCount < 2) {
            console.log(`🔄 מנסה שוב... (ניסיון ${retryCount + 2}/3)`);
            await new Promise(resolve => setTimeout(resolve, 10000)); // המתנה 10 שניות
            return await scrapeLinkedInReal(email, password, searchQuery, maxResults, retryCount + 1);
        }
        
        throw new Error(`החיפוש נכשל אחרי 3 ניסיונות. השגיאה האחרונה: ${error.message}`);
    }
}

// Simple routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        message: 'Simple server is working!'
    });
});

app.get('/test', (req, res) => {
    res.json({ 
        message: 'Test endpoint working!', 
        timestamp: new Date().toISOString()
    });
});

// API endpoint לחילוץ מפתחי Python
app.post('/api/scrape', async (req, res) => {
    const { email, password, searchQuery, maxResults } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'LinkedIn email and password are required'
        });
    }

    const jobId = Date.now().toString();
    
    // התחלת תהליך חילוץ ברקע
    scrapingResults.set(jobId, { status: 'running', startedAt: new Date().toISOString() });
    
    res.json({
        success: true,
        jobId: jobId,
        message: 'Scraping started. Use /api/results/:jobId to check progress.',
        estimatedTime: '2-3 minutes'
    });

    // הרצת החילוץ האמיתי ברקע
    try {
        const results = await scrapeLinkedInReal(
            email, 
            password, 
            searchQuery || 'Python Developer', 
            maxResults || 20
        );
        
        scrapingResults.set(jobId, {
            status: 'completed',
            startedAt: scrapingResults.get(jobId).startedAt,
            completedAt: new Date().toISOString(),
            data: results
        });
    } catch (error) {
        let errorMessage = error.message;
        let errorType = 'general';
        
        // זיהוי סוג השגיאה
        if (error.message.includes('אימות אבטחה')) {
            errorType = 'security_checkpoint';
            errorMessage = `LinkedIn דורש אימות אבטחה. 
                
פעולות שיש לבצע:
1. היכנס לחשבון LinkedIn שלך דרך הדפדפן
2. עבור את תהליך האימות (SMS/אימייל/CAPTCHA)
3. ודא שהחשבון פעיל ולא חסום
4. נסה שוב אחרי כמה דקות

סיבות אפשריות:
- פעילות חשודה זוהתה על ידי LinkedIn
- יותר מדי ניסיונות התחברות
- חשבון חדש או לא מאומת
- שימוש בכלים אוטומטיים

אם הבעיה נמשכת, נסה:
- להחליף סיסמה
- לחכות 24 שעות
- ליצור קשר עם תמיכת LinkedIn`;
        } else if (error.message.includes('סיסמה שגויה')) {
            errorType = 'login_failed';
            errorMessage = 'פרטי התחברות שגויים - בדוק את האימייל והסיסמה';
        } else if (error.message.includes('חיבור')) {
            errorType = 'connection_error';
            errorMessage = 'בעיה בחיבור לאינטרנט או לשרתי LinkedIn';
        } else if (error.message.includes('נחסם') || error.message.includes('מוגבל')) {
            errorType = 'account_blocked';
            errorMessage = `החשבון נחסם או מוגבל על ידי LinkedIn.
            
פעולות שיש לבצע:
1. היכנס לחשבון LinkedIn דרך הדפדפן
2. בדוק אם יש הודעות מ-LinkedIn
3. עקוב אחר ההוראות לשחזור החשבון
4. אם צריך, צור קשר עם תמיכת LinkedIn

סיבות אפשריות:
- פעילות אוטומטית יותר מדי
- הפרת תנאי השימוש
- דיווחים מחברי LinkedIn
- פעילות חשודה`;
        }
        
        scrapingResults.set(jobId, {
            status: 'failed',
            startedAt: scrapingResults.get(jobId).startedAt,
            failedAt: new Date().toISOString(),
            error: errorMessage,
            errorType: errorType
        });
    }
});

// בדיקת סטטוס ותוצאות
app.get('/api/results/:jobId', (req, res) => {
    const { jobId } = req.params;
    const result = scrapingResults.get(jobId);
    
    if (!result) {
        return res.status(404).json({
            success: false,
            error: 'Job not found'
        });
    }
    
    res.json({
        success: true,
        jobId: jobId,
        ...result
    });
});

// הורדת תוצאות כ-CSV
app.get('/api/download/:jobId', (req, res) => {
    const { jobId } = req.params;
    const result = scrapingResults.get(jobId);
    
    if (!result || result.status !== 'completed') {
        return res.status(404).json({
            success: false,
            error: 'Results not available'
        });
    }
    
    const developers = result.data.developers;
    let csvContent = 'Index,Name,Title,Location,Scraped At\n';
    
    developers.forEach(dev => {
        csvContent += `${dev.index},"${dev.name}","${dev.title}","${dev.location}","${new Date().toISOString()}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="linkedin_results_${jobId}.csv"`);
    res.send(csvContent);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Simple server running on port ${PORT}`);
    console.log(`📍 Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`🧪 Test endpoint: http://0.0.0.0:${PORT}/test`);
    console.log(`🌐 Web interface: http://0.0.0.0:${PORT}`);
    console.log(`🔧 API endpoints: /api/scrape, /api/results/:jobId, /api/download/:jobId`);
    console.log(`✅ Server is ready!`);
});

server.on('error', (err) => {
    console.error('❌ Server error:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});