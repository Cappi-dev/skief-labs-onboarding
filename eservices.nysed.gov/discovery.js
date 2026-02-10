const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    console.log("🕵️ Navigating directly to License #000001 Profile...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Direct URL pattern found in search results:
        // professionCode 075 = Veterinarian
        const targetUrl = 'https://eservices.nysed.gov/professions/verification-search?licenseNumber=000001&professionCode=075';
        
        await page.goto(targetUrl, { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });

        // Wait a few seconds to ensure any AJAX/Loading spinners finish
        await new Promise(r => setTimeout(r, 5000));

        const html = await page.content();
        fs.writeFileSync('discovery_000001.html', html);
        
        if (html.includes('COMSTOCK DAVID B')) {
            console.log("✅ SUCCESS: Found David B. Comstock on the page!");
        } else if (html.includes('403') || html.includes('Forbidden')) {
            console.log("❌ BLOCKED: Even the direct browser link is hitting a 403.");
        } else {
            console.log("⚠️ Data not found. Check the discovery_000001.html file manually.");
        }

    } catch (error) {
        console.error("❌ Discovery Failed:", error.message);
    } finally {
        await browser.close();
    }
})();