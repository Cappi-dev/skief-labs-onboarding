import fs from 'fs';

const outputJsonl = 'output/output_dhp.virginia.gov_2026.jsonl';
const outputCsv = 'output/output_dhp.virginia.gov_2026.csv';
const stateFile = 'scraper_state_virginia.json';


const csvHeaders = [
    "searchedState", "name", "licenseNumber", "occupation", 
    "licenseStatus", "issueDate", "expireDate", "address", 
    "additionalPublicInformation", "profileUrl", "sourceUrl", "scrapedAt"
];

// Helper to safely wrap CSV data in quotes and handle commas
function escapeCSV(val) {
    if (val === null || val === undefined) return '""';
    let str = String(val).trim();
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        str = str.replace(/"/g, '""');
        return `"${str}"`;
    }
    return `"${str}"`;
}

// 🛡️ Deduplication Shield
export function loadExistingRecords() {
    const existing = new Set();
    if (fs.existsSync(outputJsonl)) {
        const lines = fs.readFileSync(outputJsonl, 'utf-8').split('\n');
        for (let line of lines) {
            if (line.trim()) {
                try {
                    const record = JSON.parse(line);
                    if (record.profileUrl) existing.add(record.profileUrl);
                } catch (e) {}
            }
        }
    }
    return existing;
}

// 💾 The Dual-Save System (JSONL + CSV)
export function saveRecord(record) {
    if (!fs.existsSync('output')) fs.mkdirSync('output');
    
    // 1. Save to JSONL (Our indestructible backup vault)
    fs.appendFileSync(outputJsonl, JSON.stringify(record) + '\n');
    
    // 2. Save to CSV (Live, auto-updating Excel file)
    let writeHeaders = false;
    if (!fs.existsSync(outputCsv)) {
        writeHeaders = true; // If file doesn't exist, we need to write the column titles first
    }
    
    if (writeHeaders) {
        fs.appendFileSync(outputCsv, csvHeaders.join(',') + '\n');
    }
    
    // Map the record data to match our exact header order
    const row = csvHeaders.map(header => escapeCSV(record[header] || ''));
    fs.appendFileSync(outputCsv, row.join(',') + '\n');
}

// 📂 State Management (Saves your place automatically)
export function loadState() {
    if (fs.existsSync(stateFile)) {
        try {
            const data = fs.readFileSync(stateFile, 'utf-8');
            if (!data.trim()) throw new Error("Empty file"); 
            return JSON.parse(data);
        } catch (e) {
            console.log("⚠️ State corrupted or empty, starting fresh.");
            return { occIdx: 0, stateIdx: 0, comboIdx: 0 };
        }
    }
    return { occIdx: 0, stateIdx: 0, comboIdx: 0 };
}

export function saveState(occIdx, stateIdx, comboIdx) {
    fs.writeFileSync(stateFile, JSON.stringify({ occIdx, stateIdx, comboIdx }, null, 2));
}