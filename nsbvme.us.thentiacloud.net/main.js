const fs = require('fs');
const path = require('path');
const { initSession, searchProfiles, getProfileDetails } = require('./src/services/client');
const { parseAndMerge } = require('./src/parser/parsers');
const { Parser } = require('json2csv');

const STATE_FILE = './state.json';
const OUTPUT_DIR = './output';
const JSONL_PATH = path.join(OUTPUT_DIR, 'output_nsbvme_2026.jsonl');
const CSV_PATH = path.join(OUTPUT_DIR, 'output_nsbvme_2026.csv');

async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    
    let state = { skip: 0 };
    if (fs.existsSync(STATE_FILE)) {
        try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (e) {}
    }

    const sessionOk = await initSession();
    if (!sessionOk) return;

    while (true) {
        console.log(`📡 Fetching profile at Skip ${state.skip}...`);
        const searchData = await searchProfiles(state.skip, 1);
        const results = searchData?.result;

        if (!results || results.length === 0) {
            console.log("🏁 Extraction complete.");
            break;
        }

        const summary = results[0];

        // 15-18 second Humanize Delay
        const delay = Math.floor(Math.random() * 3000) + 15000; 
        console.log(`⏱️ Waiting ${delay/1000}s for ${summary.firstName} ${summary.lastName}...`);
        await new Promise(r => setTimeout(r, delay));

        const detailResponse = await getProfileDetails(summary.id);

        const finalRecord = parseAndMerge(summary, detailResponse);

        // Save immediately
        fs.appendFileSync(JSONL_PATH, JSON.stringify(finalRecord) + '\n');
        
        state.skip += 1;
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

        generateCSV();
        console.log(`✅ Saved: ${finalRecord.fullName} | License: ${finalRecord.licenseNumber}`);
    }
}

function generateCSV() {
    try {
        if (!fs.existsSync(JSONL_PATH)) return;
        const lines = fs.readFileSync(JSONL_PATH, 'utf8').trim().split('\n');
        const records = lines.map(line => JSON.parse(line));
        fs.writeFileSync(CSV_PATH, new Parser().parse(records));
    } catch (err) {
        console.error("⚠️ CSV Error:", err.message);
    }
}

run().catch(console.error);