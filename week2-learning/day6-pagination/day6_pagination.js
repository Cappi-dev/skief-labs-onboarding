const { chromium } = require('playwright');
const fs = require('fs');

async function scrapeQuotes() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    let currentPage = 'https://quotes.toscrape.com';
    const allQuotes = [];

    console.log('--- Day 6: Pagination Task Starting ---');

    while (currentPage) {
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

    // Export to CSV
    const csvHeader = 'Quote,Author\n';
    const csvRows = allQuotes.map(q => `"${q.text.replace(/"/g, '""')}","${q.author}"`).join('\n');

    fs.writeFileSync('output/day6_quotes.csv', csvHeader + csvRows);
    
    console.log(`✅ Success! Extracted ${allQuotes.length} quotes.`);
    await browser.close();
}

scrapeQuotes();