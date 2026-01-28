const { searchByState, getProfileDetails, stateAbbreviations } = require('./src/services/client');
const { parseAndMerge } = require('./src/parser/parsers');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const SOURCE_HOST = 'mip.agri.arkansas.gov';
const outputDir = path.join(__dirname, 'output');
const OUTPUT_JSONL = path.join(outputDir, `output_${SOURCE_HOST}_2026.jsonl`);
const OUTPUT_CSV = path.join(outputDir, `output_${SOURCE_HOST}_2026.csv`);

const csvFields = [
    'licenseNumber', 'fullName', 'licenseType', 'licenseStatus', 
    'businessName', 'practiceType', 'supervisingVet', 'workAddressName', 
    'city', 'state', 'zipCode', 'initialRegistrationDate', 
    'expirationDate', 'publicDisciplinaryActions', 'scrapedAt', 'profileUrl'
];
const syncCsv = () => {
    if (!fs.existsSync(OUTPUT_JSONL)) return;
    const lines = fs.readFileSync(OUTPUT_JSONL, 'utf-8').trim().split('\n').filter(l => l.trim());
    const records = lines.map(line => JSON.parse(line));
    const parser = new Parser({ fields: csvFields, defaultValue: "" });
    fs.writeFileSync(OUTPUT_CSV, parser.parse(records));
};

async function run() {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const seenIds = new Set();

    for (let i = 0; i < stateAbbreviations.length; i++) {
        const state = stateAbbreviations[i];
        console.log(`\n📡 Scraping State: ${state} [${i+1}/50]`);
        
        const results = await searchByState(state);
        console.log(`📊 Found ${results.length} results.`);

        for (const item of results) {
            const id = item.licenseId || item.LicenseId || item.licenseNumber;
            if (!id || seenIds.has(id)) continue;

            // This now hits Get_Licensee_Info
            const details = await getProfileDetails(id);
            
            // This cleans the HTML and parses the address properly
            const { jsonl } = parseAndMerge(item, details, SOURCE_HOST);

            fs.appendFileSync(OUTPUT_JSONL, JSON.stringify(jsonl) + '\n');
            seenIds.add(id);
            process.stdout.write(`.`); 
        }
        syncCsv();
    }
    console.log('\n✨ ARKANSAS COMPLETED!');
}

run();