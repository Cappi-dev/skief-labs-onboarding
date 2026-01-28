const fs = require('fs');
const { Parser } = require('json2csv');
const config = require('./config');

const jsonlPath = config.OUTPUT_JSONL;
const csvPath = config.OUTPUT_CSV;

// Define the exact column order for the CSV
const fields = [
    'fullName', 
    'firstName', 
    'lastName', 
    'licenseNumber', 
    'type', 
    'status', 
    'issuedDate', 
    'revokeDate', 
    'discipline',
    'scrapedAt',
    'sourceUrl'
];

try {
    console.log(`📊 Converting ${jsonlPath} to CSV...`);

    if (!fs.existsSync(jsonlPath)) {
        console.error("❌ No JSONL file found. Please run the scraper first!");
        process.exit(1);
    }

    const rawData = fs.readFileSync(jsonlPath, 'utf8')
        .split('\n')
        .filter(line => line.trim() !== '');

    if (rawData.length === 0) {
        console.error("⚠️ JSONL file is empty.");
        process.exit(1);
    }

    const data = rawData.map(line => JSON.parse(line));

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    fs.writeFileSync(csvPath, csv);
    console.log(`✅ Success! Data exported to: ${csvPath}`);

} catch (err) {
    console.error('❌ Export Error:', err.message);
}