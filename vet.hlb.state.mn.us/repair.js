import fs from 'fs';

// Define both source files
const FILE_1 = './output/vet.hlb.state.mn.us.jsonl';
const FILE_2 = './output/output_vet_hlb_state_mn_us_2026.jsonl';
const MASTER_CSV = './output/MASTER_FINAL_REPORT_2026.csv';

const CSV_HEADERS = [
    'entityId', 'licenseNumber', 'firstName', 'middleName', 'lastName', 
    'fullName', 'birthYear', 'city', 'state', 'zipCode', 
    'licenseType', 'licenseStatus', 'issueDate', 'expirationDate', 
    'profileUrl', 'sourceUrl', 'scrapedAt'
];

const uniqueRecords = new Map();

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
    
    lines.forEach(line => {
        try {
            const record = JSON.parse(line);
            const id = String(record.entityId);

            // If we have full raw data, use it to fill missing fields
            if (record.full_json_data) {
                const detail = record.full_json_data.detail_api_response.Content || record.full_json_data.detail_api_response;
                const license = detail.Licenses?.[0] || {};
                record.birthYear = detail.DateOfBirth ? detail.DateOfBirth.split('-')[0] : (record.birthYear || 'N/A');
                record.issueDate = license.GrantDate || (record.grantDate || 'N/A');
                record.expirationDate = license.ExpireDate || (record.expirationDate || 'N/A');
            }

            // Standardize field names (grantDate vs issueDate)
            const finalRecord = {
                entityId: record.entityId,
                licenseNumber: record.licenseNumber,
                firstName: record.firstName,
                middleName: record.middleName,
                lastName: record.lastName,
                fullName: record.fullName,
                birthYear: record.birthYear || 'N/A',
                city: record.city,
                state: record.state,
                zipCode: record.zipCode,
                licenseType: record.licenseType,
                licenseStatus: record.licenseStatus,
                issueDate: record.issueDate || record.grantDate || 'N/A',
                expirationDate: record.expirationDate || 'N/A',
                profileUrl: record.profileUrl,
                sourceUrl: record.sourceUrl,
                scrapedAt: record.scrapedAt
            };

            uniqueRecords.set(id, finalRecord);
        } catch (e) {
            // Skip broken lines
        }
    });
}

console.log("Merging data files...");
processFile(FILE_1);
processFile(FILE_2);

const rows = [CSV_HEADERS.join(',')];
uniqueRecords.forEach(record => {
    const row = CSV_HEADERS.map(h => `"${String(record[h] || '').replace(/"/g, '""')}"`);
    rows.push(row.join(','));
});

fs.writeFileSync(MASTER_CSV, rows.join('\n'));
console.log(`Success! Total Unique Records: ${uniqueRecords.size}`);
console.log(`File created: ${MASTER_CSV}`);