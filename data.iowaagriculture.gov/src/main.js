const fs = require('fs');
const path = require('path');
const { fetchVeterinarianPage } = require('./services/client');
const { parseVeterinarians } = require('./parsers/parsers');

async function main() {
    let browser;
    try {
        const { browser: activeBrowser, page } = await fetchVeterinarianPage();
        browser = activeBrowser;

        let allResults = [];
        let hasNextPage = true;
        let pageNum = 1;

        while (hasNextPage) {
            console.log(`Scraping Page ${pageNum}...`);
            
            // 1. Extract data from current page
            const pageData = await parseVeterinarians(page);
            allResults = allResults.concat(pageData);

            // 2. Look for the "Next >" button
            const nextButton = await page.$('button::-p-text(Next >)'); 
            
            if (nextButton) {
                await nextButton.click();
                // Wait for network to settle to ensure new data is loaded
                await page.waitForNetworkIdle();
                pageNum++;
            } else {
                hasNextPage = false;
                console.log('No more pages found.');
            }
        }

        // --- EXPORT LOGIC ---

        // 1. Save as JSONL 
        const outputPathJSONL = path.join(__dirname, '../output/veterinarians.jsonl');
        const jsonlContent = allResults.map(record => JSON.stringify(record)).join('\n');
        fs.writeFileSync(outputPathJSONL, jsonlContent);

        // 2. Save as 
        const outputPathCSV = path.join(__dirname, '../output/veterinarians.csv');
        const headers = Object.keys(allResults[0]).join(',');
        const csvRows = allResults.map(row => Object.values(row).map(val => `"${val}"`).join(','));
        const csvContent = [headers, ...csvRows].join('\n');
        fs.writeFileSync(outputPathCSV, csvContent);
        
        console.log(`✅ Success! Extracted ${allResults.length} total records.`);
        console.log(`Files saved to: \n - ${outputPathJSONL} \n - ${outputPathCSV}`);

    } catch (error) {
        console.error('Execution Error:', error);
    } finally {
        if (browser) await browser.close();
        console.log('Browser closed.');
    }
}

main();