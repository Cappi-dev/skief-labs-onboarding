
import fs from 'fs';

const FILE_1 = './output/vet.hlb.state.mn.us.jsonl';
const FILE_2 = './output/output_vet_hlb_state_mn_us_2026.jsonl';
const MASTER_JSONL = './output/MASTER_FINAL_DATA_2026.jsonl';

const uniqueRecords = new Map();

function processJsonl(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
    console.log(`Processing ${lines.length} lines from ${filePath}...`);

    lines.forEach(line => {
        try {
            const record = JSON.parse(line);
            const id = String(record.entityId);
            
            // If the ID is already there, we keep the one with full_json_data 
            // or the most recent one.
            if (!uniqueRecords.has(id) || record.full_json_data) {
                uniqueRecords.set(id, line);
            }
        } catch (e) {
            // Skip invalid JSON lines
        }
    });
}

console.log("Merging JSONL files...");
processJsonl(FILE_1);
processJsonl(FILE_2);

const mergedContent = Array.from(uniqueRecords.values()).join('\n');
fs.writeFileSync(MASTER_JSONL, mergedContent);

console.log(`Success! Total Unique JSONL Records: ${uniqueRecords.size}`);
console.log(`Merged file created: ${MASTER_JSONL}`);