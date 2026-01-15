const { searchProfiles, getProfileDetails } = require('./src/services/client');
const { parseAndMerge } = require('./src/parser/parsers');
const fs = require('fs');
const { Parser } = require('json2csv'); // Ensure you have: npm install json2csv

const STATE_FILE = 'state.json';
const OUTPUT_JSONL = 'output/louisiana_data.jsonl';
const OUTPUT_CSV = 'output/louisiana_data.csv';
const SOURCE_HOST = 'lbvmprod.portalus.thentiacloud.net';

// Requirement: Automatic Jitter (More human: 12-18 seconds per record)
const jitter = () => {
    const ms = Math.floor(Math.random() * (18000 - 12000 + 1) + 12000);
    console.log(`⏱️ Human Delay: Waiting ${Math.round(ms/1000)}s...`);
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Automatic CSV Sync: Converts current JSONL to CSV instantly
const syncCsv = () => {
    try {
        if (!fs.existsSync(OUTPUT_JSONL)) return;
        const lines = fs.readFileSync(OUTPUT_JSONL, 'utf-8').trim().split('\n');
        const records = lines.map(line => {
            const obj = JSON.parse(line);
            const csvObj = { ...obj };
            delete csvObj.rawHTML; // Keep CSV clean by removing the massive HTML string
            return csvObj;
        });
        const parser = new Parser();
        const csv = parser.parse(records);
        fs.writeFileSync(OUTPUT_CSV, csv);
    } catch (e) {
        console.error('⚠️ CSV Sync Error:', e.message);
    }
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

    // One-by-One Loop
    for (let i = startIndex; i < profiles.length; i++) {
        const summary = profiles[i];
        console.log(`🔍 [${i + 1}/${profiles.length}] Scraping: ${summary.id}`);

        try {
            const details = await getProfileDetails(summary.id);
            
            if (details === '429') {
                console.log('🛑 429 Blocked! Cooldown for 60s...');
                await new Promise(r => setTimeout(r, 60000));
                i--; // Retry this record
                continue;
            }

            if (!details) {
                console.log(`⚠️ Skip: No details for ${summary.id}`);
                continue;
            }

            // Parse and Merge
            const { jsonl } = parseAndMerge(summary, details, SOURCE_HOST);

            // 1. Update JSONL
            fs.appendFileSync(OUTPUT_JSONL, JSON.stringify(jsonl) + '\n');
            
            // 2. Update CSV (Automatic Sync)
            syncCsv();

            // 3. Update State
            saveState(i + 1);
            
            console.log(`✅ Saved: ${jsonl.fullName}`);

            // 4. Wait for Human Jitter
            await jitter();

        } catch (err) {
            console.error(`❌ Error at index ${i}:`, err.message);
            await new Promise(r => setTimeout(r, 10000));
        }
    }
    console.log('\n🏁 FINISHED! All data synced to JSONL and CSV.');
}

runScraper();