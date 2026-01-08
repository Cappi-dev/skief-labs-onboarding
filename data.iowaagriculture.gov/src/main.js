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
            const nextButton = await page.$('button::-p-text(Next >)'); // Specific Puppeteer selector for text
            
            if (nextButton) {
                await nextButton.click();
                // Wait for the table to update/network to settle
                await page.waitForNetworkIdle();
                pageNum++;
            } else {
                hasNextPage = false;
                console.log('No more pages found.');
            }
        }

        const outputPath = path.join(__dirname, '../output/veterinarians.json');
        fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
        
        console.log(`✅ Success! Extracted ${allResults.length} total records to output/veterinarians.json`);

    } catch (error) {
        console.error('Execution Error:', error);
    } finally {
        if (browser) await browser.close();
    }
}

main();