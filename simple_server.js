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

// פונקציה לביצוע פעולות רנדומליות כמו משתמש אמיתי
async function performRandomUserAction(page) {
    console.log('🎲 מתחיל בחירת פעולה רנדומלית...');
    
    // בדיקת מצב הדף לפני הפעולה
    try {
        const currentUrl = page.url();
        const currentTitle = await page.title();
        console.log(`📍 URL נוכחי לפני פעולה רנדומלית: ${currentUrl}`);
        console.log(`📄 כותרת נוכחית לפני פעולה רנדומלית: ${currentTitle}`);
    } catch (error) {
        console.log('⚠️ לא הצלחתי לבדוק מצב הדף:', error.message);
    }
    
    const actions = [
        {
            name: 'לחיצה על פרופיל שלי',
            selector: 'a[href*="/in/"], .global-nav__me-photo, .nav-item__profile-member-photo',
            probability: 0.3,
            action: async (selector) => {
                console.log('🔍 מחפש קישור לפרופיל שלי...');
                const profileLink = await page.$(selector);
                if (profileLink) {
                    console.log('✅ נמצא קישור לפרופיל שלי');
                    console.log('👤 לוחץ על פרופיל שלי...');
                    
                    try {
                        await profileLink.click();
                        console.log('✅ לחיצה על פרופיל בוצעה');
                        
                        const waitTime = 3000 + Math.random() * 5000; // 3-8 שניות
                        console.log(`⏳ ממתין ${Math.round(waitTime/1000)} שניות אחרי לחיצה על פרופיל...`);
                        await page.waitForTimeout(waitTime);
                        
                        // בדיקת מצב הדף אחרי הפעולה
                        const newUrl = page.url();
                        const newTitle = await page.title();
                        console.log(`📍 URL חדש אחרי לחיצה על פרופיל: ${newUrl}`);
                        console.log(`📄 כותרת חדשה אחרי לחיצה על פרופיל: ${newTitle}`);
                        
                        if (newUrl.includes('/in/')) {
                            console.log('✅ הגעתי לפרופיל שלי בהצלחה');
                        } else {
                            console.log('⚠️ לא הגעתי לפרופיל שלי - URL לא השתנה');
                        }
                        
                        return true;
                    } catch (error) {
                        console.log('❌ שגיאה בלחיצה על פרופיל:', error.message);
                        return false;
                    }
                } else {
                    console.log('⚠️ לא נמצא קישור לפרופיל שלי');
                    return false;
                }
            }
        },
        {
            name: 'לחיצה על פוסט ראשון/שני בפיד',
            selector: '.feed-shared-update-v2, .feed-shared-text, .feed-shared-update-v2__description',
            probability: 0.4,
            action: async (selector) => {
                console.log('🔍 מחפש פוסטים בפיד...');
                const posts = await page.$$(selector);
                console.log(`📊 נמצאו ${posts.length} פוסטים בפיד`);
                
                if (posts.length > 0) {
                    const postIndex = Math.floor(Math.random() * Math.min(2, posts.length));
                    console.log(`📝 בוחר פוסט מספר ${postIndex + 1} מתוך ${posts.length}`);
                    
                    try {
                        // בדיקת תוכן הפוסט לפני לחיצה
                        const postText = await posts[postIndex].textContent();
                        const shortText = postText ? postText.substring(0, 100) + '...' : 'לא ניתן לקרוא';
                        console.log(`📝 תוכן הפוסט שנבחר: ${shortText}`);
                        
                        console.log('📝 לוחץ על פוסט בפיד...');
                        await posts[postIndex].click();
                        console.log('✅ לחיצה על פוסט בוצעה');
                        
                        const waitTime = 2000 + Math.random() * 3000; // 2-5 שניות
                        console.log(`⏳ ממתין ${Math.round(waitTime/1000)} שניות אחרי לחיצה על פוסט...`);
                        await page.waitForTimeout(waitTime);
                        
                        // בדיקת מצב הדף אחרי הפעולה
                        const newUrl = page.url();
                        const newTitle = await page.title();
                        console.log(`📍 URL חדש אחרי לחיצה על פוסט: ${newUrl}`);
                        console.log(`📄 כותרת חדשה אחרי לחיצה על פוסט: ${newTitle}`);
                        
                        if (newUrl !== page.url()) {
                            console.log('✅ ניווט לפוסט בוצע בהצלחה');
                        } else {
                            console.log('⚠️ לא היה ניווט לפוסט - ייתכן שהפוסט נפתח באותו דף');
                        }
                        
                        return true;
                    } catch (error) {
                        console.log('❌ שגיאה בלחיצה על פוסט:', error.message);
                        return false;
                    }
                } else {
                    console.log('⚠️ לא נמצאו פוסטים בפיד');
                    return false;
                }
            }
        },
        {
            name: 'לחיצה על תפריט הודעות',
            selector: 'a[href*="/messaging"], .nav-item__messaging, .global-nav__messaging',
            probability: 0.2,
            action: async (selector) => {
                const messagingLink = await page.$(selector);
                if (messagingLink) {
                    console.log('💬 לוחץ על תפריט הודעות...');
                    await messagingLink.click();
                    await page.waitForTimeout(2000 + Math.random() * 3000); // 2-5 שניות
                    console.log('✅ הגעתי לתפריט הודעות');
                    return true;
                }
                return false;
            }
        },
        {
            name: 'לחיצה על תפריט רשת',
            selector: 'a[href*="/mynetwork"], .nav-item__mynetwork, .global-nav__mynetwork',
            probability: 0.1,
            action: async (selector) => {
                const networkLink = await page.$(selector);
                if (networkLink) {
                    console.log('🌐 לוחץ על תפריט רשת...');
                    await networkLink.click();
                    await page.waitForTimeout(2000 + Math.random() * 3000); // 2-5 שניות
                    console.log('✅ הגעתי לתפריט רשת');
                    return true;
                }
                return false;
            }
        }
    ];
    
    // בחירת פעולה לפי הסתברות
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const action of actions) {
        cumulativeProbability += action.probability;
        if (random <= cumulativeProbability) {
            console.log(`🎲 נבחרה פעולה: ${action.name}`);
            
            try {
                const success = await action.action(action.selector);
                                    if (success) {
                        // המתנה רנדומלית אחרי הפעולה
                        const waitTime = 5000 + Math.random() * 10000; // 5-15 שניות
                        console.log(`⏳ ממתין ${Math.round(waitTime/1000)} שניות אחרי הפעולה...`);
                        await page.waitForTimeout(waitTime);
                        console.log('✅ המתנה אחרי הפעולה הושלמה');
                        
                        // חזרה לדף הראשי (לא תמיד)
                        if (Math.random() < 0.7) { // 70% מהמקרים
                            console.log('🏠 חוזר לדף הראשי...');
                            try {
                                console.log('🌐 נווט לדף הראשי: https://www.linkedin.com/feed/');
                                await page.goto('https://www.linkedin.com/feed/', { 
                                    waitUntil: 'domcontentloaded',
                                    timeout: 30000 
                                });
                                console.log('✅ ניווט לדף הראשי הושלם');
                                
                                const waitTime = 2000 + Math.random() * 3000; // 2-5 שניות
                                console.log(`⏳ ממתין ${Math.round(waitTime/1000)} שניות אחרי חזרה לדף הראשי...`);
                                await page.waitForTimeout(waitTime);
                                
                                // בדיקת מצב הדף אחרי חזרה
                                const finalUrl = page.url();
                                const finalTitle = await page.title();
                                console.log(`📍 URL סופי אחרי חזרה לדף הראשי: ${finalUrl}`);
                                console.log(`📄 כותרת סופית אחרי חזרה לדף הראשי: ${finalTitle}`);
                                
                                if (finalUrl.includes('/feed/')) {
                                    console.log('✅ חזרתי לדף הראשי בהצלחה');
                                } else {
                                    console.log('⚠️ לא חזרתי לדף הראשי - URL לא נכון');
                                }
                            } catch (error) {
                                console.log('❌ שגיאה בחזרה לדף הראשי:', error.message);
                                console.log('🔍 מנסה לבדוק איפה אני עכשיו...');
                                try {
                                    const currentUrl = page.url();
                                    const currentTitle = await page.title();
                                    console.log(`📍 URL נוכחי אחרי שגיאה: ${currentUrl}`);
                                    console.log(`📄 כותרת נוכחית אחרי שגיאה: ${currentTitle}`);
                                } catch (urlError) {
                                    console.log('⚠️ לא הצלחתי לבדוק URL נוכחי:', urlError.message);
                                }
                            }
                        } else {
                            console.log('🎲 לא חוזר לדף הראשי (30% מהמקרים)');
                        }
                        return;
                    }
            } catch (error) {
                console.log(`⚠️ הפעולה "${action.name}" נכשלה:`, error.message);
            }
        }
    }
    
    // אם אף פעולה לא עבדה, נחכה קצת
    console.log('⚠️ לא הצלחתי לבצע פעולה רנדומלית, מחכה קצת...');
    await page.waitForTimeout(3000 + Math.random() * 5000); // 3-8 שניות
}

// LinkedIn scraper function - REAL SCRAPING!
async function scrapeLinkedInReal(email, password, searchQuery = 'Python Developer', maxResults = 20, retryCount = 0) {
    if (!chromium) {
        throw new Error('Playwright is not available. Cannot perform scraping.');
    }

    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    });

    const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // הגדרת viewport אמיתי
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // הגדרת cookies ו-localStorage כדי להיראות כמו משתמש אמיתי
    await page.addInitScript(() => {
        // הגדרת localStorage
        localStorage.setItem('li_at', 'dummy_token');
        localStorage.setItem('JSESSIONID', 'dummy_session');
        
        // הגדרת cookies
        document.cookie = 'li_at=dummy_token; domain=.linkedin.com; path=/';
        document.cookie = 'JSESSIONID=dummy_session; domain=.linkedin.com; path=/';
    });

    try {
        console.log(`🔐 ניסיון ${retryCount + 1}: מתחיל תהליך התחברות ל-LinkedIn...`);
        console.log(`📧 אימייל: ${email}`);
        console.log(`🔑 סיסמה: ${password ? '***' + password.slice(-3) : 'לא הוזנה'}`);
        
        // הגדלת timeout ל-60 שניות
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);
        console.log('⏱️ Timeout הוגדר ל-60 שניות');
        
        // התחברות ל-LinkedIn
        console.log('🌐 מגיע לעמוד לוגין של LinkedIn...');
        await page.goto('https://www.linkedin.com/login', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });
        console.log('✅ הגעתי לעמוד לוגין של LinkedIn');
        
        console.log('📝 ממלא פרטי התחברות...');
        await page.fill('#username', email);
        console.log('✅ אימייל הוזן');
        await page.fill('#password', password);
        console.log('✅ סיסמה הוזנה');
        
        console.log('🚀 לוחץ על כפתור התחברות...');
        await page.click('button[type="submit"]');
        console.log('✅ כפתור התחברות נלחץ');
        
        // המתנה מורחבת - 20 שניות אחרי לוגין (לפרוד)
        console.log('⏳ ממתין 20 שניות לטעינת הדף אחרי לוגין...');
        console.log('🔄 זה יכול לקחת זמן בפרוד...');
        await page.waitForTimeout(20000);
        console.log('✅ המתנה אחרי לוגין הושלמה');
        
        // המתנה נוספת לטעינת הדף הראשי
        console.log('⏳ ממתין 5 שניות נוספות לטעינת הדף הראשי...');
        await page.waitForTimeout(5000);
        console.log('✅ המתנה לטעינת הדף הראשי הושלמה');
        
        // בדיקה שהדף נטען נכון אחרי לוגין
        console.log('🔍 בודק מצב הדף אחרי לוגין...');
        const currentUrl = page.url();
        const currentTitle = await page.title();
        console.log(`📍 URL נוכחי: ${currentUrl}`);
        console.log(`📄 כותרת נוכחית: ${currentTitle}`);
        
        // בדיקה אם LinkedIn דורש אימות נוסף
        const bodyText = await page.textContent('body');
        if (bodyText.includes('captcha') || bodyText.includes('verify') || bodyText.includes('checkpoint')) {
            console.log('🚨 LinkedIn דורש אימות נוסף!');
            await page.screenshot({ path: 'linkedin_verification.png', fullPage: true });
            console.log('📸 צילום מסך של דף האימות נשמר');
            throw new Error('LinkedIn דורש אימות נוסף - לא ניתן להמשיך');
        }
        
        // בדיקה אם אנחנו בדף הראשי או בדף אחר
        if (currentUrl.includes('chrome-error://') || currentUrl.includes('data:') || currentUrl === 'about:blank') {
            console.log('⚠️ הדף לא נטען נכון - מנסה לנווט לדף הראשי...');
            try {
                await page.goto('https://www.linkedin.com/feed/', { 
                    waitUntil: 'domcontentloaded',
                    timeout: 30000 
                });
                console.log('✅ ניווט לדף הראשי הושלם');
                await page.waitForTimeout(5000);
            } catch (navError) {
                console.log('❌ שגיאה בניווט לדף הראשי:', navError.message);
                throw new Error('לא ניתן לנווט לדף הראשי אחרי לוגין');
            }
        }
        
        // פעולות רנדומליות כדי להיראות כמו משתמש אמיתי
        console.log('🎲 מבצע פעולה רנדומלית כדי להיראות כמו משתמש אמיתי...');
        await performRandomUserAction(page);
        
        // חיפוש - עכשיו מחפש כל מילה שאתה מזין
        console.log(`🔍 מתחיל חיפוש עבור: "${searchQuery}"...`);
        
        // נסיון ראשון - חיפוש דרך הדף הראשי
        try {
            console.log('🔍 נסיון ראשון: מחפש דרך הדף הראשי...');
            
            // בדיקת מצב הדף לפני חיפוש
            const beforeSearchUrl = page.url();
            const beforeSearchTitle = await page.title();
            console.log(`📍 URL לפני חיפוש: ${beforeSearchUrl}`);
            console.log(`📄 כותרת לפני חיפוש: ${beforeSearchTitle}`);
            
            // לחץ על כפתור החיפוש אם קיים
            console.log('🔍 מחפש שדה חיפוש בדף הראשי...');
            const searchButton = await page.$('input[placeholder*="Search"], input[aria-label*="Search"], .search-global-typeahead__input');
            
            if (searchButton) {
                console.log('✅ נמצא שדה חיפוש בדף הראשי');
                
                try {
                    console.log('🔍 לוחץ על שדה החיפוש...');
                    await searchButton.click();
                    console.log('✅ לחיצה על שדה החיפוש בוצעה');
                    
                    console.log('⏳ ממתין 2 שניות אחרי לחיצה...');
                    await page.waitForTimeout(2000);
                    
                    console.log(`🔍 ממלא טקסט חיפוש: "${searchQuery}"...`);
                    await searchButton.fill(searchQuery);
                    console.log('✅ טקסט חיפוש הוזן');
                    
                    console.log('⏳ ממתין 2 שניות אחרי הזנת טקסט...');
                    await page.waitForTimeout(2000);
                    
                    console.log('🔍 לוחץ Enter לביצוע החיפוש...');
                    await page.keyboard.press('Enter');
                    console.log('✅ Enter נלחץ - החיפוש מתבצע...');
                    
                    console.log('✅ חיפוש בוצע דרך הדף הראשי');
                } catch (searchError) {
                    console.log('❌ שגיאה בביצוע החיפוש דרך הדף הראשי:', searchError.message);
                    throw searchError;
                }
            } else {
                console.log('⚠️ לא נמצא שדה חיפוש בדף הראשי');
                console.log('🔍 מנסה למצוא אלמנטים חלופיים...');
                
                // נסיון למצוא אלמנטים חלופיים
                const alternativeSelectors = [
                    'input[type="text"]',
                    '.search-input',
                    '[data-control-name="search_query"]'
                ];
                
                for (const altSelector of alternativeSelectors) {
                    const altElement = await page.$(altSelector);
                    if (altElement) {
                        console.log(`✅ נמצא אלמנט חלופי: ${altSelector}`);
                        break;
                    }
                }
                
                throw new Error('לא נמצא שדה חיפוש');
            }
        } catch (error) {
            console.log('🔍 נסיון שני: נווט ישיר ל-URL חיפוש...');
            console.log(`⚠️ הסיבה לכישלון נסיון ראשון: ${error.message}`);
            
            // בדיקה שהדף נטען נכון לפני ניסיון הניווט
            const currentUrl = page.url();
            if (currentUrl.includes('chrome-error://') || currentUrl.includes('data:') || currentUrl === 'about:blank') {
                console.log('⚠️ הדף לא נטען נכון - מנסה לנווט לדף הראשי קודם...');
                try {
                    await page.goto('https://www.linkedin.com/feed/', { 
                        waitUntil: 'domcontentloaded',
                        timeout: 30000 
                    });
                    console.log('✅ ניווט לדף הראשי הושלם');
                    await page.waitForTimeout(5000);
                } catch (navError) {
                    console.log('❌ שגיאה בניווט לדף הראשי:', navError.message);
                    throw new Error('לא ניתן לנווט לדף הראשי');
                }
            }
            
            const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`;
            console.log(`🌐 נווט ל-URL חיפוש: ${searchUrl}`);
            
            // נסיון עם waitUntil: 'domcontentloaded' בלבד
            try {
                console.log('🔍 נסיון עם domcontentloaded...');
                await page.goto(searchUrl, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 60000 
                });
                console.log('✅ הגעתי לעמוד תוצאות החיפוש עם domcontentloaded');
            } catch (redirectError) {
                console.log('❌ שגיאת redirects:', redirectError.message);
                
                // נסיון עם גישה הדרגתית
                console.log('🔍 מנסה גישה הדרגתית...');
                try {
                    // קודם לדף הראשי
                    await page.goto('https://www.linkedin.com/', { 
                        waitUntil: 'domcontentloaded',
                        timeout: 30000 
                    });
                    console.log('✅ הגעתי לדף הראשי');
                    await page.waitForTimeout(3000);
                    
                    // עכשיו לחיפוש
                    await page.goto(searchUrl, { 
                        waitUntil: 'domcontentloaded',
                        timeout: 30000 
                    });
                    console.log('✅ הגעתי לעמוד החיפוש אחרי גישה הדרגתית');
                } catch (gradientError) {
                    console.log('❌ גם הגישה ההדרגתית נכשלה:', gradientError.message);
                    throw gradientError;
                }
            }
        }
        
        console.log('⏳ ממתין 15 שניות לטעינת תוצאות החיפוש...');
        console.log('🔄 זה יכול לקחת זמן בפרוד...');
        await page.waitForTimeout(15000);
        console.log('✅ המתנה לטעינת תוצאות החיפוש הושלמה');
        
        // המתנה נוספת לטעינת התוכן
        console.log('⏳ ממתין 5 שניות נוספות לטעינת התוכן...');
        await page.waitForTimeout(5000);
        console.log('✅ המתנה לטעינת התוכן הושלמה');

        // בדיקה שהדף נטען נכון
        console.log('🔍 בודק שהדף נטען נכון...');
        const pageTitle = await page.title();
        const pageUrl = page.url();
        console.log(`📄 כותרת הדף: ${pageTitle}`);
        console.log(`🔗 URL נוכחי: ${pageUrl}`);
        
        // בדיקה אם יש תוכן בדף
        console.log('📊 בודק גודל תוכן הדף...');
        const pageContent = await page.content();
        console.log(`📊 גודל תוכן הדף: ${pageContent.length} תווים`);
        
        if (pageContent.length < 1000) {
            console.log('⚠️ אזהרה: תוכן הדף קצר מדי - ייתכן שהדף לא נטען נכון');
        } else {
            console.log('✅ תוכן הדף נראה תקין');
        }
        
        // בדיקה אם LinkedIn דורש אימות נוסף
        console.log('🔒 בודק אם LinkedIn דורש אימות נוסף...');
        const pageText = await page.textContent('body');
        if (pageText.includes('captcha') || pageText.includes('verify') || pageText.includes('checkpoint')) {
            console.log('🚨 LinkedIn דורש אימות נוסף!');
            await page.screenshot({ path: 'linkedin_verification.png', fullPage: true });
            console.log('📸 צילום מסך של דף האימות נשמר');
            throw new Error('LinkedIn דורש אימות נוסף - לא ניתן להמשיך');
        }
        
        // בדיקה אם אנחנו בדף הראשי
        if (pageUrl.includes('linkedin.com/feed') || pageUrl.includes('linkedin.com/in/')) {
            console.log('✅ הגעתי לדף הראשי של LinkedIn');
        } else {
            console.log('⚠️ לא הגעתי לדף הראשי - ייתכן שיש בעיה בהתחברות');
            console.log(`📍 URL נוכחי: ${pageUrl}`);
        }

        // חילוץ נתונים אמיתיים - עכשיו לוקח את כל התוצאות
        console.log('📊 מתחיל חילוץ נתונים מהדף...');
        
        // בדיקה נוספת של הדף לפני חילוץ
        const finalUrl = page.url();
        const finalTitle = await page.title();
        console.log(`📍 URL נוכחי לפני חילוץ: ${finalUrl}`);
        console.log(`📄 כותרת נוכחית לפני חילוץ: ${finalTitle}`);
        
        // בדיקה אם אנחנו בדף תוצאות חיפוש
        if (!finalUrl.includes('search/results') && !finalTitle.toLowerCase().includes('search')) {
            console.log('⚠️ לא הגעתי לדף תוצאות חיפוש!');
            console.log('🔍 מנסה למצוא תוצאות בדף הנוכחי...');
        }
        
        console.log('🔍 מתחיל חיפוש אלמנטים בדף...');
        
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
            
            // החזרת הנתונים לשרת
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
        
        // לוגים בשרת - עכשיו תראה אותם בטרמינל!
        console.log(`🔍 נסיון ראשון - אלמנטים סטנדרטיים: ${developers.cardsCount} כרטיסים`);
        
        if (developers.cardsCount === 0) {
            console.log('⚠️ לא נמצאו כרטיסי תוצאות סטנדרטיים!');
            console.log('🔍 נסיון שני - אלמנטים חלופיים: 0 כרטיסים');
            console.log('🔍 נסיון שלישי - אלמנטים עם טקסט: 0 כרטיסים');
        }
        
        // עיבוד התוצאות
        const finalResults = developers.cards || [];
        
        // לוגים מפורטים לכל כרטיס שנמצא
        console.log(`📊 מתחיל עיבוד ${finalResults.length} כרטיסים...`);
        
        finalResults.forEach((card, index) => {
            console.log(`📝 כרטיס ${index + 1}: ${card.name} | ${card.title} | ${card.location}`);
        });
        
        console.log(`✅ עיבוד כרטיסים הושלם!`);

        console.log(`✅ חילוץ הושלם! נמצאו ${finalResults.length} תוצאות`);
        
        // בדיקה אם LinkedIn חסם אותנו
        if (finalResults.length === 0) {
            const blockedText = await page.textContent('body');
            if (blockedText.includes('captcha') || blockedText.includes('verify') || blockedText.includes('blocked')) {
                console.log('🚨 LinkedIn דורש אימות או חסם אותנו!');
                await page.screenshot({ path: 'linkedin_blocked.png', fullPage: true });
                console.log('📸 צילום מסך נשמר: linkedin_blocked.png');
            }
        }
        
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
            await new Promise(resolve => setTimeout(resolve, 5000)); // המתנה 5 שניות
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
        scrapingResults.set(jobId, {
            status: 'failed',
            startedAt: scrapingResults.get(jobId).startedAt,
            failedAt: new Date().toISOString(),
            error: error.message
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