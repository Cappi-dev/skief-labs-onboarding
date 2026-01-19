const { searchProfiles, getProfileDetails } = require('./src/services/client');
const { parseAndMerge } = require('./src/parser/parsers');
const fs = require('fs');
const { Parser } = require('json2csv');

const SOURCE_HOST = 'lbvmprod.portalus.thentiacloud.net';
const STATE_FILE = 'state.json';
const OUTPUT_JSONL = `output/output_${SOURCE_HOST}_2026.jsonl`;
const OUTPUT_CSV = `output/output_${SOURCE_HOST}_2026.csv`;

// LOCKED COLUMN ORDER FOR EXCEL (Column A is licenseNumber)
const csvFields = [
    'licenseNumber', 
    'firstName', 
    'lastName', 
    'city', 
    'state', 
    'zipCode', 
    'licenseType', 
    'licenseStatus', 
    'initialDate', 
    'expirationDate', 
    'fullName', 
    'scrapedAt', 
    'sourceUrl', 
    'profileUrl'
];

const jitter = () => {
    const ms = Math.floor(Math.random() * (18000 - 12000 + 1) + 12000);
    console.log(`⏱️ Human Delay: Waiting ${Math.round(ms/1000)}s...`);
    return new Promise(resolve => setTimeout(resolve, ms));
};

const syncCsv = () => {
    try {
        if (!fs.existsSync(OUTPUT_JSONL)) return;
        const lines = fs.readFileSync(OUTPUT_JSONL, 'utf-8').trim().split('\n');
        const records = lines.map(line => {
            const obj = JSON.parse(line);
            const csvObj = {};
            // Force the field order and skip rawHTML
            csvFields.forEach(f => {
                csvObj[f] = obj[f] || "";
            });
            return csvObj;
        });
        const parser = new Parser({ fields: csvFields });
        fs.writeFileSync(OUTPUT_CSV, parser.parse(records));
    } catch (e) { console.error('⚠️ CSV Sync Error:', e.message); }
};

const saveState = (index) => fs.writeFileSync(STATE_FILE, JSON.stringify({ lastIndex: index }, null, 2));
const loadState = () => {
    if (fs.existsSync(STATE_FILE)) {
        try { return JSON.parse(fs.readFileSync(STATE_FILE)).lastIndex; } catch (e) { return 0; }
    }
    return 0;
};

async function runScraper() {
    if (!fs.existsSync('output')) fs.mkdirSync('output');
    
    let startIndex = loadState();
    console.log('📡 Fetching Master List...');
    const searchResponse = await searchProfiles(0, 6000); 
    const profiles = searchResponse?.result?.dataResults || [];
    console.log(`✅ Ready to process ${profiles.length - startIndex} remaining records.`);

    for (let i = startIndex; i < profiles.length; i++) {
        const summary = profiles[i];
        console.log(`🔍 [${i + 1}/${profiles.length}] Scraping: ${summary.id}`);

        let details = null;
        let attempts = 0;
        const maxRetries = 3; 

        while (attempts < maxRetries) {
            try {
                details = await getProfileDetails(summary.id);
                
                if (details === '429') {
                    console.log('🛑 429 Blocked! Cooldown for 60s...');
                    await new Promise(r => setTimeout(r, 60000));
                    attempts = 0;
                    continue; 
                }

                if (!details) {
                    attempts++;
                    if (attempts < maxRetries) {
                        console.log(`⚠️ Attempt ${attempts} failed (500). Retrying in 5s...`);
                        await new Promise(r => setTimeout(r, 5000));
                        continue;
                    }
                    break; 
                }
                break; 

            } catch (err) {
                attempts++;
                if (attempts < maxRetries) await new Promise(r => setTimeout(r, 5000));
            }
        }

        if (!details) {
            console.log(`❌ Skipped record: ${summary.id}`);
            saveState(i + 1);
            continue;
        }

        try {
            const { jsonl } = parseAndMerge(summary, details, SOURCE_HOST);
            fs.appendFileSync(OUTPUT_JSONL, JSON.stringify(jsonl) + '\n');
            syncCsv();
            saveState(i + 1);
            console.log(`✅ Saved: ${jsonl.fullName}`);
            await jitter();
        } catch (err) {
            console.error(`❌ Error at index ${i}:`, err.message);
        }
    }
    console.log('\n🏁 FINISHED! Files are in the output folder.');
}

runScraper();