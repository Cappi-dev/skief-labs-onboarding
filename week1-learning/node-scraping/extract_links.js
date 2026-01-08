const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://quotes.toscrape.com/js/');

    // Scrapes all href links from the page
    const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map(anchor => anchor.href);
    });

    // Saves structured output to JSON [cite: 145-146]
    fs.writeFileSync('links.json', JSON.stringify(links, null, 2));

    console.log('Links extracted to links.json');
    await browser.close();
})();