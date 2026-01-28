const fs = require('fs');
const path = require('path');
const { initSession, searchProfiles, getProfileDetails } = require('./src/services/client');
const { parseAndMerge } = require('./src/parser/parsers');
const { Parser } = require('json2csv');

const STATE_FILE = path.join(__dirname, 'state.json');
const domain = 'ovmeb.us.thentiacloud.net';

async function main() {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const jsonlPath = path.join(outputDir, `output_${domain}.jsonl`);
    const csvPath = path.join(outputDir, `output_${domain}.csv`);

    let state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { skip: 0 };
    let skip = state.skip;

    // Start session handshake
    await initSession();

    while (true) {
        console.log(`📡 Fetching search page (skip: ${skip})...`);
        const searchResults = await searchProfiles(skip, 20);
        const results = searchResults?.result?.dataResults;
        
        if (!results || results.length === 0) {
            console.log("🏁 No records found. Check VPN or search criteria.");
            break;
        }

        for (const summary of results) {
            const wait = Math.floor(Math.random() * 3000) + 15000; 
            console.log(`⏱️ Waiting ${wait/1000}s for Profile ${summary.id}...`);
            await new Promise(r => setTimeout(r, wait));

            const details = await getProfileDetails(summary.id);
            if (details) {
                const { jsonl } = parseAndMerge(summary, details, domain);
                fs.appendFileSync(jsonlPath, JSON.stringify(jsonl) + '\n');
                
                try {
                    const lines = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n');
                    const records = lines.map(l => JSON.parse(l));
                    fs.writeFileSync(csvPath, new Parser().parse(records));
                } catch (e) { console.warn("⚠️ CSV Update Error"); }

                skip++; 
                fs.writeFileSync(STATE_FILE, JSON.stringify({ skip }));
                console.log(`✅ Saved: ${jsonl.fullName} (${skip})`);
            }
        }
    }
}



main().catch(err => {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
});