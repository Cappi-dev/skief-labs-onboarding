const fs = require('fs');
const path = require('path');
const { initSession, searchProfiles, getProfileDetails } = require('./src/services/client');
const { parseAndMerge } = require('./src/parser/parsers');
const { Parser } = require('json2csv');

const STATE_FILE = path.join(__dirname, 'state.json');
const domain = 'msbvm.portalus.thentiacloud.net';

const csvFields = [
    'licenseNumber', 'firstName', 'middleName', 'lastName', 'suffix', 
    'fullName', 'licenseType', 'licenseStatus', 'disciplinaryAction', 
    'initialDate', 'expiryDate', 'practiceSites', 'profileUrl', 
    'scrapedAt', 'sourceUrl' // Standardized Footer Fields
];

async function main() {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const jsonlPath = path.join(outputDir, `output_msbvm_2026.jsonl`);
    const csvPath = path.join(outputDir, `output_msbvm_2026.csv`);

    let state = { skip: 0 };
    if (fs.existsSync(STATE_FILE)) {
        const content = fs.readFileSync(STATE_FILE, 'utf8');
        if (content.trim()) state = JSON.parse(content);
    }
    
    let skip = state.skip;
    await initSession();

    while (true) {
        console.log(`📡 Fetching search: skip ${skip}...`);
        const searchData = await searchProfiles(skip, 20);
        const results = searchData?.result?.dataResults;
        if (!results || results.length === 0) break;

        for (const summary of results) {
            const wait = Math.floor(Math.random() * 3000) + 15000; 
            console.log(`⏱️ Waiting ${wait/1000}s for Profile ${summary.id}...`);
            await new Promise(r => setTimeout(r, wait));

            const details = await getProfileDetails(summary.id);
            if (details) {
                const merged = parseAndMerge(summary, details, domain);
                fs.appendFileSync(jsonlPath, JSON.stringify(merged) + '\n');
                
                try {
                    const lines = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n');
                    const records = lines.map(l => JSON.parse(l));
                    const json2csvParser = new Parser({ fields: csvFields });
                    fs.writeFileSync(csvPath, json2csvParser.parse(records));
                } catch (e) { console.warn("⚠️ CSV busy."); }

                skip++; 
                fs.writeFileSync(STATE_FILE, JSON.stringify({ skip }));
                console.log(`✅ Saved: ${merged.fullName} (${skip})`);
            }
        }
    }
}



main().catch(err => console.error("❌ Fatal Error:", err));