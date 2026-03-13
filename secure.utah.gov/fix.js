import fs from 'fs';

// Look at the headers! We permanently deleted 'addressRaw' and 'ePrescriber' from this list.
const headers = [
    "fullName", "city", "state", "zip", "country", 
    "profession", "licenseType", "licenseNumber", "obtainedBy", 
    "licenseStatus", "originalIssueDate", "expirationDate", 
    "disciplinaryAction", "docketNumber", 
    "education", "profileUrl", "sourceUrl", "scrapedAt"
];

function escapeCSV(val) {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        str = str.replace(/"/g, '""');
        return `"${str}"`;
    }
    return `"${str}"`;
}

console.log("🛠️ Reading the secure JSONL file...");
const jsonlData = fs.readFileSync('./output/output_secure.utah.gov_2026.jsonl', 'utf-8');
const lines = jsonlData.split('\n').filter(line => line.trim() !== '');

let csvContent = headers.join(',') + '\n';

console.log("✨ Final Polish: Re-aligning data and deleting redundant columns...");
lines.forEach(line => {
    const obj = JSON.parse(line);

    if (Array.isArray(obj.education)) {
        obj.education = obj.education.join(' | ');
    }

    const row = headers.map(header => escapeCSV(obj[header] || ''));
    csvContent += row.join(',') + '\n';
});

fs.writeFileSync('output_secure.utah.gov_2026_FINAL(2).csv', csvContent);

console.log(`✅ MASTERPIECE! Wrote ${lines.length} perfectly clean rows to output_secure.utah.gov_2026_FINAL.csv`);