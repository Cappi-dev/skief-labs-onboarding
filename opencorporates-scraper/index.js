require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = 'https://opencorporates.com';

// Dynamically read the cookie from the Session Manager's output
let sessionCookie = '';
try {
    const cookieData = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
    sessionCookie = cookieData.cookie;
    console.log("Successfully loaded session cookie from cookies.json");
} catch (error) {
    console.error("Could not read cookies.json. Please run sessionManager.js first.");
    process.exit(1); 
}

const axiosConfig = {
    headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'cookie': sessionCookie,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
    }
};

async function searchCompany(searchTerm, exactCompanyName) {
    try {
        console.log(`\nSearching for: "${searchTerm}"...`);
        const response = await axios.get(`${BASE_URL}/companies`, {
            params: { q: searchTerm, type: 'companies' },
            ...axiosConfig
        });

        const $ = cheerio.load(response.data);
        let foundUrl = null;

        $('#companies .search-result.company').each((index, element) => {
            const companyLink = $(element).find('.company_search_result');
            const companyName = companyLink.text().trim();
            if (companyName.toLowerCase() === exactCompanyName.toLowerCase()) {
                foundUrl = `${BASE_URL}${companyLink.attr('href')}`;
            }
        });

        if (foundUrl) {
            console.log(`Found Company URL: ${foundUrl}`);
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

async function scrapeOfficerDetails(officerUrl) {
    try {
        console.log(`  -> Fetching Officer details from: ${officerUrl}`);
        const response = await axios.get(officerUrl, axiosConfig);
        const $ = cheerio.load(response.data);
        
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

async function scrapeCompanyDetails(companyUrl) {
    try {
        console.log(`\nScraping company data from: ${companyUrl}...`);
        const response = await axios.get(companyUrl, axiosConfig);
        const $ = cheerio.load(response.data);

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
            const officerInfo = await scrapeOfficerDetails(officerLinks[i]);
            if (officerInfo) {
                companyData.officers.push(officerInfo);
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        return companyData;

    } catch (error) {
         console.error("Error scraping company page:", error.message);
    }
}

async function run() {
    const url = await searchCompany("skief", "SKIEF LABS CORP");
    if (url) {
        const finalData = await scrapeCompanyDetails(url);
        
        const filename = 'skief_labs_extract.json';
        fs.writeFileSync(filename, JSON.stringify(finalData, null, 4));
        
        console.log(`\nSuccessfully completed full extraction!`);
        console.log(`Data saved to: ${filename}`);
    }
}

run();