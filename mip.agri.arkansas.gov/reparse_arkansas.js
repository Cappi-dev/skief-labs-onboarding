const fs = require('fs');
const { parseAndMerge } = require('./src/parser/parsers');
const { Parser } = require('json2csv');

const SOURCE_HOST = 'mip.agri.arkansas.gov';
const INPUT_JSONL = `output/output_${SOURCE_HOST}_2026.jsonl`;
const FINAL_CSV = `output/output_${SOURCE_HOST}_2026_CLEAN.csv`;

const csvFields = [
    'licenseNumber', 'firstName', 'lastName', 'fullName', 'licenseType', 
    'licenseStatus', 'city', 'state', 'zipCode', 'expirationDate',
    'scrapedAt', 'sourceUrl', 'profileUrl'
];

async function reparse() {
    console.log("🛠️ Fixing blank columns...");
    const lines = fs.readFileSync(INPUT_JSONL, 'utf-8').trim().split('\n');
    const fixedRecords = lines.map(line => {
        const raw = JSON.parse(line);
        // We pull the original raw data stored in the JSONL to re-process it
        const searchData = {};
        Object.keys(raw).filter(k => k.startsWith('search_')).forEach(k => searchData[k.replace('search_', '')] = raw[k]);
        
        const profileData = JSON.parse(raw.rawHTML || "{}");
        
        const { jsonl } = parseAndMerge(searchData, profileData, SOURCE_HOST);
        return jsonl;
    });

    const parser = new Parser({ fields: csvFields });
    fs.writeFileSync(FINAL_CSV, parser.parse(fixedRecords));
    console.log(`✅ Finished! Clean CSV saved to: ${FINAL_CSV}`);
}

reparse();