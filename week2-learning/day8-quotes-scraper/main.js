const { getQuotesFromPage } = require('./src/services/scraper');
const fs = require('fs');
const { Parser } = require('json2csv');
const path = require('path');

async function run() {
    const DOMAIN = 'quotes.toscrape.com';
    const YEAR = '2026';
    let targetUrl = `https://${DOMAIN}/js/`;
    let finalData = [];
    
    console.log(`🚀 Starting Day 8: Dynamic Scraper [${DOMAIN}]`);

    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const jsonlPath = path.join(outputDir, `output_${DOMAIN}_quotes_${YEAR}.jsonl`);
    const csvPath = path.join(outputDir, `output_${DOMAIN}_quotes_${YEAR}.csv`);

    // Clear old files if they exist for a fresh run
    if (fs.existsSync(jsonlPath)) fs.unlinkSync(jsonlPath);

    while (targetUrl) {
        console.log(`🔍 Scraping: ${targetUrl}`);
        const { extracted, nextUrl } = await getQuotesFromPage(targetUrl);
        
        extracted.forEach(quote => {
            // Append to JSONL line by line
            fs.appendFileSync(jsonlPath, JSON.stringify(quote) + '\n');
            finalData.push(quote);
        });

        targetUrl = nextUrl; 

        if (targetUrl) {
            const wait = Math.floor(Math.random() * 2000) + 2000;
            await new Promise(r => setTimeout(r, wait));
        }
    }

    // Save Professional CSV
    const fields = [
       { label: 'quoteText', value: 'text' },
    { label: 'authorName', value: 'author' },
    { label: 'categoryTags', value: 'tags' }
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(finalData);
    fs.writeFileSync(csvPath, csv);

    console.log(`\n🏁 Done! Scraped ${finalData.length} quotes.`);
    console.log(`📂 JSONL: ${path.basename(jsonlPath)}`);
    console.log(`📂 CSV: ${path.basename(csvPath)}`);
}

run().catch(err => console.error("Critical Error:", err));