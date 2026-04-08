require('dotenv').config(); 
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio'); 

// ==========================================
// 1. SETTINGS FOR OPENCORPORATES
// ==========================================
const LOGIN_URL = 'https://opencorporates.com/users/sign_in'; 

const SEARCH_QUERIES = [
    'BP P.L.C.', 
    'BOOTS INTERNATIONAL MANAGEMENT SERVICES LIMITED', 
    'SKIEF'  
];

const USERNAME_SELECTOR = '#user_email'; 
const PASSWORD_SELECTOR = '#user_password'; 
const LOGIN_BUTTON_SELECTOR = 'button[type="submit"]'; 

const ROTATION_LIMIT = parseInt(process.env.ROTATION_LIMIT) || 0;
const EXTRACT_OFFICERS = true; 

const CAPTCHA_API_KEY = process.env.CAPTCHA_API_KEY;
// ==========================================

// 2. Account Manager to store and rotate cookies
class AccountManager {
    constructor(limit) {
        this.accounts = [];
        this.currentIndex = 0;
        this.limit = limit;
        this.currentRequestCount = 0;
    }

    addAccountSession(username, cookieString) {
        this.accounts.push({ username, cookieString });
        console.log(`Session saved for user: ${username}`);
    }

    getNextSession() {
        if (this.accounts.length === 0) {
            throw new Error("No account sessions available.");
        }
        
        const session = this.accounts[this.currentIndex];
        this.currentRequestCount++;

        if (this.limit > 0 && this.currentRequestCount >= this.limit) {
            console.log(`Account ${session.username} reached limit of ${this.limit}. Rotating...`);
            this.currentIndex++;
            this.currentRequestCount = 0; 
            
            if (this.currentIndex >= this.accounts.length) {
                this.currentIndex = 0; 
            }
        }
        
        return session;
    }

    removeSession(username) {
        this.accounts = this.accounts.filter(acc => acc.username !== username);
        console.log(`Session removed for user: ${username} due to block or logout.`);
        this.currentIndex = 0; 
        this.currentRequestCount = 0;
    }
}

// Auto-solver using 2Captcha API
async function solveCaptcha(pageUrl, siteKey) {
    if (!CAPTCHA_API_KEY || CAPTCHA_API_KEY === 'paste_your_2captcha_api_key_here') {
        throw new Error("Missing real CAPTCHA_API_KEY in .env file.");
    }

    console.log("Sending Captcha to 2Captcha for solving...");
    
    const inUrl = `http://2captcha.com/in.php?key=${CAPTCHA_API_KEY}&method=hcaptcha&sitekey=${siteKey}&pageurl=${pageUrl}&json=1`;
    const inRes = await axios.get(inUrl);
    
    if (inRes.data.status !== 1) {
        throw new Error("2Captcha Error: " + inRes.data.request);
    }
    
    const requestId = inRes.data.request;
    console.log(`Captcha sent! Request ID: ${requestId}. Waiting for solution (this takes 15-40 seconds)...`);

    let attempts = 0;
    while (attempts < 30) {
        await new Promise(r => setTimeout(r, 5000)); 
        
        const resUrl = `http://2captcha.com/res.php?key=${CAPTCHA_API_KEY}&action=get&id=${requestId}&json=1`;
        const outRes = await axios.get(resUrl);
        
        if (outRes.data.status === 1) {
            console.log("Captcha solved successfully!");
            return outRes.data.request; 
        }
        
        if (outRes.data.request !== "CAPCHA_NOT_READY") {
            throw new Error("2Captcha Error: " + outRes.data.request);
        }
        
        process.stdout.write("."); 
        attempts++;
    }
    
    throw new Error("Captcha solving timed out.");
}

// 3. Login using Puppeteer and get cookies
async function loginAndGetCookies(username, password, loginUrl) {
    console.log(`Starting login process for ${username}...`);
    
    const browser = await puppeteer.launch({ headless: false }); 
    const page = await browser.newPage();

    try {
        await page.goto(loginUrl, { waitUntil: 'networkidle2' });

        try {
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const acceptButton = buttons.find(b => b.textContent.includes('Accept All'));
                if (acceptButton) {
                    acceptButton.click();
                }
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
            console.log(`No cookie popup found for ${username}.`);
        }

        try {
            await page.waitForSelector(USERNAME_SELECTOR, { timeout: 5000 });
        } catch (e) {
            throw new Error(`Could not find the email box.`);
        }

        await page.type(USERNAME_SELECTOR, username);
        await page.type(PASSWORD_SELECTOR, password);
        await page.click(LOGIN_BUTTON_SELECTOR);

        await new Promise(resolve => setTimeout(resolve, 5000));

        if (page.url().includes('sign_in')) {
            throw new Error('Login failed. The website rejected the email or password.');
        }

        console.log(`Navigating to the search page to check for Captchas...`);
        await page.goto('https://opencorporates.com/search?q=test', { waitUntil: 'networkidle2' });

        const isCaptchaPage = await page.$('#captcha_frame') !== null;
        
        if (isCaptchaPage) {
            console.log(`HAProxy Captcha detected for ${username}! Preparing to auto-solve...`);
            
            const siteKey = await page.evaluate(() => {
                const hCaptchaElement = document.querySelector('[data-sitekey]');
                return hCaptchaElement ? hCaptchaElement.getAttribute('data-sitekey') : null;
            });

            if (siteKey) {
                const currentUrl = page.url();
                
                const solutionToken = await solveCaptcha(currentUrl, siteKey);
                
                console.log("Injecting solution into OpenCorporates...");
                await page.evaluate((token) => {
                    captcha_done(token);
                }, solutionToken);

                await page.waitForNavigation({ waitUntil: 'networkidle2' });
                console.log(`Security clearance passed automatically!`);
                
            } else {
                console.log("Could not find the site key! Please solve manually quickly.");
                await new Promise(resolve => setTimeout(resolve, 30000)); 
            }
        } else {
            console.log(`No Captcha detected for ${username}.`);
        }

        const cookies = await page.cookies();
        await browser.close();

        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
        
        console.log(`Login and security process finished successfully for ${username}.`);
        return cookieString;

    } catch (error) {
        console.log(`Login failed for ${username}. Error: ${error.message}`);
        await browser.close();
        return null;
    }
}

// 4. Perform request using Axios
async function fetchData(targetUrl, accountManager) {
    const session = accountManager.getNextSession();
    
    try {
        const response = await axios.get(targetUrl, {
            timeout: 10000, 
            headers: {
                'Cookie': session.cookieString,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            }
        });

        return response.data;

    } catch (error) {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.log(`Account ${session.username} was blocked or logged out.`);
            accountManager.removeSession(session.username);
            throw new Error(`Session dead for ${session.username}`);
        } else {
            throw error;
        }
    }
}

// Function to search for a company and get its direct link
async function searchCompanyAndGetLink(query, accountManager) {
    console.log(`Searching for: "${query}"...`);
    
    const searchUrl = `https://opencorporates.com/search?q=${encodeURIComponent(query)}&type=companies`;
    
    const searchHtml = await fetchData(searchUrl, accountManager);

    if (searchHtml.includes('HAProxy Challenge') || searchHtml.includes('hcaptcha')) {
        console.log(`---> BLOCKED: OpenCorporates threw a Captcha on the search page.`);
        fs.writeFileSync('search_blocked.html', searchHtml);
        return null;
    }

    const $ = cheerio.load(searchHtml);
    let targetLink = null;
    const links = [];

    $('ul.companies li a.company_search_result').each((index, element) => {
        const link = $(element).attr('href');
        const name = $(element).text().trim();
        
        if (link && link.includes('/companies/')) {
            links.push({ name, link });
        }
    });
    
    if (links.length > 0) {
        const exactMatch = links.find(item => item.name.toLowerCase() === query.toLowerCase());
        
        if (exactMatch) {
            targetLink = exactMatch.link;
            console.log(`Found exact match: ${exactMatch.name}`);
        } else {
            targetLink = links[0].link;
            console.log(`No exact match. Using first result: ${links[0].name}`);
        }
    }
    
    if (targetLink) {
        return `https://opencorporates.com${targetLink}`;
    } else {
        console.log(`No results found for "${query}".`);
        return null;
    }
}

// Function to extract company data and the list of officers
function extractCompanyData(htmlData) {
    const $ = cheerio.load(htmlData);
    
    const companyName = $('h1[itemprop="name"]').text().trim();
    const companyNumber = $('.company_number').text().trim();

    const officers = [];
    
    $('.officers .attribute_item a.officer').each((index, element) => {
        const officerName = $(element).text().trim();
        const officerLink = $(element).attr('href');
        
        if (officerName && officerLink) {
            officers.push({ name: officerName, link: officerLink });
        }
    });

    if (companyName) {
        console.log(`---> SUCCESS! Extracted: Name: ${companyName} | Number: ${companyNumber} | Found ${officers.length} officers.`);
        
        const csvLine = `"${companyName}","${companyNumber}"\n`;
        fs.appendFileSync('results.csv', csvLine);
        
        return { companyName, officers };
    } else {
        console.log(`---> FAILED: Could not find company name. The website probably blocked us.`);
        return null;
    }
}

// Function to extract specific data from the officer's page
function extractOfficerData(htmlData, companyName, officerName) {
    const $ = cheerio.load(htmlData);
    
    let details = $('#attributes').text().replace(/\s+/g, ' ').trim();
    if (!details) {
        details = "No extra details found on this profile.";
    }
    
    console.log(`-----> Saved data for officer: ${officerName}`);
    
    const csvLine = `"${companyName}","${officerName}","${details}"\n`;
    fs.appendFileSync('officers.csv', csvLine);
}

// Setup the CSV files before running
function setupCsvFiles() {
    if (!fs.existsSync('results.csv')) {
        fs.writeFileSync('results.csv', '"Company Name","Company Number"\n');
    }
    if (!fs.existsSync('officers.csv')) {
        fs.writeFileSync('officers.csv', '"Company Name","Officer Name","Details"\n');
    }
}

// Main function to run the workflow
async function runScraper() {
    setupCsvFiles();
    
    const manager = new AccountManager(ROTATION_LIMIT);

    const manualCookies = process.env.MANUAL_COOKIES;

    // Pull emails and passwords securely from the .env file
    const email1 = process.env.ACCOUNT1_EMAIL;
    const pass1 = process.env.ACCOUNT1_PASSWORD;
    const email2 = process.env.ACCOUNT2_EMAIL;
    const pass2 = process.env.ACCOUNT2_PASSWORD;

    if (manualCookies && manualCookies.length > 5) {
        console.log("Manual mode detected. Skipping browser login...");
        
        const cookieArray = manualCookies.split(',');
        
        let counter = 1;
        for (const cookie of cookieArray) {
            manager.addAccountSession(`Manual_User_${counter}`, cookie.trim());
            counter++;
        }
    } else {
        console.log("No manual cookies found. Starting auto-login mode...");
        
        if (email1 && pass1) {
            const session1 = await loginAndGetCookies(email1, pass1, LOGIN_URL);
            if (session1) {
                manager.addAccountSession(email1, session1);
            }
        } else {
            console.log("Missing Account 1 login details in .env file.");
        }

        if (email2 && pass2) {
            const session2 = await loginAndGetCookies(email2, pass2, LOGIN_URL);
            if (session2) {
                manager.addAccountSession(email2, session2);
            }
        } else {
            console.log("Missing Account 2 login details in .env file.");
        }
    }

    if (manager.accounts.length > 0) {
        console.log("\n--- STARTING DATA SCRAPE ---");
        
        for (const query of SEARCH_QUERIES) {
            console.log(`\n---------------------------------`);
            
            try {
                const targetUrl = await searchCompanyAndGetLink(query, manager);
                
                if (targetUrl) {
                    console.log(`Downloading profile data...`);
                    const companyDataHtml = await fetchData(targetUrl, manager); 
                    
                    const result = extractCompanyData(companyDataHtml);
                    
                    if (result && EXTRACT_OFFICERS && result.officers.length > 0) {
                        console.log(`Starting extraction for ${result.officers.length} officers...`);
                        
                        for (const officer of result.officers) {
                            const officerUrl = `https://opencorporates.com${officer.link}`;
                            
                            try {
                                const officerHtml = await fetchData(officerUrl, manager);
                                extractOfficerData(officerHtml, result.companyName, officer.name);
                            } catch (e) {
                                console.log(`Failed to fetch profile for ${officer.name}.`);
                            }
                            
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        }
                    }
                }
                
            } catch (err) {
                console.log(`Skipping query due to an error: ${err.message}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log("\n--- SCRAPE FINISHED ---");
    } else {
        console.log("No accounts logged in. Skipping data fetch.");
    }
}

runScraper();