const puppeteer = require('puppeteer');
const fs = require('fs');

const START_URL = "https://members.gvma.net/membership/FindAVetDirectory";
const CSV_FILE = 'output_members.gvma.net_2026.csv';
const JSONL_FILE = 'output_members.gvma.net_2026.jsonl';

function appendToFile(data) {
    fs.appendFileSync(JSONL_FILE, JSON.stringify(data) + '\n');
    const headers = ["vetName", "clinicName", "phone", "mobilePhone", "email", "location", "sourceUrl", "scrapedAt"];
    const row = headers.map(h => `"${(data[h] || "").toString().replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(',');
    fs.appendFileSync(CSV_FILE, row + '\n');
}

async function scrapeGeorgia() {
    console.log("Launching Georgia Profile Scraper...");

    if (!fs.existsSync(CSV_FILE)) {
        fs.writeFileSync(CSV_FILE, "vetName,clinicName,phone,mobilePhone,email,location,sourceUrl,scrapedAt\n");
    }

    const browser = await puppeteer.launch({ 
        headless: false, 
        args: ['--no-sandbox', '--disable-web-security'] 
    });
    
    const page = await browser.newPage();
    const scrapedAt = new Date().toISOString();

    try {
        await page.setViewport({ width: 1280, height: 1000 });
        console.log("Loading Georgia page...");
        await page.goto(START_URL, { waitUntil: 'networkidle2' });

        console.log("Waiting 10 seconds for the page to load completely...");
        await new Promise(r => setTimeout(r, 10000));

        console.log("Looking for the Search button...");
        const clickedSearch = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const searchBtn = buttons.find(b => b.innerText.toLowerCase().includes('search'));
            if (searchBtn) {
                searchBtn.click();
                return true;
            }
            return false;
        });

        if (clickedSearch) {
            console.log("Clicked Search button. Waiting 10 seconds for results to appear...");
            await new Promise(r => setTimeout(r, 10000));
        } else {
            console.log("Could not find a Search button. Continuing anyway...");
        }

        console.log("Looking for View Full Profile links...");
        const profileLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            return [...new Set(links
                .filter(a => a.innerText.toLowerCase().includes('view full profile'))
                .map(a => a.href)
            )];
        });

        if (profileLinks.length === 0) {
            console.log("No profile links found. The data is either empty or hidden.");
            console.log("We should skip this website.");
            await browser.close();
            return;
        }

        console.log(`Found ${profileLinks.length} profiles to check. Starting deep dive...`);

        for (let i = 0; i < profileLinks.length; i++) {
            const url = profileLinks[i];
            process.stdout.write(`Checking profile ${i + 1} of ${profileLinks.length}...\r`);
            
            const detailPage = await browser.newPage();
            try {
                await detailPage.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                
                const data = await detailPage.evaluate((sourceUrl, time) => {
                    const pageText = document.body.innerText;
                    
                    const nameEl = document.querySelector('h1, h2');
                    const name = nameEl ? nameEl.innerText.trim() : "Unknown";
                    
                    const phoneMatch = pageText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
                    const emailMatch = pageText.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/);
                    
                    return {
                        vetName: name,
                        clinicName: "N/A",
                        phone: phoneMatch ? phoneMatch[0] : "",
                        mobilePhone: "",
                        email: emailMatch ? emailMatch[0] : "",
                        location: "N/A",
                        sourceUrl: sourceUrl,
                        scrapedAt: time
                    };
                }, url, scrapedAt);

                appendToFile(data);
                await detailPage.close();
                await new Promise(r => setTimeout(r, 1000)); 
            } catch (err) {
                await detailPage.close();
            }
        }

        console.log(`\nFinished checking profiles. Please review the CSV file.`);

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await browser.close();
    }
}

scrapeGeorgia();