import fs from 'fs';

const outputFile = 'output/output_elicense.ohio.gov_2026.jsonl';
const stateFile = 'scraper_state.json';

// Updated Headers to camelCase
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

export function loadExistingRecords() {
    const existingLicenses = new Set();
    if (fs.existsSync(outputFile)) {
        const lines = fs.readFileSync(outputFile, 'utf-8').split('\n');
        for (let line of lines) {
            if (line.trim()) {
                try {
                    const record = JSON.parse(line);
                    if (record.licenseNumber) existingLicenses.add(record.licenseNumber);
                } catch (e) {}
            }
        }
    }
    return existingLicenses;
}

export function saveRecord(record) {
    if (!fs.existsSync('output')) fs.mkdirSync('output');
    fs.appendFileSync(outputFile, JSON.stringify(record) + '\n');
}

export function loadState() {
    if (fs.existsSync(stateFile)) {
        try {
            return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        } catch (e) { return { typeIndex: 0, letterIndex: 0 }; }
    }
    return { typeIndex: 0, letterIndex: 0 };
}

export function saveState(typeIndex, letterIndex) {
    fs.writeFileSync(stateFile, JSON.stringify({ typeIndex, letterIndex }, null, 2));
}