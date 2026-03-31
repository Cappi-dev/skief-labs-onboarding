const puppeteer = require('puppeteer');
const fs = require('fs');

const START_URL = "https://kvma.site-ym.com/search/custom.asp?id=1821";
const CSV_FILE = 'kentucky_vets.csv';
const JSONL_FILE = 'kentucky_vets.jsonl';

function appendToFile(data) {
    fs.appendFileSync(JSONL_FILE, JSON.stringify(data) + '\n');
    const headers = [
        "vetName", 
        "clinicName", 
        "profession", 
        "specialtyCode", 
        "county", 
        "phone", 
        "mobilePhone", 
        "email", 
        "location", 
        "sourceUrl", 
        "scrapedAt"
    ];
    const row = headers.map(h => `"${(data[h] || "").toString().replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(',');
    fs.appendFileSync(CSV_FILE, row + '\n');
}

async function scrapeKentucky() {
    console.log("Launching Kentucky Master Scraper...");

    if (!fs.existsSync(CSV_FILE)) {
        const headers = "vetName,clinicName,profession,specialtyCode,county,phone,mobilePhone,email,location,sourceUrl,scrapedAt\n";
        fs.writeFileSync(CSV_FILE, headers);
    }

    const browser = await puppeteer.launch({ 
        headless: false, 
        args: ['--no-sandbox', '--disable-web-security'] 
    });
    
    const page = await browser.newPage();
    const scrapedAt = new Date().toISOString();

    try {
        await page.setViewport({ width: 1280, height: 1000 });
        console.log("Loading Kentucky Search Page...");
        await page.goto(START_URL, { waitUntil: 'networkidle2' });

        console.log("Submitting Search...");
        await page.waitForSelector('input.formbutton');
        await page.click('input.formbutton');

        console.log("Waiting for Results Iframe...");
        const frameHandle = await page.waitForSelector('#SearchResultsFrame', { visible: true, timeout: 60000 });
        const frame = await frameHandle.contentFrame();

        let pageNum = 1;
        let hasNextPage = true;

        while (hasNextPage) {
            console.log(`\n--- PROCESSING PAGE ${pageNum} ---`);
            
            await frame.waitForSelector('a[href*="id="]', { timeout: 60000 });
            
            const pageLinks = await frame.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a'));
                return [...new Set(anchors
                    .map(a => a.href)
                    .filter(href => href.includes('members/default.asp?id=') || href.includes('members/?id='))
                )];
            });

            console.log(`Found ${pageLinks.length} profiles on page ${pageNum}.`);

            for (let i = 0; i < pageLinks.length; i++) {
                const url = pageLinks[i];
                process.stdout.write(`Scraping profile ${i + 1}/${pageLinks.length} on page ${pageNum}...\r`);
                
                const detailPage = await browser.newPage();
                try {
                    await detailPage.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                    const data = await detailPage.evaluate((sourceUrl, time) => {
                        const name = document.getElementById('SpTitleBar') ? document.getElementById('SpTitleBar').innerText.trim() : "";
                        const employerBlock = document.getElementById('tdEmployerName');
                        
                        let clinic = "N/A";
                        let location = "N/A";
                        
                        if (employerBlock) {
                            const clinicLink = employerBlock.querySelector('a[href*="txt_employName"]');
                            clinic = clinicLink ? clinicLink.innerText.trim() : "N/A";

                            const cityNode = employerBlock.querySelector('a[href*="txt_city"]');
                            const stateNode = employerBlock.querySelector('a[href*="txt_state"]');
                            const city = cityNode ? cityNode.innerText.trim() : "";
                            const state = stateNode ? stateNode.innerText.trim() : "";
                            
                            const zipMatch = employerBlock.innerText.match(/\b\d{5}(?:-\d{4})?\b/);
                            const zip = zipMatch ? zipMatch[0] : "";

                            const locationParts = [];
                            if (city) locationParts.push(city);
                            if (state) locationParts.push(state);
                            if (zip) locationParts.push(zip);

                            location = locationParts.length > 0 ? locationParts.join(", ") : "N/A";
                        }

                        const tdWorkPhone = document.getElementById('tdWorkPhone');
                        let phoneWork = tdWorkPhone ? tdWorkPhone.innerText.split('(Phone)')[0].trim() : "";

                        const tdHomePhone = document.getElementById('tdHomePhone');
                        let phoneHome = tdHomePhone ? tdHomePhone.innerText.split('(Mobile)')[0].trim() : "";

                        const tdWorkType = document.getElementById('tdWorkType');
                        const profession = tdWorkType ? tdWorkType.innerText.trim() : "N/A";

                        let specialtyCode = "N/A";
                        let county = "N/A";
                        
                        const labels = Array.from(document.querySelectorAll('.CstmFldLbl'));
                        labels.forEach(label => {
                            if (label.innerText.includes('Specialty Code')) {
                                specialtyCode = label.parentElement.nextElementSibling ? label.parentElement.nextElementSibling.innerText.trim() : "N/A";
                            }
                            if (label.innerText.includes('County Name')) {
                                county = label.parentElement.nextElementSibling ? label.parentElement.nextElementSibling.innerText.trim() : "N/A";
                            }
                        });

                        return {
                            vetName: name,
                            clinicName: clinic,
                            profession: profession,
                            specialtyCode: specialtyCode,
                            county: county,
                            phone: phoneWork || phoneHome,
                            mobilePhone: phoneHome,
                            email: "", 
                            location: location,
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

            console.log(`\nAttempting to navigate to Page ${pageNum + 1}...`);
            const firstVetBefore = pageLinks[0];

            const clicked = await frame.evaluate((currentPage) => {
                const nextNum = String(currentPage + 1);
                
                const buttons = Array.from(document.querySelectorAll('button.btn-default, a.btn-default'));
                const exactPageBtn = buttons.find(b => b.innerText.trim() === nextNum);
                if (exactPageBtn) {
                    exactPageBtn.click();
                    return true;
                }
                
                const rightArrowBtn = buttons.find(b => b.querySelector('i.fa-arrow-right') || b.innerText.includes('Next') || b.innerText.includes('»'));
                if (rightArrowBtn) {
                    rightArrowBtn.click();
                    return true;
                }

                const pagerLinks = Array.from(document.querySelectorAll('tr.DotNetPager a'));
                const exactLink = pagerLinks.find(a => a.innerText.trim() === nextNum);
                if (exactLink) {
                    exactLink.click();
                    return true;
                }

                const nextIconLink = pagerLinks.find(a => a.querySelector('img[src*="pageRight.gif"]'));
                if (nextIconLink) {
                    nextIconLink.click();
                    return true;
                }
                
                return false;
            }, pageNum);

            if (clicked) {
                pageNum++;
                try {
                    await frame.waitForFunction((oldFirst) => {
                        const firstElement = document.querySelector('a[href*="id="]');
                        return firstElement && firstElement.href !== oldFirst;
                    }, { timeout: 30000 }, firstVetBefore);
                    console.log("Page loaded successfully.");
                } catch (e) {
                    console.log("Page transition slow or failed. Waiting extra 5 seconds...");
                    await new Promise(r => setTimeout(r, 5000));
                }
            } else {
                console.log("No more pages found. Scraping finished.");
                hasNextPage = false;
            }
        }

        console.log(`\nDONE! Check ${CSV_FILE} and ${JSONL_FILE}.`);

    } catch (error) {
        console.error("\nCritical Error:", error.message);
    } finally {
        await browser.close();
    }
}

scrapeKentucky();