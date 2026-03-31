const puppeteer = require('puppeteer');
const fs = require('fs');

const START_URL = "https://ivma.org/classified-ads/relief-veterinarians/";
const CSV_FILE = 'idaho_vets.csv';
const JSONL_FILE = 'idaho_vets.jsonl';

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

async function scrapeIdaho() {
    console.log("Starting Idaho Scraper...");

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
        console.log("Loading Idaho Relief Vets Page...");
        await page.goto(START_URL, { waitUntil: 'networkidle2' });

        console.log("Reading paragraphs on the page...");

        const rowsData = await page.evaluate((url, time) => {
            // Find all paragraph tags inside the main content area
            const paragraphs = Array.from(document.querySelectorAll('.page-content p'));
            const data = [];
            
            paragraphs.forEach(p => {
                const text = p.innerText.trim();
                const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

                // A valid vet profile here usually has at least a few lines of text
                // and includes an email symbol or a phone number pattern
                if (lines.length > 2 && (text.includes('@') || /\d{3}[-.\s]?\d{4}/.test(text))) {
                    
                    // The first line is the name
                    const name = lines[0].replace(/Dr\.\s*/i, '').trim();
                    
                    const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
                    const phone = phoneMatch ? phoneMatch[0] : "";
                    
                    const emailMatch = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/);
                    const email = emailMatch ? emailMatch[0] : "";

                    // The location is usually the third line, right before the phone number
                    let location = "N/A";
                    if (lines.length >= 3 && !lines[2].includes('@') && !/\d{3}[-.\s]?\d{4}/.test(lines[2])) {
                        location = lines[2];
                    }

                    data.push({
                        vetName: name,
                        clinicName: "Relief Veterinarian", // Setting a default since they are relief vets
                        phone: phone,
                        mobilePhone: "",
                        email: email,
                        location: location,
                        sourceUrl: url,
                        scrapedAt: time
                    });
                }
            });
            
            return data;
        }, START_URL, scrapedAt);

        console.log(`Found ${rowsData.length} total profiles.`);

        for (let i = 0; i < rowsData.length; i++) {
            process.stdout.write(`Saving profile ${i + 1} of ${rowsData.length}...\r`);
            appendToFile(rowsData[i]);
        }

        console.log(`\nFinished successfully. Check the output files.`);

    } catch (error) {
        console.error("\nError:", error.message);
    } finally {
        await browser.close();
    }
}

scrapeIdaho();