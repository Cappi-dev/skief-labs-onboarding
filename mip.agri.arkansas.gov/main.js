const { searchByState, getProfileDetails, stateAbbreviations } = require('./src/services/client');
const { parseAndMerge } = require('./src/parser/parsers');
const fs = require('fs');
const { Parser } = require('json2csv');

const SOURCE_HOST = 'mip.agri.arkansas.gov';
const STATE_FILE = 'state_ar.json';
const OUTPUT_JSONL = `output/output_${SOURCE_HOST}_2026.jsonl`;
const OUTPUT_CSV = `output/output_${SOURCE_HOST}_2026.csv`;

// EXACT HEADER ORDER REQUIRED
const csvFields = [
    'licenseNumber', 'firstName', 'lastName', 'fullName', 'licenseType', 
    'licenseStatus', 'city', 'state', 'zipCode', 'expirationDate',
    'scrapedAt', 'sourceUrl', 'profileUrl'
];

const saveProgress = (stateIndex) => fs.writeFileSync(STATE_FILE, JSON.stringify({ lastStateIndex: stateIndex }, null, 2));
const loadProgress = () => {
    if (fs.existsSync(STATE_FILE)) {
        try { return JSON.parse(fs.readFileSync(STATE_FILE)).lastStateIndex; } catch (e) { return 0; }
    }
    return 0;
};

const getExistingIds = () => {
    if (!fs.existsSync(OUTPUT_JSONL)) return new Set();
    const lines = fs.readFileSync(OUTPUT_JSONL, 'utf-8').trim().split('\n');
    return new Set(lines.map(line => JSON.parse(line).licenseNumber));
};

const syncCsv = () => {
    try {
        if (!fs.existsSync(OUTPUT_JSONL)) return;
        const lines = fs.readFileSync(OUTPUT_JSONL, 'utf-8').trim().split('\n');
        const records = lines.map(line => {
            const obj = JSON.parse(line);
            const csvObj = {};
            csvFields.forEach(f => csvObj[f] = obj[f] || "");
            return csvObj;
        });
        const parser = new Parser({ fields: csvFields });
        fs.writeFileSync(OUTPUT_CSV, parser.parse(records));
    } catch (e) { console.error('⚠️ CSV Sync Error:', e.message); }
};

async function runArkansasScraper() {
    if (!fs.existsSync('output')) fs.mkdirSync('output');
    
    let stateIndex = loadProgress();
    const scrapedIds = getExistingIds();

    for (let i = stateIndex; i < stateAbbreviations.length; i++) {
        const stateCode = stateAbbreviations[i];
        console.log(`\n📡 Searching state: ${stateCode} [${i + 1}/${stateAbbreviations.length}]`);
        
        const searchResponse = await searchByState(stateCode);
        const profiles = searchResponse?.data || [];
        
        console.log(`📊 Found ${profiles.length} profiles.`);

        for (const summary of profiles) {
            // Using licenseNumber as the ID for the profile request based on sample
            const id = summary.licenseNumber;

            if (scrapedIds.has(id)) continue; 

            console.log(`🔍 Scraping Profile ID: ${id}`);
            
            let details = null;
            let retries = 0;
            while (retries < 3) {
                details = await getProfileDetails(id);
                if (details) break;
                retries++;
                await new Promise(r => setTimeout(r, 5000));
            }

            if (details) {
                const { jsonl } = parseAndMerge(summary, details, SOURCE_HOST);
                fs.appendFileSync(OUTPUT_JSONL, JSON.stringify(jsonl) + '\n');
                scrapedIds.add(id);
                console.log(`✅ Saved: ${jsonl.fullName}`);
            }

            await new Promise(r => setTimeout(r, 2000)); // Delay to be safe
        }

        syncCsv();
        saveProgress(i + 1);
        console.log(`🏁 Completed State: ${stateCode}`);
    }
    console.log('\n✨ ALL TASKS COMPLETED!');
}

runArkansasScraper();