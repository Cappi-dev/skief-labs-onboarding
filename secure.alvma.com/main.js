const puppeteer = require('puppeteer');
const fs = require('fs');

const START_URL = "https://secure.alvma.com/membership/findavet";
const CSV_FILE = 'alabama_vets.csv';
const JSONL_FILE = 'alabama_vets.jsonl';

function appendToFile(data) {
    fs.appendFileSync(JSONL_FILE, JSON.stringify(data) + '\n');
    
    // Keeping your standardized headers. Fields not present on ALVMA will just be blank.
    const headers = [
        "vetName", 
        "clinicName", 
        "practiceCategory", 
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

async function scrapeAlabama() {
    console.log("Launching Alabama Master Scraper...");

    if (!fs.existsSync(CSV_FILE)) {
        const headers = "vetName,clinicName,practiceCategory,phone,mobilePhone,email,location,sourceUrl,scrapedAt\n";
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
        console.log("Loading Alabama Search Page...");
        await page.goto(START_URL, { waitUntil: 'networkidle2' });

        console.log("Extracting all directory rows from the background data...");
        
        // Wait for the table to appear on the page
        await page.waitForSelector('table.tablesorter tbody tr.members_list', { timeout: 30000 });

        // Grab ALL rows at once, bypassing the need to click "Next"
        const rowsData = await page.evaluate((url, time) => {
            // Select all member rows regardless of whether the JavaScript hid them or not
            const rows = Array.from(document.querySelectorAll('table.tablesorter tbody tr.members_list'));
            const data = [];
            
            rows.forEach(row => {
                const nameEl = row.querySelector('.member-span');
                const tds = row.querySelectorAll('td');

                const name = nameEl ? nameEl.innerText.replace('Dr. ', '').trim() : "";
                
                // Column 2 is the Company/Clinic Name
                const clinic = (tds.length > 1 && tds[1]) ? tds[1].innerText.trim() : "";
                
                // Column 3 is the Location
                const locEl = (tds.length > 2 && tds[2]) ? tds[2].querySelector('.member-location p') : null;
                const location = locEl ? locEl.innerText.trim() : "";
                
                // Column 4 is the Practice Category
                const category = (tds.length > 3 && tds[3]) ? tds[3].innerText.trim() : "";

                if (name) {
                    data.push({
                        vetName: name,
                        clinicName: clinic,
                        practiceCategory: category,
                        phone: "",        // Hidden behind member login
                        mobilePhone: "",  // Hidden behind member login
                        email: "",        // Hidden behind member login
                        location: location,
                        sourceUrl: url,
                        scrapedAt: time
                    });
                }
            });
            
            return data;
        }, START_URL, scrapedAt);

        console.log(`Found ${rowsData.length} total profiles.`);

        // Append everything instantly
        for (let i = 0; i < rowsData.length; i++) {
            process.stdout.write(`Saving profile ${i + 1}/${rowsData.length}...\r`);
            appendToFile(rowsData[i]);
        }

        console.log(`\nDONE! Check ${CSV_FILE} and ${JSONL_FILE}.`);

    } catch (error) {
        console.error("\nCritical Error:", error.message);
    } finally {
        await browser.close();
    }
}

scrapeAlabama();