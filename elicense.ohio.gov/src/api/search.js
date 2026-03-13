import { initSession } from './client.js';
import * as cheerio from 'cheerio';

async function runSearch() {
    const { browser, page } = await initSession();

    console.log("\n🤖 Automating the Salesforce Search...");

    try {
        // 1. Select the Board
        console.log("🔽 Selecting 'Veterinary Medical Board'...");
        await page.evaluate(() => {
            const boardSelect = document.querySelector('select[name="j_id0:j_id122:board"]');
            for (let i = 0; i < boardSelect.options.length; i++) {
                if (boardSelect.options[i].text.includes('Veterinary Medical Board')) {
                    boardSelect.selectedIndex = i;
                    boardSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                }
            }
        });

        console.log("⏳ Waiting 3 seconds for License Types to populate...");
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 2. Select the License Type
        console.log("🔽 Selecting 'Veterinary' License Type...");
        await page.evaluate(() => {
            const typeSelect = document.querySelector('select[name="j_id0:j_id122:licenseType"]');
            for (let i = 0; i < typeSelect.options.length; i++) {
                if (typeSelect.options[i].text === 'Veterinary') {
                    typeSelect.selectedIndex = i;
                    typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                }
            }
        });

        console.log("⏳ Waiting 2 seconds before typing...");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 🎯 3. NEW: Type "A" in the Last Name box
        console.log("🔤 Typing 'A' into the Last Name field to avoid the 500-record limit...");
        await page.evaluate(() => {
            // Find all text inputs and look for the one designated for "last name"
            const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
            const lastNameInput = inputs.find(inp => inp.name && inp.name.toLowerCase().includes('last'));
            if (lastNameInput) {
                lastNameInput.value = 'A';
                // Trigger the input events so Salesforce registers the keystroke
                lastNameInput.dispatchEvent(new Event('input', { bubbles: true }));
                lastNameInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // 4. Click the Search Button
        console.log("🖱️ Clicking the Search button...");
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('input, button'));
            const searchBtn = btns.find(b => 
                (b.value && b.value.toLowerCase().includes('search')) || 
                (b.innerText && b.innerText.toLowerCase().includes('search'))
            );
            if (searchBtn) searchBtn.click();
        });

        console.log("⏳ Waiting 8 seconds for the server to return the list of Veterinarians...");
        await new Promise(resolve => setTimeout(resolve, 8000));

        // 🛡️ 5. NEW: Auto-Dismiss Popup Shield
        console.log("🛡️ Checking for any remaining popups to clear...");
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
            const okBtn = btns.find(b => (b.innerText && b.innerText.trim().toLowerCase() === 'ok') || (b.value && b.value.trim().toLowerCase() === 'ok'));
            if (okBtn && okBtn.offsetParent !== null) { 
                okBtn.click(); // Force click the 'Ok' button to move it out of the way
            }
        });

        // 6. Check what we found!
        const html = await page.content();
        const $ = cheerio.load(html);

        const rows = $('table tr');
        console.log(`\n🎉 SEARCH COMPLETE! Found ${rows.length} rows.`);

        console.log("\n📊 Inspecting the first 3 rows of data:");
        
        // Loop through the first 3 rows and print their columns
        rows.slice(0, 3).each((i, row) => {
            const columns = [];
            $(row).find('th, td').each((j, col) => {
                // Clean up the text by removing extra line breaks and spaces
                let text = $(col).text().replace(/\s+/g, ' ').trim();
                if (text) columns.push(text);
            });
            console.log(`Row ${i}: [ ${columns.join(' | ')} ]`);
            
            // Look for any hidden profile links or buttons in this row
            const link = $(row).find('a').attr('href');
            if (link) {
                console.log(`   🔗 Found Link: ${link}`);
            }
        });

    } catch (e) {
        console.error("❌ Error during search automation:", e.message);
    } finally {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await browser.close();
        console.log("👻 Browser closed.");
    }
}

runSearch();