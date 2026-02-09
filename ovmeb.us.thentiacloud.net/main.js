const fs = require('fs');
const { initSession, searchProfiles, getProfileDetails } = require('./src/services/client');
const { parseLicensee, parseFacility } = require('./src/parser/parsers');
const { Parser } = require('json2csv');

const STATE_FILE = './state.json';
const OUTPUT_DIR = './output';

async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
    
    // Ensure you delete state.json and output/ folder before running for a total reset
    let state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE)) : { taskIndex: 0, skip: 0 };
    const tasks = ['licensee', 'facility'];

    if (!await initSession()) return console.error("❌ Session failed.");

    for (let i = state.taskIndex; i < tasks.length; i++) {
        const type = tasks[i];
        state.taskIndex = i; 
        const jsonlPath = `${OUTPUT_DIR}/oregon_${type}s.jsonl`;
        const csvPath = `${OUTPUT_DIR}/oregon_${type}s.csv`;

        console.log(`🚀 STARTING FRESH: ${type.toUpperCase()} (Skip: ${state.skip})`);

        while (true) {
            const results = await searchProfiles(type, state.skip, 20);
            if (!results) {
                console.error("⛔ Server error. Saving state and stopping.");
                process.exit(1);
            }

            const profiles = results.result || [];
            if (profiles.length === 0) {
                console.log(`✅ ${type.toUpperCase()} completed.`);
                state.skip = 0;
                fs.writeFileSync(STATE_FILE, JSON.stringify(state));
                break;
            }

            for (const summary of profiles) {
                await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
                const details = await getProfileDetails(type, summary.id);
                
                const record = (type === 'licensee') 
                    ? parseLicensee(summary, details) 
                    : parseFacility(summary, details);
                
                fs.appendFileSync(jsonlPath, JSON.stringify(record) + '\n');
                state.skip += 1;
                fs.writeFileSync(STATE_FILE, JSON.stringify(state));
                
                console.log(`[SAVED] ${type === 'licensee' ? record.lastName : record.facilityName}`);
                generateCSV(jsonlPath, csvPath);
            }
        }
    }
    console.log("🏁 OREGON SCRAPE FINISHED!");
}

function generateCSV(jsonlPath, csvPath) {
    try {
        const lines = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n');
        const data = lines.map(l => JSON.parse(l));
        const csv = new Parser().parse(data);
        fs.writeFileSync(csvPath, csv);
    } catch (e) {}
}

run().catch(console.error);