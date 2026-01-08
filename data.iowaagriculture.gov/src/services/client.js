const puppeteer = require('puppeteer');

/**
 * Service to handle browser automation for Iowa Veterinarians site
 */
async function fetchVeterinarianPage() {
    const browser = await puppeteer.launch({ headless: false }); // Set to false so you can see it work
    const page = await browser.newPage();
    
    console.log('Navigating to Iowa Veterinarian List...');
    await page.goto('https://data.iowaagriculture.gov/licensing_lists/veterinarians/', {
        waitUntil: 'networkidle2'
    });

    // We return both the page and browser so we can close it later in main.js
    return { browser, page };
}

module.exports = { fetchVeterinarianPage };