const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://quotes.toscrape.com/js/');
    
    // Captures the rendered page for documentation
    await page.screenshot({ path: 'puppeteer_screenshot.png' });

    console.log('Screenshot saved!');
    await browser.close();
})();