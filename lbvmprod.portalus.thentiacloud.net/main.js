const { searchProfiles, getProfileDetails } = require('./src/services/client');
const { parseAndMerge } = require('./src/parser/parsers');
const fs = require('fs');
const { Parser } = require('json2csv');
const readline = require('readline');

// File Paths
const STATE_FILE = 'state.json';
const OUTPUT_JSONL = 'output/louisiana_data.jsonl';
const OUTPUT_CSV = 'output/louisiana_data.csv';

// 1. Helper for the VPN Pause
const waitForKey = () => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question('\n🛑 PAUSED. Change VPN and press [ENTER] to continue...', (ans) => {
        rl.close();
        resolve();
    }));
};

// 2. State Management Functions
const saveState = (index) => fs.writeFileSync(STATE_FILE, JSON.stringify({ lastIndex: index }, null, 2));
const loadState = () => {
    if (fs.existsSync(STATE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(STATE_FILE)).lastIndex;
        } catch (e) { return 0; }
    }
    return 0;
};

async function runScraper() {
    // A. Load progress from state.json
    const startIndex = loadState();
    const totalToScrape = 5720; 
    const chunkSize = 20; // Pause every 20 records
    const sourceUrl = 'https://lbvmprod.portalus.thentiacloud.net/webs/portal/register/#/search/all';

    console.log(`🚀 Resuming Scrape at index: ${startIndex}`);

    // B. Sync CSV with existing JSONL data
    let sessionData = [];
    if (fs.existsSync(OUTPUT_JSONL)) {
        console.log('📄 Syncing existing data from JSONL to CSV...');
        const fileContent = fs.readFileSync(OUTPUT_JSONL, 'utf-8');
        sessionData = fileContent.trim().split('\n')
            .filter(line => line.trim() !== '')
            .map(line => JSON.parse(line));
        console.log(`✅ Loaded ${sessionData.length} records into memory.`);
    }

    // C. Fetch the master list of profiles
    console.log('📡 Fetching master list from search...');
    const searchResponse = await searchProfiles(0, totalToScrape);
    const profiles = searchResponse?.result?.dataResults || [];
    console.log(`✅ Total profiles available: ${profiles.length}`);

    // D. The Main Loop
    for (let i = startIndex; i < profiles.length; i++) {
        const summary = profiles[i];
        
        try {
            // Ninja Delay: 3 to 6 seconds
            await new Promise(r => setTimeout(r, 3000 + Math.random() * 3000));

            const details = await getProfileDetails(summary.id);
            
            // Check if blocked
            if (!details) {
                console.log('🛑 429 Detected (Empty Response).');
                throw new Error('429');
            }

            const { jsonl } = parseAndMerge(summary, details, sourceUrl);
            
            // 1. Update JSONL
            fs.appendFileSync(OUTPUT_JSONL, JSON.stringify(jsonl) + '\n');
            
            // 2. Update CSV (Synchronized)
            sessionData.push(jsonl);
            const json2csvParser = new Parser();
            const csv = json2csvParser.parse(sessionData);
            fs.writeFileSync(OUTPUT_CSV, csv); 

            // 3. Update state.json
            saveState(i + 1);
            
            console.log(`⏳ [${i + 1}/${profiles.length}] Saved: ${jsonl.fullName}`);

            // 4. Arizona VPN Chunk Pause
            if ((i + 1 - startIndex) % chunkSize === 0 && (i + 1) < profiles.length) {
                console.log(`\n--- Chunk of ${chunkSize} complete ---`);
                await waitForKey();
            }

        } catch (err) {
            if (err.message.includes('429')) {
                console.log('\n🛑 BANNED (429)! Location blocked.');
                await waitForKey();
                i--; // Decrement to retry the same record
            } else {
                console.error(`❌ Error at index ${i}:`, err.message);
                // Wait a bit before continuing on random errors
                await new Promise(r => setTimeout(r, 5000));
            }
        }
    }
    
    console.log('\n🏁 FINISHED! All records processed.');
}

// Make sure output directory exists
if (!fs.existsSync('output')) fs.mkdirSync('output');

runScraper();