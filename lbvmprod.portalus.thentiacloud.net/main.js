const { searchProfiles, getProfileDetails } = require('./src/services/client');
const { parseAndMerge } = require('./src/parser/parsers');
const fs = require('fs');
const { Parser } = require('json2csv');

const SOURCE_HOST = 'lbvmprod.portalus.thentiacloud.net';
const STATE_FILE = 'state.json';
const MASTER_LIST_CACHE = 'master_list.json'; 
const OUTPUT_JSONL = `output/output_${SOURCE_HOST}_2026.jsonl`;
const OUTPUT_CSV = `output/output_${SOURCE_HOST}_2026.csv`;

const csvFields = [
    'licenseNumber', 'firstName', 'lastName', 'fullName', 'city', 'state', 'zipCode', 
    'licenseType', 'licenseStatus', 'initialRegistrationDate', 'expirationDate', 
    'publicDisciplinaryActions', 'scrapedAt', 'sourceUrl', 'profileUrl'
];

const jitter = () => {
    const seconds = Math.floor(Math.random() * (18 - 15 + 1) + 15);
    console.log(`⏱️ Human Delay: Waiting ${seconds}s...`);
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
};

// This function now runs after every record
const syncCsv = () => {
    try {
        if (!fs.existsSync(OUTPUT_JSONL)) return;
        const lines = fs.readFileSync(OUTPUT_JSONL, 'utf-8').trim().split('\n').filter(l => l.trim());
        const records = lines.map(line => {
            const obj = JSON.parse(line);
            const csvObj = {};
            csvFields.forEach(f => {
                // Requirement 3: Ensure the array is stringified for the CSV cell
                csvObj[f] = f === 'publicDisciplinaryActions' ? JSON.stringify(obj[f] || []) : (obj[f] || "");
            });
            return csvObj;
        });
        const parser = new Parser({ fields: csvFields });
        fs.writeFileSync(OUTPUT_CSV, parser.parse(records));
        console.log(`📊 CSV Updated.`);
    } catch (e) { console.error('⚠️ CSV Sync Error:', e.message); }
};

async function run() {
    if (!fs.existsSync('output')) fs.mkdirSync('output');
    let all = [];

    // Master List Logic
    if (fs.existsSync(MASTER_LIST_CACHE)) {
        console.log('📦 Loading Master List from cache...');
        all = JSON.parse(fs.readFileSync(MASTER_LIST_CACHE));
    } else {
        console.log('📡 Fetching Master List (One-time)...');
        let skip = 0;
        while (true) {
            const res = await searchProfiles(skip, 20); 
            const batch = res?.result?.dataResults || [];
            if (batch.length === 0) break;
            all = all.concat(batch);
            process.stdout.write(`| Total Records Found: ${all.length} \r`);
            skip += 20;
            if (skip > 7500) break; 
            await new Promise(r => setTimeout(r, 500)); 
        }
        fs.writeFileSync(MASTER_LIST_CACHE, JSON.stringify(all));
    }

    let start = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE)).lastIndex : 0;
    console.log(`🚀 Resuming from index: ${start}`);

    for (let i = start; i < all.length; i++) {
        const summary = all[i];
        let details = await getProfileDetails(summary.id);

        if (details === '429') {
            console.log('\n🛑 Blocked! Waiting 90s...');
            await new Promise(r => setTimeout(r, 90000));
            i--; 
            continue; 
        }

        if (details) {
            const { jsonl } = parseAndMerge(summary, details, SOURCE_HOST);
            fs.appendFileSync(OUTPUT_JSONL, JSON.stringify(jsonl) + '\n');
            
            // --- INSTANT SYNC ---
            syncCsv(); 
            
            fs.writeFileSync(STATE_FILE, JSON.stringify({ lastIndex: i + 1 }));
            console.log(`[${i + 1}/${all.length}] Saved: ${jsonl.fullName}`);
        }

        await jitter();
    }
    
    console.log('\n🏁 FINISHED!');
}

run();