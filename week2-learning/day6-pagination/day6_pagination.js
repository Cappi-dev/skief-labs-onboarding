const { chromium } = require('playwright');
const fs = require('fs');

async function scrapeQuotes() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    let currentPage = 'https://quotes.toscrape.com';
    const allQuotes = [];

    console.log('--- Day 6: Pagination Task Starting ---');

    while (currentPage) {
        console.log(`Scraping: ${currentPage}`);
        await page.goto(currentPage);
        
        // Extract data using CSS selectors
        const quotesOnPage = await page.$$eval('.quote', elements => {
            return elements.map(el => ({
                text: el.querySelector('.text').innerText.replace(/[“”]/g, ''),
                author: el.querySelector('.author').innerText
            }));
        });

        allQuotes.push(...quotesOnPage);

        // Identify "Next" button selector: li.next a
        const nextButton = await page.$('li.next a');
        if (nextButton) {
            const nextUrl = await nextButton.getAttribute('href');
            currentPage = `https://quotes.toscrape.com${nextUrl}`;
        } else {
            currentPage = null; 
        }
    }

    // --- PREPARE DATA FOR EXPORT ---
    const scrapedAt = new Date().toISOString();
    const sourceUrl = 'https://quotes.toscrape.com';

    const finalData = allQuotes.map(q => ({
        quoteText: q.text,
        authorName: q.author,
        sourceUrl: sourceUrl,
        scrapedAt: scrapedAt
    }));

    // Ensure output directory exists
    if (!fs.existsSync('output')) {
        fs.mkdirSync('output');
    }

    // --- EXPORT TO CSV ---
    const csvHeader = 'quoteText,authorName,sourceUrl,scrapedAt\n';
    const csvRows = finalData.map(q => 
        `"${q.quoteText.replace(/"/g, '""')}","${q.authorName}","${q.sourceUrl}","${q.scrapedAt}"`
    ).join('\n');
    
    // Using the required naming convention for the file
    fs.writeFileSync('output/output_quotes.toscrape.com_quotes_2026.csv', csvHeader + csvRows);

    // --- EXPORT TO JSONL ---
    const jsonlData = finalData.map(q => JSON.stringify(q)).join('\n');
    fs.writeFileSync('output/output_quotes.toscrape.com_quotes_2026.jsonl', jsonlData);
    
    console.log(`✅ Success! Extracted ${allQuotes.length} quotes.`);
    console.log(`📂 Files saved to /output with camelCase headers.`);
    await browser.close();
}

scrapeQuotes();