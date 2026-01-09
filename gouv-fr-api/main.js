const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 1. All Department Codes from the provided Google Sheet
const departments = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15',
    '16', '17', '18', '19', '2A', '2B', '21', '22', '23', '24', '25', '26', '27', '28', '29',
    '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44',
    '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59',
    '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74',
    '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89',
    '90', '91', '92', '93', '94', '95', '971', '972', '973', '974', '976'
];

// Helper to flatten nested objects (Requirement: Flattened CSV)
const flattenObject = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '_' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
};

async function runScraper() {
    const allRecords = [];
    console.log("🚀 Starting API Scraping...");

    for (const dep of departments) {
        try {
            const url = `https://www.pour-les-personnes-agees.gouv.fr/api/v1/structure-mdm/search?departement=${dep}&annuaires=CCAS`;
            const response = await axios.get(url);
            
            // Check if data exists and is an array
            if (response.data && Array.isArray(response.data)) {
                console.log(`✅ Dep ${dep}: Found ${response.data.length} records`);
                allRecords.push(...response.data);
            }
        } catch (err) {
            console.error(`❌ Error in Dep ${dep}: ${err.message}`);
        }
    }

    // Ensure output directory exists
    const outDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

    // 1. Save as JSONL (Requirement)
    const jsonlData = allRecords.map(r => JSON.stringify(r)).join('\n');
    fs.writeFileSync(path.join(outDir, 'data.jsonl'), jsonlData);

    // 2. Save as Flattened CSV (Requirement)
    const flattenedData = allRecords.map(r => flattenObject(r));
    const headers = Object.keys(flattenedData[0] || {});
    const csvContent = [
        headers.join(','),
        ...flattenedData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');
    fs.writeFileSync(path.join(outDir, 'data.csv'), csvContent);

    console.log(`\n🎉 Process Complete! Total records: ${allRecords.length}`);
}

runScraper();