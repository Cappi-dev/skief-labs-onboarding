const fs = require('fs');
const { searchLicense } = require('./src/services/client');
const { parseProfile } = require('./src/parser/parsers');
const { Parser } = require('json2csv');

const STATE_FILE = './state.json';
const OUTPUT_JSONL = './output/ncvmb_2026.jsonl';
const OUTPUT_CSV = './output/ncvmb_2026.csv';

const csvFields = [
    'licenseNumber', 'firstName', 'lastName', 'fullName', 'licenseType', 
    'licenseStatus', 'initialRegistrationDate', 'revokeDate', 'practiceType', 
    'supervisingVet', 'publicDisciplinaryActions', 'scrapedAt', 'sourceUrl'
];

async function run() {
    if (!fs.existsSync('./output')) fs.mkdirSync('./output');

    // Load state safely
    let state = { lastType: 'VET', lastNum: 0 };
    if (fs.existsSync(STATE_FILE)) {
        try {
            state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        } catch (e) {
            console.log("⚠️ State file corrupt, starting from VET #0");
        }
    }

    const categories = { 'VET': 'Veterinarian', 'VT': 'Veterinary Technician', 'FAC': 'Faculty' };
    const typeKeys = Object.keys(categories);
    
    // Fix: Ensure we find the right starting point even if state name is slightly off
    let startIndex = typeKeys.indexOf(state.lastType);
    if (startIndex === -1) startIndex = 0;

    for (let i = startIndex; i < typeKeys.length; i++) {
        const typeKey = typeKeys[i];
        const categoryName = categories[typeKey];
        
        let currentNum = (typeKey === state.lastType) ? state.lastNum + 1 : 1;
        let emptyStreak = 0;
        const MAX_STREAK = 50; // Safety net to skip gaps in numbers

        console.log(`\n📂 Category: ${categoryName} (${typeKey})`);

        while (emptyStreak < MAX_STREAK) {
            console.log(`🔍 Checking ${typeKey} #${currentNum}...`);
            
            try {
                const html = await searchLicense(typeKey, currentNum.toString());
                const profile = parseProfile(html);

                if (profile) {
                    emptyStreak = 0;
                    profile.scrapedAt = new Date().toISOString();
                    profile.sourceUrl = 'https://portal.ncvmb.org/Verification/search.aspx';

                    // Save to JSONL
                    fs.appendFileSync(OUTPUT_JSONL, JSON.stringify(profile) + '\n');

                    // Try to update CSV (wrapped in try/catch for EBUSY error)
                    try {
                        const lines = fs.readFileSync(OUTPUT_JSONL, 'utf8').trim().split('\n');
                        const records = lines.map(l => {
                            const obj = JSON.parse(l);
                            return { ...obj, publicDisciplinaryActions: JSON.stringify(obj.publicDisciplinaryActions) };
                        });
                        fs.writeFileSync(OUTPUT_CSV, new Parser({ fields: csvFields }).parse(records));
                    } catch (csvErr) {
                        console.log("⚠️ Note: CSV file is locked (maybe open in Excel?). Data saved to JSONL only.");
                    }

                    console.log(`✅ Saved: ${profile.fullName} | Status: ${profile.licenseStatus}`);

                    // Save State
                    state.lastNum = currentNum;
                    state.lastType = typeKey;
                    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

                    await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
                } else {
                    emptyStreak++;
                    console.log(`⚠️ Empty #${currentNum} (Streak: ${emptyStreak}/${MAX_STREAK})`);
                    // Short wait for empty results
                    await new Promise(r => setTimeout(r, 500));
                }
            } catch (err) {
                console.error(`❌ Connection error at #${currentNum}: ${err.message}. Retrying in 5s...`);
                await new Promise(r => setTimeout(r, 5000));
                continue; 
            }
            currentNum++;
        }
        console.log(`🏁 Finished ${categoryName}.`);
        state.lastNum = 0; // Reset for next category
    }
    console.log("\n✨ ALL NORTH CAROLINA CATEGORIES COMPLETED!");
}

run().catch(console.error);