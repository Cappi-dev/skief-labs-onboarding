const puppeteer = require('puppeteer');
const fs = require('fs');

const START_URL = "https://hawaiivetmed.org/business-directory/?wpbdp_view=all_listings";
const CSV_FILE = 'hawaii_vets.csv';
const JSONL_FILE = 'hawaii_vets.jsonl';

function appendToFile(data) {
    fs.appendFileSync(JSONL_FILE, JSON.stringify(data) + '\n');
    
    const headers = [
        "vetName", 
        "clinicName", 
        "phone", 
        "mobilePhone", 
        "email", 
        "location", 
        "sourceUrl", 
        "scrapedAt"
    ];
    
    const row = headers.map(h => `"${(data[h] || "").toString().replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(',');
    fs.appendFileSync(CSV_FILE, row + '\n');
}

async function scrapeHawaii() {
    console.log("Launching Hawaii Master Scraper...");

    if (!fs.existsSync(CSV_FILE)) {
        const headers = "vetName,clinicName,phone,mobilePhone,email,location,sourceUrl,scrapedAt\n";
        fs.writeFileSync(CSV_FILE, headers);
    }

    const browser = await puppeteer.launch({ 
        headless: false, 
        args: ['--no-sandbox', '--disable-web-security'] 
    });
    
    const page = await browser.newPage();
    const scrapedAt = new Date().toISOString();

    try {
        await page.setViewport({ width: 1280, height: 1000 });
        console.log("Loading Hawaii Search Page...");
        await page.goto(START_URL, { waitUntil: 'networkidle2' });

        let pageNum = 1;
        let hasNextPage = true;

        while (hasNextPage) {
            console.log(`\n--- PROCESSING PAGE ${pageNum} ---`);
            
            // Wait for the listings to load
            await page.waitForSelector('.wpbdp-listing', { timeout: 30000 });

            // Extract all profiles on the current page
            const pageData = await page.evaluate((time) => {
                const listings = Array.from(document.querySelectorAll('.wpbdp-listing'));
                const data = [];

                listings.forEach(listing => {
                    const titleEl = listing.querySelector('.listing-title h3 a');
                    const clinicName = titleEl ? titleEl.innerText.trim() : "";
                    const sourceUrl = titleEl ? titleEl.href : "";

                    const phoneEl = listing.querySelector('.wpbdp-field-business_phone_number .value');
                    const phone = phoneEl ? phoneEl.innerText.trim() : "";

                    const addressEl = listing.querySelector('.address-info div');
                    let location = addressEl ? addressEl.innerText.trim() : "";
                    // Clean up address (convert newlines to commas)
                    location = location.replace(/\n/g, ', ');

                    if (clinicName) {
                        data.push({
                            vetName: "", // Left blank since it's a clinic directory
                            clinicName: clinicName,
                            phone: phone,
                            mobilePhone: "",
                            email: "", 
                            location: location,
                            sourceUrl: sourceUrl,
                            scrapedAt: time
                        });
                    }
                });

                return data;
            }, scrapedAt);

            console.log(`Found ${pageData.length} clinics on page ${pageNum}.`);

            // Save data for this page
            for (let i = 0; i < pageData.length; i++) {
                process.stdout.write(`Saving clinic ${i + 1}/${pageData.length}...\r`);
                appendToFile(pageData[i]);
            }

            // Look for the "Next" button and click it
            console.log(`\nChecking for next page...`);
            const nextBtnExists = await page.evaluate(() => {
                const nextLink = document.querySelector('.wpbdp-pagination .next a');
                if (nextLink) {
                    return true;
                }
                return false;
            });

            if (nextBtnExists) {
                pageNum++;
                // Click and wait for the new page to load completely
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle2' }),
                    page.click('.wpbdp-pagination .next a')
                ]);
            } else {
                console.log("No more pages found. Scraping finished.");
                hasNextPage = false;
            }
        }

        console.log(`\nDONE! Check ${CSV_FILE} and ${JSONL_FILE}.`);

    } catch (error) {
        console.error("\nCritical Error:", error.message);
    } finally {
        await browser.close();
    }
}

scrapeHawaii();