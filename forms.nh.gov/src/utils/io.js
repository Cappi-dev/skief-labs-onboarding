import fs from 'fs';
import path from 'path';

const outputDir = './output';
const jsonlFile = path.join(outputDir, 'data.jsonl');
const csvFile = path.join(outputDir, 'data.csv');

export function initFiles() {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    if (!fs.existsSync(csvFile)) {
        fs.writeFileSync(csvFile, 'Name,LicenseNo,Profession,Type,Status,IssueDate,ExpiryDate,SourceUrl,ProfileUrl,ScrapedAt\n');
    }
}

export function saveRecord(data) {
    fs.appendFileSync(jsonlFile, JSON.stringify(data) + '\n');
    const row = `"${data.name}","${data.licenseNo}","${data.profession}","${data.licenseType}","${data.status}","${data.issueDate}","${data.expiryDate}","${data.sourceUrl}","${data.profileUrl}","${data.scrapedAt}"\n`;
    fs.appendFileSync(csvFile, row);
}