const fs = require('fs');
const path = require('path');
const { searchLicense } = require('./src/services/client');
const { parseProfile } = require('./src/parser/parsers');
const { Parser } = require('json2csv');

const STATE_FILE = path.join(__dirname, 'state.json');
const OUTPUT_DIR = path.join(__dirname, 'output');
const JSONL_PATH = path.join(OUTPUT_DIR, 'ncvmb_2026.jsonl');
const CSV_PATH = path.join(OUTPUT_DIR, 'ncvmb_2026.csv');

const csvFields = [
    'licenseNumber', 'firstName', 'lastName', 'fullName', 'licenseType', 
    'licenseStatus', 'initialRegistrationDate', 'revokeDate', 'practiceType', 
    'supervisingVet', 'publicDisciplinaryActions', 'scrapedAt', 'sourceUrl'
];

async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // Load Deduplication Shield
    const seen = new Set();
    if (fs.existsSync(JSONL_PATH)) {
        fs.readFileSync(JSONL_PATH, 'utf8').split('\n').forEach(line => {
            if (!line) return;
            const obj = JSON.parse(line);
            seen.add(`${obj.licenseNumber}-${obj.licenseType}`.toLowerCase());
        });
    }

    let state = { lastType: 'VET', lastNum: 0 };
    if (fs.existsSync(STATE_FILE)) {
        state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }

    // Config for the 3 required license types
    const categories = [
        { key: 'VET', prefix: '', pad: 0, streakLimit: 50 },
        { key: 'VT', prefix: '', pad: 0, streakLimit: 50 },
        { key: 'FAC', prefix: 'FC', pad: 5, streakLimit: 3000 }
    ];

    let startIndex = categories.findIndex(c => c.key === state.lastType);
    
    for (let i = startIndex; i < categories.length; i++) {
        const cat = categories[i];
        let currentNum = (cat.key === state.lastType) ? state.lastNum + 1 : 1;
        let emptyStreak = 0;

        console.log(`\n🚀 Starting Category: ${cat.key}`);

        while (emptyStreak < cat.streakLimit) {
            const numStr = cat.pad > 0 ? currentNum.toString().padStart(cat.pad, '0') : currentNum.toString();
            const searchId = `${cat.prefix}${numStr}`;

            try {
                const html = await searchLicense(cat.key, searchId);
                const profile = parseProfile(html);

                if (profile) {
                    emptyStreak = 0;
                    const idKey = `${profile.licenseNumber}-${profile.licenseType}`.toLowerCase();
                    
                    if (!seen.has(idKey)) {
                        seen.add(idKey);
                        profile.scrapedAt = new Date().toISOString();
                        profile.sourceUrl = 'https://portal.ncvmb.org/Verification/search.aspx';
                        
                        fs.appendFileSync(JSONL_PATH, JSON.stringify(profile) + '\n');
                        updateCSV();
                        console.log(`✅ Saved: ${profile.fullName} (${searchId})`);
                    }

                    state.lastNum = currentNum;
                    state.lastType = cat.key;
                    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
                } else {
                    emptyStreak++;
                    if (currentNum % 500 === 0) console.log(`🔍 Tunneling ${cat.key}: ${searchId}...`);
                }
            } catch (err) {
                console.error(`❌ Error at ${searchId}:`, err.message);
                await new Promise(r => setTimeout(r, 5000));
            }
            currentNum++;
        }
    }
}

function updateCSV() {
    try {
        const lines = fs.readFileSync(JSONL_PATH, 'utf8').trim().split('\n');
        const records = lines.map(l => {
            const obj = JSON.parse(l);
            return { ...obj, publicDisciplinaryActions: JSON.stringify(obj.publicDisciplinaryActions) };
        });
        const parser = new Parser({ fields: csvFields });
        fs.writeFileSync(CSV_PATH, parser.parse(records));
    } catch (e) {}
}

main().catch(console.error);