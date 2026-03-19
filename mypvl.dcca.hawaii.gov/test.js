import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import { Parser } from 'json2csv';

chromium.use(stealthPlugin());

const PREFIXES = ['VE', 'VT', 'VECR'];
const MAX_CONSECUTIVE_EMPTY = 100;
const STATE_FILE = 'state.json';
const JSONL_FILE = 'hawaii_data.jsonl';
const CSV_FILE = 'hawaii_data.csv';

function loadState() {
    if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE));
    return { prefixIndex: 0, lastCounter: 1 };
}

function saveState(prefixIndex, lastCounter) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ prefixIndex, lastCounter }));
}

function updateCSV() {
    try {
        const jsonlData = fs.readFileSync(JSONL_FILE, 'utf8')
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
        
        // Define only the columns you want to see in EXCEL
        const cleanData = jsonlData.map(item => ({
            licenseId: item.licenseId,
            licenseType: item.licenseType,
            fullName: item.fullName,
            status: item.status,
            entityType: item.entityType,
            activeInactive: item.activeInactive,
            originalLicenseDate: item.originalLicenseDate,
            expirationDate: item.expirationDate,
            pageUrl: item.pageUrl,
            scrapedAt: item.scrapedAt
        }));

        const parser = new Parser();
        const csv = parser.parse(cleanData);
        fs.writeFileSync(CSV_FILE, csv);
    } catch (e) {
        console.error("CSV Update failed:", e.message);
    }
}

async function scrapeHawaii() {
    const state = loadState();
    const browser = await chromium.launch({ headless: false }); 
    const context = await browser.newContext();
    const page = await context.newPage();

    for (let pIdx = state.prefixIndex; pIdx < PREFIXES.length; pIdx++) {
        const prefix = PREFIXES[pIdx];
        let counter = (pIdx === state.prefixIndex) ? state.lastCounter : 1;
        let consecutiveEmpty = 0;

        while (consecutiveEmpty < MAX_CONSECUTIVE_EMPTY) {
            const licenseIdFull = `${prefix}-${counter}-0`;
            const url = `https://mypvl.dcca.hawaii.gov/public-license-details/?licenseId=${licenseIdFull}`;
            
            try {
                console.log(`🔍 Checking ${licenseIdFull}...`);
                await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

                if (await page.isVisible('text=Verify you are human')) {
                    console.log("🛑 Solve Captcha manually...");
                    await page.waitForSelector('h2:has-text("General License")', { timeout: 0 });
                }

                const nameElement = page.locator('p:near(div:text("Legal License Name"))').first();
                const rawName = (await nameElement.isVisible()) ? await nameElement.innerText() : "";

                if (rawName.trim() && rawName.trim() !== "--") {
                    // 1. Helper function to grab text by label
                    const getByLabel = async (label) => {
                        return await page.locator(`p:near(div:text("${label}"))`).first().innerText().catch(() => "");
                    };

                    // 2. Extraction for the Dropdown Lists (stored as JSON strings)
                    // We check if the table exists, then grab the text
                    const getTableData = async (selector) => {
                        return await page.locator(selector).innerText().catch(() => "[]");
                    };

                    const data = {
                        licenseId: await getByLabel("License ID"),
                        licenseType: await getByLabel("License Type"),
                        fullName: rawName.trim(),
                        status: await getByLabel("Status"),
                        entityType: await getByLabel("Entity Type"),
                        activeInactive: await getByLabel("Active/Inactive"),
                        originalLicenseDate: await getByLabel("Original License Date"),
                        expirationDate: await getByLabel("Expiration Date"),
                        restriction: await getByLabel("Restriction"),
                        tradeProfessionalName: await getByLabel("Trade/Professional Name"),
                        specialPrivilege: await getByLabel("Special Privilege"),
                        conditionsLimitations: await getByLabel("Conditions & Limitations"),
                        classPrefix: await getByLabel("Class Prefix"),
                        businessCode: await getByLabel("Business Code"),
                        businessAddress: await page.locator('#business-address-display').innerText().catch(() => ""),
                        
                        // Nested Data (Dropdowns)
                        employeesList: await getTableData('#employees-table'),
                        employersList: await getTableData('#employer-table'),
                        insuranceBond: await getTableData('#insurance-bond-table'),
                        licenseClasses: await getTableData('#license-classes-table'),
                        
                        sourceUrl: "https://mypvl.dcca.hawaii.gov/public-license-search/",
                        pageUrl: url,
                        scrapedAt: new Date().toISOString()
                    };

                    console.log(`✅ SAVED: ${data.fullName}`);
                    fs.appendFileSync(JSONL_FILE, JSON.stringify(data) + '\n');
                    updateCSV();
                    consecutiveEmpty = 0;
                } else {
                    console.log(`❌ Empty`);
                    consecutiveEmpty++;
                }

                counter++;
                saveState(pIdx, counter);
                await page.waitForTimeout(Math.floor(Math.random() * 1000) + 500);

            } catch (err) {
                console.log(`⚠️ Error on ${licenseIdFull}: ${err.message}`);
                await page.waitForTimeout(5000);
            }
        }
        console.log(`🏁 Finished Prefix ${prefix}`);
        saveState(pIdx + 1, 1);
    }
    await browser.close();
}

scrapeHawaii();