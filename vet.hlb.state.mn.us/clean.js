// clean.js
import fs from 'fs';

const filePath = './output/vet.hlb.state.mn.us.csv';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');
const headers = lines[0];
const dataLines = lines.slice(1).filter(line => line.trim() !== '');

const uniqueRecords = new Map();

dataLines.forEach(line => {
    // Extracts the ID from the first column "12940"
    const id = line.split(',')[0].replace(/"/g, '');
    if (!uniqueRecords.has(id)) {
        uniqueRecords.set(id, line);
    }
});

const cleanedContent = [headers, ...uniqueRecords.values()].join('\n');
fs.writeFileSync('./output/vet.hlb.state.mn.us.csv', cleanedContent);
console.log(`✅ Cleaned! Removed duplicates. Final count: ${uniqueRecords.size} unique records.`);