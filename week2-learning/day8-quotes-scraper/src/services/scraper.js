const puppeteer = require('puppeteer');

async function getQuotesFromPage(url) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.quote');
        const data = await page.evaluate(() => {
            const quoteNodes = document.querySelectorAll('.quote');
            const extracted = [];
            quoteNodes.forEach(node => {
                extracted.push({
                    text: node.querySelector('.text')?.innerText.replace(/[“”]/g, ''),
                    author: node.querySelector('.author')?.innerText,
                    tags: Array.from(node.querySelectorAll('.tag')).map(t => t.innerText).join('; ')
                });
            });
            const nextBtn = document.querySelector('.next > a');
            return { extracted, nextUrl: nextBtn ? nextBtn.href : null };
        });
        await browser.close();
        return data;
    } catch (error) {
        console.error('❌ Scraper Error:', error.message);
        if (browser) await browser.close();
        return { extracted: [], nextUrl: null };
    }
}

module.exports = { getQuotesFromPage };