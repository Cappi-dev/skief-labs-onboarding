const fs = require('fs');
const path = require('path');
const { initSession, searchProfiles, getProfileDetails } = require('./src/services/client');
const { parseAndMerge } = require('./src/parser/parsers'); // Match the { } import
const { Parser } = require('json2csv');

const STATE_FILE = './state.json';
const OUTPUT_DIR = './output';
const JSONL_PATH = './output/oregon_combined.jsonl';
const CSV_PATH = './output/oregon_combined.csv';

async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
    
    // Load state
    let state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE)) : { taskIndex: 0, skip: 0 };
    const tasks = ['licensee', 'facility'];

    if (!await initSession()) return console.error("❌ Failed to initialize session.");

    for (let i = state.taskIndex; i < tasks.length; i++) {
        const type = tasks[i];
        state.taskIndex = i; 
        console.log(`🚀 RUNNING: ${type.toUpperCase()} (Starting at skip: ${state.skip})`);

        while (true) {
            const results = await searchProfiles(type, state.skip, 20);
            if (!results) {
                console.error("⛔ Connection error. Check internet or headers.");
                process.exit(1);
            }

            const profiles = results.result || [];
            if (profiles.length === 0) {
                console.log(`✅ Finished ${type}.`);
                state.skip = 0;
                fs.writeFileSync(STATE_FILE, JSON.stringify(state));
                break;
            }

            for (const summary of profiles) {
                // Random delay 3-5s
                await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
                
                const details = await getProfileDetails(type, summary.id);
                
                // FIXED: Using the correctly imported function
                const record = parseAndMerge(type, summary, details);
                
                fs.appendFileSync(JSONL_PATH, JSON.stringify(record) + '\n');
                
                // Update skip count and save state immediately
                state.skip += 1;
                fs.writeFileSync(STATE_FILE, JSON.stringify(state));
                
                console.log(`[SAVED] ${record.entityName} | Discipline: ${record.hasDisciplinaryHistory}`);
                generateCSV();
            }
        }
    }
    console.log("🏁 OREGON SCRAPE COMPLETE!");
}

function generateCSV() {
    try {
        if (!fs.existsSync(JSONL_PATH)) return;
        const data = fs.readFileSync(JSONL_PATH, 'utf8').trim().split('\n').map(l => JSON.parse(l));
        const csv = new Parser().parse(data);
        fs.writeFileSync(CSV_PATH, csv);
    } catch (e) {
        // Handle file-in-use errors silently
    }
}

run().catch(console.error);