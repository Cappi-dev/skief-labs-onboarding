import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './output';
const JSONL_FILE = path.join(OUTPUT_DIR, 'output_vet_hlb_state_mn_us_2026.jsonl');
const CSV_FILE = path.join(OUTPUT_DIR, 'output_vet_hlb_state_mn_us_2026.csv');
const STATE_FILE = path.join(OUTPUT_DIR, 'state.json');

const seenIds = new Set();

if (fs.existsSync(CSV_FILE)) {
    const content = fs.readFileSync(CSV_FILE, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
        const idMatch = line.match(/^"(\d+)"/); 
        if (idMatch) seenIds.add(idMatch[1]);
    });
}

const CSV_HEADERS = [
    'entityId', 'licenseNumber', 'firstName', 'middleName', 'lastName', 
    'fullName', 'birthYear', 'city', 'state', 'zipCode', 
    'licenseType', 'licenseStatus', 'issueDate', 'expirationDate', 
    'profileUrl', 'sourceUrl', 'scrapedAt'
];

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(CSV_FILE)) fs.writeFileSync(CSV_FILE, CSV_HEADERS.join(',') + '\n');

export const isDuplicate = (id) => seenIds.has(String(id));

export function saveRecord(record) {
    if (!record || !record.entityId || isDuplicate(record.entityId)) return;
    seenIds.add(String(record.entityId));

    fs.appendFileSync(JSONL_FILE, JSON.stringify(record) + '\n');

    const values = CSV_HEADERS.map(h => `"${String(record[h] || '').replace(/"/g, '""')}"`);
    fs.appendFileSync(CSV_FILE, values.join(',') + '\n');

    console.log(`Saved: ${record.firstName} ${record.lastName}`);
}

export const saveState = (lastPrefix, lastType) => fs.writeFileSync(STATE_FILE, JSON.stringify({ lastPrefix, lastType }));
export const loadState = () => fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE)) : null;