const fs = require('fs');
const path = require('path');
const { searchProfiles, getProfileDetails } = require('./src/services/client');
const { parseAndMerge } = require('./src/parser/parsers');

const STATE_FILE = path.join(__dirname, 'state.json');

function loadState() {
    if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')).skip;
    }
    return 0;
}

function saveState(currentSkip) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ skip: currentSkip }, null, 2));
}

async function main() {
    const domain = 'azsvmeb.portalus.thentiacloud.net';
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const jsonlPath = path.join(outputDir, `output_${domain}_2026.jsonl`);
    const csvPath = path.join(outputDir, `output_${domain}_2026.csv`);

    let skip = loadState(); 
    const take = 20;
    const burstLimit = skip + 500; 

    // Automated header logic
    if (skip === 0 && !fs.existsSync(csvPath)) {
        const headers = "fullName,firstName,lastName,licenseNumber,licenseType,licenseStatus,licenseExpiryDate,education,practiceSites,scrapedAt,sourceUrl,currentPageUrl\n";
        fs.writeFileSync(csvPath, headers);
        console.log("--- Created fresh CSV with verified dynamic headers ---");
    }

    console.log(`--- [STARTING FINAL GOLD RUN] Current Skip: ${skip} | Target: ${burstLimit} ---`);

    while (skip < burstLimit) {
        const searchResults = await searchProfiles(skip, take);
        const results = searchResults?.result?.dataResults;

        if (!results || results.length === 0) break;

        for (const summary of results) {
            const wait = Math.floor(Math.random() * 5000) + 15000;
            console.log(`Waiting ${wait/1000}s for Profile ${summary.id}...`);
            await new Promise(r => setTimeout(r, wait));

            const details = await getProfileDetails(summary.id);
            if (details) {
                const { jsonl, csv } = parseAndMerge(summary, details, 'https://azsvmeb.portalus.thentiacloud.net/webs/portal/register/#/');
                
                // Save the full raw data to JSONL
                fs.appendFileSync(jsonlPath, JSON.stringify(jsonl) + '\n');
                
                // --- DYNAMIC SEARCH LOGIC ---
                // We search all flattened keys for partial matches to extract the data 
                // regardless of dots, underscores, or camelCasing.
                const allKeys = Object.keys(csv);
                
                const educationKey = allKeys.find(k => k.toLowerCase().includes('education0'));
                const educationValue = educationKey ? csv[educationKey] : "None Listed";

                const practiceKey = allKeys.find(k => k.toLowerCase().includes('practicesites0'));
                const practiceValue = practiceKey ? csv[practiceKey] : "None Listed";
                
                const values = [
                    csv["fullName"],
                    csv["firstName"],
                    csv["lastName"],
                    csv["licenseNumber"],
                    csv["licenseType"],
                    csv["licenseStatus"],
                    csv["licenseExpiryDate"],
                    educationValue,
                    practiceValue,
                    csv["scrapedAt"],
                    csv["sourceUrl"],
                    csv["currentPageUrl"]
                ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',');
                
                fs.appendFileSync(csvPath, values + '\n');
            }
        }

        skip += take;
        saveState(skip);
        console.log(`--- Progress Saved: ${skip} records complete ---`);
    }
    console.log(`\n✅ BURST FINISHED. Current record: ${skip}.`);
}

main().catch(err => console.error('Critical Error:', err));