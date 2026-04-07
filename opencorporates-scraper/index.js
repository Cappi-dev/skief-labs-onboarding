require('dotenv').config();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = 'https://opencorporates.com';

let sessionCookies = [];
try {
    const cookieData = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
    const rawString = cookieData.cookie;
    
    sessionCookies = rawString.split('; ').map(pair => {
        const [name, ...rest] = pair.split('=');
        return { 
            name: name, 
            value: rest.join('='), 
            domain: '.opencorporates.com' 
        };
    });
    console.log("Successfully loaded session cookie from cookies.json");
} catch (error) {
    console.error("Could not read cookies.json. Please run sessionManager.js first.");
    process.exit(1); 
}

async function fetchWithPuppeteer(browser, targetUrl) {
    const page = await browser.newPage();
    await page.setCookie(...sessionCookies);
    
    try {
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });
        
        let pageTitle = await page.title();
        
        // If we hit the puzzle, freeze the code and wait for you to solve it
        if (pageTitle.toLowerCase().includes('haproxy') || pageTitle.toLowerCase().includes('security') || pageTitle.toLowerCase().includes('challenge')) {
            console.log("\nHAProxy Captcha detected!");
            console.log("Waiting 30 seconds... Please click the Captcha box in the open Chrome window right now!");
            
            try {
                await page.waitForFunction(
                    '!(document.title.toLowerCase().includes("haproxy") || document.title.toLowerCase().includes("challenge") || document.title.toLowerCase().includes("security"))',
                    { timeout: 30000 }
                );
                console.log("Captcha cleared! Resuming extraction...");
                
                // Wait 3 extra seconds to make sure the company list fully loads into the HTML
                await new Promise(r => setTimeout(r, 3000));
            } catch (e) {
                console.log("Timed out waiting for the Captcha to be solved.");
            }
        }
        
        const htmlData = await page.content();
        await page.close();
        return htmlData;
    } catch (error) {
        console.error(`Error loading page ${targetUrl}:`, error.message);
        if (!page.isClosed()) {
            await page.close();
        }
        return null;
    }
}

async function searchCompany(browser, searchTerm, exactCompanyName) {
    try {
        console.log(`\nSearching for: "${searchTerm}" using Puppeteer...`);
        
        const searchUrl = `${BASE_URL}/companies?q=${searchTerm}&type=companies`;
        const htmlData = await fetchWithPuppeteer(browser, searchUrl);

        if (!htmlData) {
            return null;
        }

        const $ = cheerio.load(htmlData);
        
        const pageTitle = $('title').text().trim();
        console.log(`[Debug] Page Title: ${pageTitle}`);

        // FIX: Removed the htmlData.includes('captcha') check!
        if (pageTitle.toLowerCase().includes('security') || pageTitle.toLowerCase().includes('attention') || pageTitle.toLowerCase().includes('haproxy') || pageTitle.toLowerCase().includes('challenge')) {
            console.log("BLOCK: OpenCorporates blocked the request.");
            return null;
        }

        let foundUrl = null;
        let companiesFound = 0;

        $('#companies .search-result.company').each((index, element) => {
            companiesFound++;
            const companyLink = $(element).find('.company_search_result');
            const companyName = companyLink.text().trim();
            
            const cleanFoundName = companyName.toLowerCase().replace(/[,.]/g, '');
            const cleanTargetName = exactCompanyName.toLowerCase().replace(/[,.]/g, '');

            if (cleanFoundName === cleanTargetName) {
                foundUrl = `${BASE_URL}${companyLink.attr('href')}`;
            }
        });

        if (companiesFound === 0) {
            console.log("No companies were found on the page.");
        } else {
            console.log(`Found ${companiesFound} companies on the page.`);
        }

        if (foundUrl) {
            console.log(`Exact match found: ${foundUrl}`);
            return foundUrl;
        } else {
            console.log(`Could not find an exact match for ${exactCompanyName}.`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching search results:", error.message);
        return null;
    }
}

async function scrapeOfficerDetails(browser, officerUrl) {
    try {
        console.log(`  -> Fetching Officer details from: ${officerUrl}`);
        const htmlData = await fetchWithPuppeteer(browser, officerUrl);
        
        if (!htmlData) return null;

        const $ = cheerio.load(htmlData);
        
        const officerName = $('h1.wrapping_heading').text().trim() || $('h1').first().text().trim() || "Unknown";
        
        const officerData = {
            officerUrl: officerUrl,
            officerName: officerName
        };

        $('dl.attributes dt').each((index, element) => {
            const key = $(element).text().trim().replace(':', '');
            const valueNode = $(element).next('dd');
            let value = valueNode.text().trim().replace(/\s\s+/g, ' '); 
            
            if (key && value) {
                officerData[key] = value;
            }
        });

        return officerData;

    } catch (error) {
        console.error(`  Failed to fetch officer at ${officerUrl}:`, error.message);
        return null;
    }
}

async function scrapeCompanyDetails(browser, companyUrl) {
    try {
        console.log(`\nScraping company data from: ${companyUrl}...`);
        const htmlData = await fetchWithPuppeteer(browser, companyUrl);
        
        if (!htmlData) return null;

        const $ = cheerio.load(htmlData);

        const companyData = {
            sourceUrl: companyUrl,
            companyName: $('h1.wrapping_heading').text().trim() || $('h1').first().text().trim(),
            officers: []
        };

        $('dl.attributes dt').each((index, element) => {
            const key = $(element).text().trim().replace(':', '');
            const valueNode = $(element).next('dd');
            let value = valueNode.text().trim().replace(/\s\s+/g, ' '); 
            
            if (key && value) {
                companyData[key] = value;
            }
        });

        const officerLinks = [];
        $('a[href*="/officers/"]').each((index, element) => {
            const officerHref = $(element).attr('href');
            const fullUrl = officerHref.startsWith('http') ? officerHref : `${BASE_URL}${officerHref}`;
            
            if (!officerLinks.includes(fullUrl)) {
                officerLinks.push(fullUrl);
            }
        });

        console.log(`Found ${officerLinks.length} unique officer links. Extracting...`);

        for (let i = 0; i < officerLinks.length; i++) {
            const officerInfo = await scrapeOfficerDetails(browser, officerLinks[i]);
            if (officerInfo) {
                companyData.officers.push(officerInfo);
            }
        }

        return companyData;

    } catch (error) {
         console.error("Error scraping company page:", error.message);
    }
}

async function run() {
    console.log("Starting Puppeteer Data Extractor...");
    const browser = await puppeteer.launch({ 
        headless: false, 
        args: ['--no-sandbox', '--disable-web-security'] 
    });

    const url = await searchCompany(browser, "skief", "SKIEF LABS CORP");
    if (url) {
        const finalData = await scrapeCompanyDetails(browser, url);
        
        const filename = 'skief_labs_extract.json';
        fs.writeFileSync(filename, JSON.stringify(finalData, null, 4));
        
        console.log(`\nSuccessfully completed full extraction.`);
        console.log(`Data saved to: ${filename}`);
    }
    
    console.log("Closing browser...");
    await browser.close();
}

run();