import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function runTestSearch() {
    console.log("🚀 Launching Virginia Test Strike...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        console.log("📡 Navigating to Virginia DHP...");
        await page.goto('https://dhp.virginiainteractive.org/Lookup/Index', { waitUntil: 'networkidle2' });
        
        // 1. Select the Occupation (Veterinarian)
        console.log("🔽 Selecting Occupation: Veterinarian...");
        await page.evaluate(() => {
            const select = document.querySelector('#OccupationId');
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].text === 'Veterinarian') {
                    select.selectedIndex = i;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                }
            }
        });
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for any AJAX to load

        // 2. Select the State (Alaska - keeping it small to avoid the limit)
        console.log("🔽 Selecting State: Alaska...");
        await page.evaluate(() => {
            const select = document.querySelector('#State');
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].text === 'Alaska') {
                    select.selectedIndex = i;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                }
            }
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. Click the CORRECT Search button (The one tied to Occupation)
        console.log("🖱️ Clicking the correct Search button...");
        await page.evaluate(() => {
            // Find the Occupation dropdown
            const occDropdown = document.querySelector('#OccupationId');
            // Find the specific form that wraps this dropdown
            const parentForm = occDropdown.closest('form');
            // Find and click the Search button INSIDE this specific form
            const searchBtn = parentForm.querySelector('input[type="submit"][value="Search"], button');
            if (searchBtn) searchBtn.click();
        });

        console.log("⏳ Waiting for results to load...");
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // 4. Analyze the Results
        const html = await page.content();
        const $ = cheerio.load(html);

        // Check for the "Too many records" error you discovered!
        if (html.includes('too many records')) {
            console.log("⚠️ TRIGGERED THE LIMIT: Your search returned too many records.");
            return;
        }

        const rows = $('table tr');
        console.log(`\n🎉 SEARCH COMPLETE! Found ${rows.length} rows.`);

        console.log("\n📊 Inspecting the first 3 rows of data:");
        rows.slice(0, 3).each((i, row) => {
            const columns = [];
            $(row).find('th, td').each((j, col) => {
                let text = $(col).text().replace(/\s+/g, ' ').trim();
                if (text) columns.push(text);
            });
            console.log(`Row ${i}: [ ${columns.join(' | ')} ]`);
            
            // Check if there is a profile link we need to click
            const link = $(row).find('a').attr('href');
            if (link) {
                console.log(`   🔗 Found Profile Link: ${link}`);
            }
        });

    } catch (e) {
        console.error("❌ Error during test search:", e.message);
    } finally {
        await browser.close();
        console.log("👻 Browser closed.");
    }
}

runTestSearch();