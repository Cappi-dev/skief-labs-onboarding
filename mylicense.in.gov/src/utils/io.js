import fs from 'fs';
import path from 'path';

const DIR = './output';
const CSV = path.join(DIR, 'output_mylicense_in_gov_2026.csv');
const JSONL = path.join(DIR, 'output_mylicense_in_gov_2026.jsonl');
const STATE = path.join(DIR, 'state.json');

// 🎯 UPDATED HEADERS: Added csrStatus, hasLitigation, and relatedCount
export const MASTER_HEADERS = [
    'fullName', 'firstName', 'middleName', 'lastName',
    'licenseNo', 'profession', 'type', 'secondary', 
    'status', 'issued', 'expiration', 'renewed', 
    'method', 'cityStateZip', 'county', 'dba', 
    'csrStatus', 'hasLitigation', 'relatedCount', // New high-value columns
    'disciplineInformation', 'profileUrl', 'sourceUrl', 'scrapedAt'
];

export function initFiles() {
    if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
    // If the file exists, we don't overwrite headers. 
    // This is why you must delete the old CSV to see the new headers.
    if (!fs.existsSync(CSV)) {
        fs.writeFileSync(CSV, MASTER_HEADERS.join(',') + '\n');
        console.log("📁 CSV Initialized with new headers.");
    }
}

export function saveRecord(record) {
    // 1. Save to JSONL
    fs.appendFileSync(JSONL, JSON.stringify(record) + '\n');

    // 2. Save to CSV (Strictly mapped to headers)
    const row = MASTER_HEADERS.map(h => {
        const val = record[h] !== undefined && record[h] !== null ? record[h] : '';
        // Escape quotes for CSV safety
        return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
    fs.appendFileSync(CSV, row + '\n');
}

// ... rest of your saveState / loadState functions