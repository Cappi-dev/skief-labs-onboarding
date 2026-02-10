const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const { parseNYHtml } = require('./src/parser/parsers');
const { Parser } = require('json2csv');

puppeteer.use(StealthPlugin());

const STATE_FILE = './state.json';
const OUTPUT_DIR = './output';
const pad = (n) => n.toString().padStart(6, '0');

// Unified Filename Configuration
const jsonlPath = `${OUTPUT_DIR}/nysed_output_2026.jsonl`;
const csvPath = `${OUTPUT_DIR}/nysed_output_2026.csv`;

async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

    const browser = await puppeteer.launch({ headless: "new" }); 
    const page = await browser.newPage();

    let state = fs.existsSync(STATE_FILE) 
        ? JSON.parse(fs.readFileSync(STATE_FILE)) 
        : { professionIndex: 0, currentLicense: 1, consecutiveEmpty: 0 };

    const professions = [
        { code: "075", name: "Veterinarian" }, 
        { code: "074", name: "Limited_License" }
    ];

    for (let i = state.professionIndex; i < professions.length; i++) {
        const profession = professions[i];
        state.professionIndex = i;

        console.log(`🚀 STARTING: ${profession.name} at License #${state.currentLicense}`);

        while (state.consecutiveEmpty < 50) {
            const currentPadded = pad(state.currentLicense);
            const targetUrl = `https://eservices.nysed.gov/professions/verification-search?licenseNumber=${currentPadded}&professionCode=${profession.code}`;
            
            console.log(`🕵️ Searching ${profession.name} #${currentPadded}...`);

            try {
                await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                
                // Wait for modal load
                await page.waitForFunction(() => {
                    const el = document.querySelector('#name');
                    return el && el.innerText.trim().length > 0;
                }, { timeout: 8000 }).catch(() => {});

                // ACTION: Click Enforcement Tab and Capture Status
                const enforcementTab = await page.$('#licenseeEnforcementActionTab');
                let enforcementText = "No Enforcement Actions Found";

                if (enforcementTab) {
                    await enforcementTab.click();
                    await new Promise(r => setTimeout(r, 1000));
                    
                    enforcementText = await page.evaluate(() => {
                        const body = document.querySelector('.card-body');
                        if (!body) return "No Enforcement Actions Found";
                        
                        let text = body.innerText.trim();
                        // CLEANING: Regex removes redundant labels like "Profession:" or "License Number:"
                        text = text.replace(/Profession:[\s\S]*?License Number:[\s\S]*?\d{6}/g, '').trim();
                        
                        return text === "" || text.toLowerCase().includes('not applicable') 
                            ? "No Enforcement Actions Found" 
                            : text;
                    });

                    // Return to Info Tab
                    await page.click('#licenseeInfoTab');
                    await new Promise(r => setTimeout(r, 500));
                }

                const html = await page.content();
                const record = parseNYHtml(html, profession.code, enforcementText);

                if (record) {
                    // Unified append to nysed_output_2026 files
                    fs.appendFileSync(jsonlPath, JSON.stringify(record) + '\n');
                    generateCSV(jsonlPath, csvPath);
                    console.log(`   ✅ SAVED TO nysed_output_2026: ${record.fullName}`);
                    state.consecutiveEmpty = 0;
                } else {
                    state.consecutiveEmpty++;
                    console.log(`   ❌ Empty (${state.consecutiveEmpty}/50)`);
                }
            } catch (err) {
                state.consecutiveEmpty++;
                console.log(`   ⚠️ Timeout/Error at ${currentPadded}`);
            }

            state.currentLicense++;
            fs.writeFileSync(STATE_FILE, JSON.stringify(state));
            
            // Random human delay
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
        }
        
        // Reset for the next profession loop
        state.currentLicense = 1;
        state.consecutiveEmpty = 0;
        fs.writeFileSync(STATE_FILE, JSON.stringify(state));
    }
    await browser.close();
    console.log("🏁 EXTRACTION FINISHED. Master file: nysed_output_2026.csv");
}

function generateCSV(jsonlPath, csvPath) {
    try {
        if (!fs.existsSync(jsonlPath)) return;
        const lines = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n');
        const data = lines.map(l => JSON.parse(l));
        const csv = new Parser().parse(data);
        fs.writeFileSync(csvPath, csv);
    } catch (e) {}
}

run().catch(console.error);