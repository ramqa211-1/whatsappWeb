#!/usr/bin/env node

/**
 * Daily Python Developers LinkedIn Scraper
 * רץ כל יום ומחלץ 20 מפתחי Python מ-LinkedIn
 * 
 * Features:
 * - Headless mode (לא רואים דפדפן)
 * - יצוא ל-CSV
 * - לוג מפורט
 * - רוטציה של מילות מפתח
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class LinkedInPythonScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.developers = [];
        this.searchQueries = [
            'Senior Python Developer',
            'Python Backend Developer',
            'Full Stack Python Developer',
            'Django Developer',
            'Flask Developer',
            'QA Engineer',
            'QA Tester',
            'Test Automation Engineer',
            'DevOps Engineer',
            'Site Reliability Engineer',
            'React Developer',
            'Frontend Developer',
            'Backend Developer',
            'Full Stack Developer',
            'JavaScript Developer',
            'Node.js Developer',
            'Java Developer',
            'C# Developer',
            'PHP Developer',
            'Ruby Developer',
            'Go Developer',
            'Rust Developer',
            'Data Scientist',
            'Machine Learning Engineer',
            'AI Engineer',
            'Mobile Developer',
            'iOS Developer',
            'Android Developer',
            'Cloud Engineer',
            'AWS Developer',
            'Azure Developer',
            'Database Developer',
            'SQL Developer',
            'MongoDB Developer',
            'Blockchain Developer',
            'Game Developer',
            'Unity Developer',
            'Security Engineer',
            'Cybersecurity Engineer',
            'Network Engineer',
            'System Administrator',
            'Linux Administrator',
            'Windows Administrator',
            'Product Manager',
            'Scrum Master',
            'Project Manager',
            'Business Analyst',
            'UX Designer',
            'UI Designer',
            'Graphic Designer',
            'Content Writer',
            'Technical Writer',
            'Data Analyst',
            'Business Intelligence Developer',
            'ETL Developer',
            'Data Engineer',
            'Big Data Engineer',
            'Hadoop Developer',
            'Spark Developer',
            'Kafka Developer',
            'Elasticsearch Developer',
            'Kubernetes Engineer',
            'Docker Engineer',
            'Terraform Engineer',
            'Ansible Engineer',
            'Jenkins Engineer',
            'GitLab Engineer',
            'GitHub Engineer',
            'Bitbucket Engineer',
            'Jira Administrator',
            'Confluence Administrator',
            'Salesforce Developer',
            'SharePoint Developer',
            'Power BI Developer',
            'Tableau Developer',
            'Qlik Developer',
            'SAP Developer',
            'Oracle Developer',
            'Microsoft Dynamics Developer',
            'WordPress Developer',
            'Shopify Developer',
            'Magento Developer',
            'WooCommerce Developer',
            'API Developer',
            'Microservices Developer',
            'Serverless Developer',
            'GraphQL Developer',
            'REST API Developer',
            'SOAP Developer',
            'WebSocket Developer',
            'Real-time Developer',
            'IoT Developer',
            'Embedded Developer',
            'Firmware Developer',
            'Hardware Engineer',
            'Electrical Engineer',
            'Mechanical Engineer',
            'Civil Engineer',
            'Chemical Engineer',
            'Biomedical Engineer',
            'Robotics Engineer',
            'Automation Engineer',
            'PLC Developer',
            'SCADA Developer',
            'HMI Developer',
            'DCS Developer',
            'MES Developer',
            'ERP Developer',
            'CRM Developer',
            'HRIS Developer',
            'Payroll Developer',
            'Accounting Developer',
            'Finance Developer',
            'Trading Developer',
            'Quantitative Developer',
            'Algorithm Developer',
            'High-Frequency Trading Developer',
            'Risk Management Developer',
            'Compliance Developer',
            'Regulatory Developer',
            'Audit Developer',
            'Tax Developer',
            'Legal Tech Developer',
            'Healthcare Developer',
            'Medical Device Developer',
            'Pharmaceutical Developer',
            'Biotech Developer',
            'Genomics Developer',
            'Bioinformatics Developer',
            'Computational Biology Developer',
            'Climate Tech Developer',
            'Renewable Energy Developer',
            'Smart Grid Developer',
            'Energy Storage Developer',
            'Carbon Capture Developer',
            'Carbon Trading Developer',
            'ESG Developer',
            'Sustainability Developer',
            'Circular Economy Developer',
            'Waste Management Developer',
            'Water Management Developer',
            'Air Quality Developer',
            'Noise Pollution Developer',
            'Light Pollution Developer',
            'Soil Pollution Developer',
            'Ocean Pollution Developer',
            'Plastic Pollution Developer',
            'Microplastic Developer',
            'Nanoparticle Developer',
            'Quantum Developer',
            'Quantum Computing Developer',
            'Quantum Cryptography Developer',
            'Quantum Machine Learning Developer',
            'Post-Quantum Cryptography Developer',
            'Neuromorphic Computing Developer',
            'Optical Computing Developer',
            'DNA Computing Developer',
            'Molecular Computing Developer',
            'Chemical Computing Developer',
            'Biological Computing Developer',
            'Wetware Developer',
            'Hybrid Computing Developer',
            'Analog Computing Developer',
            'Digital Computing Developer',
            'Mixed-Signal Developer',
            'RF Developer',
            'Microwave Developer',
            'Millimeter Wave Developer',
            'Terahertz Developer',
            'Optical Developer',
            'Photonics Developer',
            'Laser Developer',
            'Fiber Optic Developer',
            'Satellite Developer',
            'Space Tech Developer',
            'Rocket Developer',
            'Propulsion Developer',
            'Navigation Developer',
            'Guidance Developer',
            'Control Developer',
            'Autopilot Developer',
            'Flight Control Developer',
            'Avionics Developer',
            'Aerospace Developer',
            'Defense Developer',
            'Military Tech Developer',
            'Intelligence Developer',
            'Surveillance Developer',
            'Reconnaissance Developer',
            'Counterintelligence Developer',
            'Cyber Warfare Developer',
            'Information Warfare Developer',
            'Electronic Warfare Developer',
            'Psychological Warfare Developer',
            'Economic Warfare Developer',
            'Trade War Developer',
            'Currency War Developer',
            'Resource War Developer',
            'Water War Developer'
        ];
        this.outputDir = 'linkedin_scraping_results';
    }

    async init() {
        console.log('🚀 מתחיל את הסקריפט...');
        
        // יצירת תיקיית פלט
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
        } catch (error) {
            // תיקייה כבר קיימת
        }

        // פתיחת דפדפן במצב headless
        this.browser = await chromium.launch({
            headless: true, // ❌ לא רואים את הדפדפן
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        this.page = await this.browser.newPage({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
    }

    async loginToLinkedIn() {
        console.log('🔐 מתחבר ל-LinkedIn...');
        
        try {
            await this.page.goto('https://www.linkedin.com/login');
            await this.page.waitForLoadState('networkidle');

            // כאן תצטרך להוסיף את פרטי ההתחברות שלך
            // ⚠️ חשוב: אל תשתף את הפרטים האמיתיים שלך בקוד!
            // השתמש במשתני סביבה או בקובץ קונפיגורציה נפרד
            
            const email = process.env.LINKEDIN_EMAIL || 'ramqaveles@gmail.com';
            const password = process.env.LINKEDIN_PASSWORD || '2918rmvt';

            await this.page.fill('#username', email);
            await this.page.fill('#password', password);
            await this.page.click('[type="submit"]');
            //

            // המתנה לטעינת הדף הראשי
            await this.page.waitForURL('**/feed/**', { timeout: 20000 });
            console.log('✅ התחברות הצליחה!');
            
        } catch (error) {
            console.error('❌ שגיאה בהתחברות:', error.message);
            throw error;
        }
    }

    async searchPythonDevelopers(query, maxResults = 20) {
        console.log(`🔍 מחפש: "${query}"`);
        
        try {
            // מעבר לדף חיפוש
            const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
            await this.page.goto(searchUrl);
            await this.page.waitForLoadState('networkidle');

            // המתנה לטעינת תוצאות החיפוש
            await this.page.waitForSelector('[data-view-name="search-entity-result-universal-template"]', { timeout: 10000 });

            const developers = [];
            let currentPage = 1;
            const maxPages = Math.ceil(maxResults / 10); // 10 תוצאות בעמוד

            while (developers.length < maxResults && currentPage <= maxPages) {
                console.log(`📄 עמוד ${currentPage}...`);

                // חילוץ נתונים מהעמוד הנוכחי
                const pageResults = await this.page.evaluate(() => {
                    const results = [];
                    const profileCards = document.querySelectorAll('[data-view-name="search-entity-result-universal-template"]');
                    
                    profileCards.forEach(card => {
                        try {
                            const nameElement = card.querySelector('.entity-result__title-text a span[aria-hidden="true"]');
                            const titleElement = card.querySelector('.entity-result__primary-subtitle');
                            const locationElement = card.querySelector('.entity-result__secondary-subtitle');
                            const profileLink = card.querySelector('.entity-result__title-text a');

                            if (nameElement && titleElement) {
                                results.push({
                                    name: nameElement.textContent.trim(),
                                    title: titleElement.textContent.trim(),
                                    location: locationElement ? locationElement.textContent.trim() : 'N/A',
                                    profileUrl: profileLink ? profileLink.href : 'N/A',
                                    searchQuery: query,
                                    scrapedAt: new Date().toISOString()
                                });
                            }
                        } catch (e) {
                            console.log('שגיאה בחילוץ פרופיל:', e.message);
                        }
                    });
                    
                    return results;
                });

                developers.push(...pageResults);
                console.log(`✅ נמצאו ${pageResults.length} מפתחים בעמוד ${currentPage}`);

                // מעבר לעמוד הבא (אם יש)
                if (developers.length < maxResults && currentPage < maxPages) {
                    try {
                        const nextButton = await this.page.$('button[aria-label="Next"]');
                        if (nextButton) {
                            await nextButton.click();
                            await this.page.waitForLoadState('networkidle');
                            await this.page.waitForTimeout(2000); // המתנה קצרה
                            currentPage++;
                        } else {
                            break;
                        }
                    } catch (e) {
                        console.log('לא ניתן לעבור לעמוד הבא');
                        break;
                    }
                }
            }

            return developers.slice(0, maxResults);

        } catch (error) {
            console.error(`❌ שגיאה בחיפוש "${query}":`, error.message);
            return [];
        }
    }

    async scrapeMultipleQueries(totalResults = 20) {
        console.log(`🎯 מטרה: ${totalResults} מפתחי Python`);
        
        const allDevelopers = [];
        const resultsPerQuery = Math.ceil(totalResults / this.searchQueries.length);

        for (const query of this.searchQueries) {
            if (allDevelopers.length >= totalResults) break;

            const needed = Math.min(resultsPerQuery, totalResults - allDevelopers.length);
            const developers = await this.searchPythonDevelopers(query, needed);
            
            allDevelopers.push(...developers);
            
            // המתנה בין חיפושים כדי לא לעורר חשד
            await this.page.waitForTimeout(3000);
        }

        // הסרת כפילויות לפי שם
        const uniqueDevelopers = allDevelopers.filter((dev, index, self) => 
            index === self.findIndex(d => d.name === dev.name)
        );

        return uniqueDevelopers.slice(0, totalResults);
    }

    async saveToCSV(developers) {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `python_developers_${timestamp}.csv`;
        const filepath = path.join(this.outputDir, filename);

        console.log(`💾 שומר ל-CSV: ${filepath}`);

        // יצירת CSV
        let csvContent = 'Name,Title,Location,Profile URL,Search Query,Scraped At\n';
        
        developers.forEach(dev => {
            const row = [
                `"${dev.name}"`,
                `"${dev.title}"`,
                `"${dev.location}"`,
                `"${dev.profileUrl}"`,
                `"${dev.searchQuery}"`,
                `"${dev.scrapedAt}"`
            ].join(',');
            csvContent += row + '\n';
        });

        await fs.writeFile(filepath, csvContent, 'utf8');
        console.log(`✅ נשמר ${developers.length} מפתחים בקובץ: ${filename}`);
        
        return filepath;
    }

    async saveToJSON(developers) {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `python_developers_${timestamp}.json`;
        const filepath = path.join(this.outputDir, filename);

        const data = {
            scrapedAt: new Date().toISOString(),
            totalResults: developers.length,
            developers: developers
        };

        await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`✅ נשמר גם כ-JSON: ${filename}`);
        
        return filepath;
    }

    async generateReport(developers) {
        console.log('\n📊 דוח סיכום:');
        console.log(`🔢 סך הכל נמצאו: ${developers.length} מפתחי Python`);
        
        // סיכום לפי מילות מפתח
        const byQuery = {};
        developers.forEach(dev => {
            byQuery[dev.searchQuery] = (byQuery[dev.searchQuery] || 0) + 1;
        });

        console.log('\n📈 פירוט לפי חיפוש:');
        Object.entries(byQuery).forEach(([query, count]) => {
            console.log(`  • ${query}: ${count} מפתחים`);
        });

        // סיכום לפי מיקום
        const byLocation = {};
        developers.forEach(dev => {
            const location = dev.location || 'Unknown';
            byLocation[location] = (byLocation[location] || 0) + 1;
        });

        console.log('\n🌍 פירוט לפי מיקום (טוב 5):');
        Object.entries(byLocation)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .forEach(([location, count]) => {
                console.log(`  • ${location}: ${count} מפתחים`);
            });
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 דפדפן נסגר');
        }
    }

    async run() {
        try {
            await this.init();
            await this.loginToLinkedIn();
            
            const developers = await this.scrapeMultipleQueries(20);
            
            if (developers.length > 0) {
                await this.saveToCSV(developers);
                await this.saveToJSON(developers);
                await this.generateReport(developers);
            } else {
                console.log('❌ לא נמצאו מפתחים');
            }

        } catch (error) {
            console.error('💥 שגיאה כללית:', error.message);
        } finally {
            await this.cleanup();
        }
    }
}

// הפעלת הסקריפט
async function main() {
    console.log('🐍 LinkedIn Python Developers Daily Scraper');
    console.log('='.repeat(50));
    
    const scraper = new LinkedInPythonScraper();
    await scraper.run();
    
    console.log('\n✨ הסקריפט הסתיים!');
}

// הפעלה אם הקובץ מורץ ישירות
if (require.main === module) {
    main().catch(console.error);
}

module.exports = LinkedInPythonScraper;
