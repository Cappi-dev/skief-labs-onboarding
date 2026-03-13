import fs from 'fs';
import path from 'path';

const outputDir = './output';

export function ensureOutputDir() {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
}

export function saveData(item) {
    const timestamp = '2026';
    const baseName = `output_secure.utah.gov_${timestamp}`;
    
    const headers = [
        'fullName', 'addressRaw', 'city', 'state', 'zip', 'country', 
        'profession', 'licenseType', 'licenseNumber', 'obtainedBy', 
        'licenseStatus', 'originalIssueDate', 'expirationDate', 
        'disciplinaryAction', 'docketNumber', 'ePrescriber', 
        'education', 'profileUrl', 'sourceUrl', 'scrapedAt'
    ];

    const jsonlPath = path.join(outputDir, `${baseName}.jsonl`);
    fs.appendFileSync(jsonlPath, JSON.stringify(item) + '\n');

    const csvPath = path.join(outputDir, `${baseName}.csv`);
    if (!fs.existsSync(csvPath)) {
        fs.writeFileSync(csvPath, '\ufeff' + headers.join(',') + '\n');
    }

    const row = headers.map(h => {
        let val = item[h] || '';
        if (Array.isArray(val)) val = val.join('; ');
        return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',') + '\n';
    
    fs.appendFileSync(csvPath, row);
}

export function getState() {
    const statePath = path.join(outputDir, 'state.json');
    if (fs.existsSync(statePath)) {
        return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
    return { lastLetter: 'A', lastPage: 1, lastIndex: -1 };
}

export function saveState(letter, page, index) {
    const statePath = path.join(outputDir, 'state.json');
    fs.writeFileSync(statePath, JSON.stringify({ lastLetter: letter, lastPage: page, lastIndex: index }));
}

export function getAlreadyScrapedLicenses() {
    const timestamp = '2026';
    const jsonlPath = path.join(outputDir, `output_secure.utah.gov_${timestamp}.jsonl`);
    const scrapedLicenses = new Set();

    if (fs.existsSync(jsonlPath)) {
        const lines = fs.readFileSync(jsonlPath, 'utf-8').split('\n');
        for (const line of lines) {
            if (line.trim()) {
                try {
                    const data = JSON.parse(line);
                    if (data.licenseNumber) scrapedLicenses.add(data.licenseNumber);
                } catch (e) { }
            }
        }
    }
    return scrapedLicenses;
}