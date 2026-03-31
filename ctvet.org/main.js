const puppeteer = require('puppeteer');
const fs = require('fs');

const START_URL = "https://ctvet.org/search/custom.asp?id=7164";
const CSV_FILE = 'connecticut_vets.csv';
const JSONL_FILE = 'connecticut_vets.jsonl';

function appendToFile(data) {
    fs.appendFileSync(JSONL_FILE, JSON.stringify(data) + '\n');
    const headers = ["vetName", "clinicName", "phone", "mobilePhone", "email", "location", "sourceUrl", "scrapedAt"];
    const row = headers.map(h => `"${(data[h] || "").toString().replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(',');
    fs.appendFileSync(CSV_FILE, row + '\n');
}

async function scrapeConnecticut() {
    console.log("🚀 Launching Master Scraper...");

    // Initialize CSV with headers if it doesn't exist
    if (!fs.existsSync(CSV_FILE)) {
        fs.writeFileSync(CSV_FILE, "vetName,clinicName,phone,mobilePhone,email,location,sourceUrl,scrapedAt\n");
    }

    const browser = await puppeteer.launch({ 
        headless: false, 
        args: ['--no-sandbox', '--disable-web-security'] 
    });
    
    const page = await browser.newPage();
    const scrapedAt = new Date().toISOString();

    try {
        await page.setViewport({ width: 1280, height: 1000 });
        console.log("📥 Loading Search Page...");
        await page.goto(START_URL, { waitUntil: 'networkidle2' });

        console.log("🖱️ Submitting Search...");
        await page.waitForSelector('input.formbutton');
        await page.click('input.formbutton');

        console.log("⏳ Waiting for Results Iframe...");
        const frameHandle = await page.waitForSelector('#SearchResultsFrame', { visible: true, timeout: 60000 });
        const frame = await frameHandle.contentFrame();

        let pageNum = 1;
        let hasNextPage = true;

        while (hasNextPage) {
            console.log(`\n📄 --- PROCESSING PAGE ${pageNum} ---`);
            
            // Wait for links to be visible inside the frame
            await frame.waitForSelector('a[href*="id="]', { timeout: 60000 });
            
            // Get all unique profile links on this page
            const pageLinks = await frame.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a'));
                return [...new Set(anchors
                    .map(a => a.href)
                    .filter(href => href.includes('members/default.asp?id=') || href.includes('members/?id='))
                )];
            });

            console.log(`🔗 Found ${pageLinks.length} profiles on page ${pageNum}.`);

            for (let i = 0; i < pageLinks.length; i++) {
                const url = pageLinks[i];
                process.stdout.write(`⏳ Scraping ${i + 1}/${pageLinks.length} on page ${pageNum}...\r`);
                
                const detailPage = await browser.newPage();
                try {
                    await detailPage.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                    const data = await detailPage.evaluate((sourceUrl, time) => {
                        const name = document.getElementById('SpTitleBar')?.innerText.trim() || "";
                        const employerBlock = document.getElementById('tdEmployerName');
                        
                        let clinic = "N/A";
                        if (employerBlock) {
                            const clinicLink = document.querySelector('a[href*="cdlCustomFieldValueIDEmployer"]');
                            clinic = clinicLink ? clinicLink.innerText.trim() : "N/A";
                        }

                        const phoneWork = document.getElementById('tdWorkPhone')?.innerText.replace('(Phone)', '').trim() || "";
                        const phoneHome = document.getElementById('tdHomePhone')?.innerText.replace('(Mobile)', '').trim() || "";
                        const city = document.querySelector('a[href*="txt_city"]')?.innerText.trim() || "";

                        return {
                            vetName: name,
                            clinicName: clinic,
                            phone: phoneWork || phoneHome,
                            mobilePhone: phoneHome,
                            email: "", 
                            location: city,
                            sourceUrl: sourceUrl,
                            scrapedAt: time
                        };
                    }, url, scrapedAt);

                    appendToFile(data);
                    await detailPage.close();
                    await new Promise(r => setTimeout(r, 200)); 
                } catch (err) {
                    await detailPage.close();
                }
            }

            // --- FIXED PAGINATION LOGIC ---
            console.log(`\n⏭️ Attempting to navigate to Page ${pageNum + 1}...`);
            
            const firstVetBefore = pageLinks[0];

            const clicked = await frame.evaluate((currentPage) => {
                const nextNum = String(currentPage + 1);
                const buttons = Array.from(document.querySelectorAll('button.btn-default'));
                
                // Strategy 1: Look for the exact button number (e.g., "2", "3")
                const exactPageBtn = buttons.find(b => b.innerText.trim() === nextNum);
                if (exactPageBtn) {
                    exactPageBtn.click();
                    return true;
                }
                
                // Strategy 2: Look for the right arrow icon
                const rightArrowBtn = buttons.find(b => b.querySelector('i.fa-arrow-right'));
                if (rightArrowBtn) {
                    rightArrowBtn.click();
                    return true;
                }
                
                return false;
            }, pageNum);

            if (clicked) {
                pageNum++;
                // Wait for the first link to change (confirming page load)
                try {
                    await frame.waitForFunction((oldFirst) => {
                        const firstLink = document.querySelector('a[href*="id="]')?.href;
                        return firstLink && firstLink !== oldFirst;
                    }, { timeout: 30000 }, firstVetBefore);
                    console.log("✅ Page loaded successfully.");
                } catch (e) {
                    console.log("⚠️ Page transition slow or failed. Trying to recover...");
                    await new Promise(r => setTimeout(r, 5000));
                }
            } else {
                console.log("🏁 No additional pages found. Scraping finished.");
                hasNextPage = false;
            }
        }

        console.log(`\n🎉 SUCCESS! All pages processed.`);

    } catch (error) {
        console.error("\n❌ Critical Error:", error.message);
    } finally {
        await browser.close();
    }
}

scrapeConnecticut();