import fs from 'fs';

const headers = [
    "fullName", 
    "licenseNumber", 
    "licenseType", 
    "status", 
    "subStatus", 
    "compactMultiStateEligible", 
    "subCategory", 
    "board", 
    "licenseIssueDate", 
    "licenseEffectiveDate", 
    "licenseExpirationDate", 
    "city", 
    "state", 
    "country", 
    "boardAction", 
    "profileUrl", 
    "sourceUrl", 
    "scrapedAt"
];

function escapeCSV(val) {
    if (val === null || val === undefined) return '""';
    let str = String(val).trim();
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        str = str.replace(/"/g, '""');
        return `"${str}"`;
    }
    return `"${str}"`;
}

const inputPath = 'output/output_elicense.ohio.gov_2026.jsonl';
const outputPath = 'output/output_elicense.ohio.gov_2026.csv';

console.log("🛠️ Reading JSONL from output folder...");

try {
    const jsonlData = fs.readFileSync(inputPath, 'utf-8');
    const lines = jsonlData.split('\n').filter(line => line.trim() !== '');

    let csvContent = headers.join(',') + '\n';

    lines.forEach(line => {
        const obj = JSON.parse(line);
        const row = headers.map(h => escapeCSV(obj[h] || ''));
        csvContent += row.join(',') + '\n';
    });

    fs.writeFileSync(outputPath, csvContent);
    console.log(`✅ CSV generated: ${outputPath} (${lines.length} records)`);
} catch (error) {
    console.error("⚠️ Error generating CSV:", error.message);
}