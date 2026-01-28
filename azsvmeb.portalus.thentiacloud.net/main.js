const fs = require('fs');
const path = require('path');
const { searchProfiles, getProfileDetails } = require('./src/services/client');
const { parseAndMerge } = require('./src/parser/parsers');
const { Parser } = require('json2csv');

const STATE_FILE = path.join(__dirname, 'state.json');
const domain = 'azsvmeb.portalus.thentiacloud.net';

const csvFields = [
    'licenseNumber', 'firstName', 'lastName', 'fullName', 'licenseType', 'licenseStatus', 
    'initialRegistrationDate', 'licenseExpirationDate', 'education', 'practiceSites',
    'publicDisciplinaryActions', 'scrapedAt', 'sourceUrl', 'profileUrl'
];

async function main() {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const jsonlPath = path.join(outputDir, `output_${domain}_2026.jsonl`);
    const csvPath = path.join(outputDir, `output_${domain}_2026.csv`);

    // Load state record-by-record
    let state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { skip: 0 };
    let skip = state.skip;
    const take = 20;

    console.log(`🚀 [AZ START] Resuming from Skip: ${skip}`);

    while (true) {
        // We use skip as the starting point for the search
        const searchResults = await searchProfiles(skip, take);
        const results = searchResults?.result?.dataResults;
        
        if (!results || results.length === 0) {
            console.log("🏁 No more records found.");
            break;
        }

        for (const summary of results) {
            // UPDATED RANDOMIZER: 15 - 18 seconds
            const wait = Math.floor(Math.random() * 3000) + 15000;
            console.log(`⏱️ Waiting ${wait/1000}s for Profile ${summary.id}...`);
            await new Promise(r => setTimeout(r, wait));

            const details = await getProfileDetails(summary.id);
            if (details) {
                const { jsonl } = parseAndMerge(summary, details, domain);
                
                // Append to JSONL
                fs.appendFileSync(jsonlPath, JSON.stringify(jsonl) + '\n');
                
                // Regenerate CSV for instant sync
                const lines = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n');
                const records = lines.map(line => {
                    const obj = JSON.parse(line);
                    return {
                        ...obj,
                        publicDisciplinaryActions: JSON.stringify(obj.publicDisciplinaryActions || [])
                    };
                });
                
                const csvParser = new Parser({ fields: csvFields });
                fs.writeFileSync(csvPath, csvParser.parse(records));

                // UPDATE STATE IMMEDIATELY
                skip++; 
                fs.writeFileSync(STATE_FILE, JSON.stringify({ skip }));

                console.log(`✅ Saved & State Updated: ${jsonl.fullName} (Total: ${skip})`);
            }
        }
    }
}

main().catch(err => console.error('Critical Error:', err));