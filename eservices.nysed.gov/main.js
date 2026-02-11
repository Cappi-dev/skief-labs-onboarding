const fs = require('fs');
const { fetchLicense } = require('./src/client/client');
const { Parser } = require('json2csv');

const STATE_FILE = './state.json';
const OUTPUT_DIR = './output';
const pad = (n) => n.toString().padStart(6, '0');

const jsonlPath = `${OUTPUT_DIR}/nysed_output_2026.jsonl`;
const csvPath = `${OUTPUT_DIR}/nysed_output_2026.csv`;

async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

    let state = fs.existsSync(STATE_FILE) 
        ? JSON.parse(fs.readFileSync(STATE_FILE)) 
        : { professionIndex: 0, currentLicense: 1, consecutiveEmpty: 0 };

    const professions = [
        { code: "075", name: "Veterinarian" }, 
        { code: "074", name: "Limited_License" }
    ];

    for (let i = state.professionIndex; i < professions.length; i++) {
        const profession = professions[i];
        state.professionIndex = i;

        console.log(`🚀 STARTING API MODE: ${profession.name}`);

        while (state.consecutiveEmpty < 50) {
            const currentPadded = pad(state.currentLicense);
            console.log(`🕵️ API Fetch: ${profession.name} #${currentPadded}...`);

            try {
                const data = await fetchLicense(currentPadded, profession.code);

                if (data && data.name && data.name.value) {
                    const sourceUrl = 'https://eservices.nysed.gov/professions/verification-search';
                    
                    // CLEANING: Strip <p> and other HTML tags from enforcement actions
                    const cleanEnforcement = (data.noEnforcementActionsFoundMessage || "No Enforcement Actions Found")
                        .replace(/<\/?[^>]+(>|$)/g, "")
                        .trim();

                    const record = {
                        fullName: data.name.value,
                        licenseNumber: data.licenseNumber.value,
                        profession: data.profession.value,
                        licenseStatus: data.status.value,
                        dateOfLicensure: data.dateOfLicensure.value,
                        registrationThrough: data.registeredThroughDate.value || "---",
                        address: data.address.value,
                        enforcementActions: cleanEnforcement,
                        // Adding back the URLs
                        profileUrl: `${sourceUrl}?licenseNumber=${data.licenseNumber.value}&professionCode=${profession.code}`,
                        sourceUrl: sourceUrl,
                        scrapedAt: new Date().toISOString()
                    };

                    fs.appendFileSync(jsonlPath, JSON.stringify(record) + '\n');
                    generateCSV(jsonlPath, csvPath);
                    console.log(`   ✅ SAVED: ${record.fullName}`);
                    state.consecutiveEmpty = 0;
                } else {
                    state.consecutiveEmpty++;
                    console.log(`   ❌ Empty (${state.consecutiveEmpty}/50)`);
                }
            } catch (err) {
                console.log(`   ⚠️ Error at ${currentPadded}: ${err.message}`);
                state.consecutiveEmpty++;
            }

            state.currentLicense++;
            fs.writeFileSync(STATE_FILE, JSON.stringify(state));
            
            await new Promise(r => setTimeout(r, 400)); // Optimized delay
        }
        
        state.currentLicense = 1;
        state.consecutiveEmpty = 0;
        fs.writeFileSync(STATE_FILE, JSON.stringify(state));
    }
    console.log("🏁 EXTRACTION FINISHED.");
}

function generateCSV(jsonlPath, csvPath) {
    try {
        if (!fs.existsSync(jsonlPath)) return;
        const lines = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n');
        const data = lines.map(l => JSON.parse(l));
        fs.writeFileSync(csvPath, new Parser().parse(data));
    } catch (e) {}
}

run().catch(console.error);