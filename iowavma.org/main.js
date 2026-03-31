const puppeteer = require('puppeteer');
const fs = require('fs');

const TARGET_URLS = [
    { url: "https://www.iowavma.org/content.asp?contentid=240", type: "Relief Vet" },
    { url: "https://www.iowavma.org/content.asp?contentid=352", type: "Relief Tech" },
    { url: "https://www.iowavma.org/content.asp?contentid=242", type: "Clinic Wanted Ad" },
    { url: "https://www.iowavma.org/content.asp?contentid=243", type: "Vet Tech Wanted Ad" },
    { url: "https://www.iowavma.org/content.asp?contentid=244", type: "Clinic Staff Wanted Ad" }
];

const CSV_FILE = 'iowa_vets.csv';
const JSONL_FILE = 'iowa_vets.jsonl';

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

async function scrapeIowa() {
    console.log("Starting Iowa Classifieds Scraper...");

    // Delete the old bad file if it exists so we start fresh
    if (fs.existsSync(CSV_FILE)) {
        fs.unlinkSync(CSV_FILE);
    }
    if (fs.existsSync(JSONL_FILE)) {
        fs.unlinkSync(JSONL_FILE);
    }

    const headers = "vetName,clinicName,phone,mobilePhone,email,location,sourceUrl,scrapedAt\n";
    fs.writeFileSync(CSV_FILE, headers);

    const browser = await puppeteer.launch({ 
        headless: false, 
        args: ['--no-sandbox', '--disable-web-security'] 
    });
    
    const page = await browser.newPage();
    const scrapedAt = new Date().toISOString();

    try {
        await page.setViewport({ width: 1280, height: 1000 });

        for (let i = 0; i < TARGET_URLS.length; i++) {
            const currentTarget = TARGET_URLS[i];
            console.log(`\nLoading Page: ${currentTarget.type}...`);
            await page.goto(currentTarget.url, { waitUntil: 'networkidle2' });

            const rowsData = await page.evaluate((url, type, time) => {
                // Grab all text on the page and split it by double-enters (paragraphs)
                const pageText = document.body.innerText;
                const textChunks = pageText.split(/\n\s*\n/);
                const data = [];
                
                textChunks.forEach(chunk => {
                    const text = chunk.trim();

                    // Skip the disclaimer text
                    if (text.includes("The IVMA lists the relief veterinarians as a service") || 
                        text.includes("Their inclusion on this list does not indicate endorsement")) {
                        return;
                    }

                    // A valid ad usually has an email or phone number
                    if (text.length > 20 && (text.includes('@') || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(text))) {
                        
                        const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
                        const phone = phoneMatch ? phoneMatch[0] : "";
                        
                        const emailMatch = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/);
                        const email = emailMatch ? emailMatch[0] : "";

                        let vetName = "N/A";
                        let clinicName = "N/A";

                        if (type.includes("Wanted Ad")) {
                            // For clinics, the first line or sentence usually has the clinic name
                            const firstSentence = text.split('.')[0];
                            clinicName = firstSentence.substring(0, 100); 
                            vetName = "N/A";
                        } else {
                            // For Relief Vets/Techs, the first part of the text is usually their name
                            vetName = text.split(/\n|,|\(/)[0].replace(/Dr\.\s*/i, '').trim();
                            clinicName = type;
                        }

                        data.push({
                            vetName: vetName,
                            clinicName: clinicName,
                            phone: phone,
                            mobilePhone: "",
                            email: email,
                            location: "N/A",
                            sourceUrl: url,
                            scrapedAt: time
                        });
                    }
                });
                
                // Remove duplicates
                const uniqueData = [];
                const seenKeys = new Set();
                data.forEach(item => {
                    const key = item.email + item.phone + item.vetName;
                    if (!seenKeys.has(key) && (item.email || item.phone)) {
                        seenKeys.add(key);
                        uniqueData.push(item);
                    }
                });

                return uniqueData;
            }, currentTarget.url, currentTarget.type, scrapedAt);

            console.log(`Found ${rowsData.length} unique ads on this page.`);

            for (let j = 0; j < rowsData.length; j++) {
                process.stdout.write(`Saving record ${j + 1} of ${rowsData.length}...\r`);
                appendToFile(rowsData[j]);
            }
            console.log(""); 
        }

        console.log(`\nFinished successfully. All pages processed.`);

    } catch (error) {
        console.error("\nError:", error.message);
    } finally {
        await browser.close();
    }
}

scrapeIowa();