import { initSession } from './src/api/client.js';
import { loadExistingRecords, saveRecord, loadState, saveState } from './src/utils/io.js';
import * as cheerio from 'cheerio';

const LICENSE_TYPES = [
    'Limited Veterinary License', 
    'Limited Veterinary Resident License', 
    'Provisional Graduate License',
    'Registered Veterinary Technician', 
    'Temporary Vet Permit',
    'Veterinary'
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

async function runMasterScraper() {
    console.log("🚀 STARTING OHIO MASTER SCRAPER...");
    
    const existingLicenses = loadExistingRecords();
    const state = loadState();
    let startTypeIdx = state.typeIndex;
    let startLetterIdx = state.letterIndex;

    const { browser, page } = await initSession();

    try {
        for (let i = startTypeIdx; i < LICENSE_TYPES.length; i++) {
            const licenseType = LICENSE_TYPES[i];
            console.log(`\n========================================`);
            console.log(`🎯 CURRENT LICENSE TYPE: ${licenseType}`);
            console.log(`========================================`);

            let startingJ = (i === startTypeIdx) ? startLetterIdx : 0;

            for (let j = startingJ; j < ALPHABET.length; j++) {
                const letter = ALPHABET[j];
                console.log(`\n🔤 Searching '${licenseType}' - Last Name: '${letter}'`);
                
                try {
                    await page.goto('https://elicense.ohio.gov/oh_verifylicense', { waitUntil: 'domcontentloaded' });
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    // Bypass disclaimer
                    await page.evaluate(() => {
                        const btns = Array.from(document.querySelectorAll('input, button'));
                        const continueBtn = btns.find(b => (b.value && b.value.toLowerCase().includes('continue')) || (b.innerText && b.innerText.toLowerCase().includes('continue')));
                        if (continueBtn) continueBtn.click();
                    });
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // 1. Select Board
                    await page.evaluate(() => {
                        const boardSelect = document.querySelector('select[name="j_id0:j_id122:board"]');
                        if (boardSelect) {
                            for (let k = 0; k < boardSelect.options.length; k++) {
                                if (boardSelect.options[k].text.includes('Veterinary Medical Board')) {
                                    boardSelect.selectedIndex = k;
                                    boardSelect.dispatchEvent(new Event('change', { bubbles: true }));
                                    break;
                                }
                            }
                        }
                    });

                    // ⏳ Wait for License Type dropdown to populate
                    await new Promise(resolve => setTimeout(resolve, 4000));

                    // 2. Select License Type
                    const typeSelected = await page.evaluate((type) => {
                        const typeSelect = document.querySelector('select[name="j_id0:j_id122:licenseType"]');
                        if (typeSelect && typeSelect.options.length > 1) {
                            for (let k = 0; k < typeSelect.options.length; k++) {
                                if (typeSelect.options[k].text === type) {
                                    typeSelect.selectedIndex = k;
                                    typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                                    return true;
                                }
                            }
                        }
                        return false;
                    }, licenseType);

                    if (!typeSelected) {
                        console.log(`⚠️ Could not find or select License Type: ${licenseType}. Retrying...`);
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    }

                    // 3. Type Letter
                    await page.evaluate((lettr) => {
                        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
                        const lastNameInput = inputs.find(inp => inp.name && inp.name.toLowerCase().includes('last'));
                        if (lastNameInput) {
                            lastNameInput.value = lettr;
                            lastNameInput.dispatchEvent(new Event('input', { bubbles: true }));
                            lastNameInput.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }, letter);

                    // 4. Search
                    await page.evaluate(() => {
                        const btns = Array.from(document.querySelectorAll('input, button'));
                        const searchBtn = btns.find(b => (b.value && b.value.toLowerCase().includes('search')) || (b.innerText && b.innerText.toLowerCase().includes('search')));
                        if (searchBtn) searchBtn.click();
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 8000));

                    // --- PAGINATION LOOP ---
                    let hasNextPage = true;
                    let pageNum = 1;

                    while (hasNextPage) {
                        console.log(`📄 Processing Page ${pageNum} for letter ${letter}...`);

                        // Check for 500+ popup or blockers
                        await page.evaluate(() => {
                            const btns = Array.from(document.querySelectorAll('button, input[type="button"]'));
                            const okBtn = btns.find(b => (b.innerText && b.innerText.trim().toLowerCase() === 'ok') || (b.value && b.value.trim().toLowerCase() === 'ok'));
                            if (okBtn && okBtn.offsetParent !== null) okBtn.click(); 
                        });

                        const html = await page.content();
                        const $ = cheerio.load(html);
                        const rows = $('table tr');
                        
                        if (rows.length > 1) {
                            console.log(`📊 Found ${rows.length - 1} profiles on page ${pageNum}.`);

                            for (let r = 1; r < rows.length; r++) {
                                const row = rows[r];
                                const name = $(row).find('td').eq(0).text().replace(/\s+/g, ' ').trim();
                                const licenseNumber = $(row).find('td').eq(2).text().replace(/\s+/g, ' ').trim();
                                const profileLink = $(row).find('a').attr('href');

                                if (!profileLink || !licenseNumber) continue;
                                if (existingLicenses.has(licenseNumber)) {
                                    console.log(`   ⏭️ Skipping: ${name} (Already scraped)`);
                                    continue;
                                }

                                console.log(`   🕵️ Extracting Profile: ${name} (${licenseNumber})`);

                                const profilePage = await browser.newPage();
                                try {
                                    await profilePage.goto('https://elicense.ohio.gov' + profileLink, { waitUntil: 'domcontentloaded', timeout: 60000 });
                                    await new Promise(resolve => setTimeout(resolve, 3500)); 
                                    
                                    const profileHtml = await profilePage.content();
                                    const $$ = cheerio.load(profileHtml);

                                    const record = {
                                        fullName: name,
                                        licenseNumber: licenseNumber,
                                        licenseType: licenseType,
                                        profileUrl: 'https://elicense.ohio.gov' + profileLink,
                                        sourceUrl: 'https://elicense.ohio.gov' + profileLink,
                                        scrapedAt: new Date().toISOString()
                                    };

                                    const labelMap = {
                                        "Status": "status",
                                        "Sub-Status": "subStatus",
                                        "Sub-Category": "subCategory",
                                        "Compact/Multi-State Eligible": "compactMultiStateEligible",
                                        "Board": "board",
                                        "License Type": "licenseType",
                                        "License Number": "licenseNumber",
                                        "License Issue Date": "licenseIssueDate",
                                        "License Effective Date": "licenseEffectiveDate",
                                        "License Expiration Date": "licenseExpirationDate",
                                        "City": "city",
                                        "State": "state",
                                        "Country": "country",
                                        "Board Action": "boardAction"
                                    };

                                    Object.entries(labelMap).forEach(([label, camelKey]) => {
                                        const labelEl = $$(`label:contains("${label}")`).filter(function() {
                                            return $$(this).text().trim() === label;
                                        }).first();

                                        if (labelEl.length > 0) {
                                            let val = labelEl.next('span').text().trim();
                                            if (!val) val = labelEl.parent().find('span').text().trim();
                                            
                                            // Header Shield: ignore values that are actually labels
                                            const forbidden = ["Sub-Status", "Sub-Category", "Board", "Compact/Multi-State Eligible"];
                                            if (forbidden.includes(val)) val = "";
                                            
                                            record[camelKey] = val.replace(/\s+/g, ' ').trim();
                                        } else {
                                            record[camelKey] = "";
                                        }
                                    });

                                    saveRecord(record);
                                    existingLicenses.add(licenseNumber);
                                } catch (pErr) {
                                    console.error(`      ❌ Profile Error: ${pErr.message}`);
                                } finally {
                                    await profilePage.close();
                                }
                            }
                        }

                        // Handle Pagination: Look for the 'next' button
                        hasNextPage = await page.evaluate(() => {
                            const nextBtn = document.querySelector('a.next, a.paginate_button.next');
                            if (nextBtn && !nextBtn.classList.contains('disabled')) {
                                nextBtn.click();
                                return true;
                            }
                            return false;
                        });

                        if (hasNextPage) {
                            pageNum++;
                            console.log(`⏳ Moving to page ${pageNum}...`);
                            await new Promise(resolve => setTimeout(resolve, 6000));
                        }
                    }

                    console.log(`✅ Finished all pages for letter ${letter}. Saving state...`);
                    let nextTypeIdx = i;
                    let nextLetterIdx = j + 1;
                    if (nextLetterIdx >= ALPHABET.length) {
                        nextTypeIdx = i + 1;
                        nextLetterIdx = 0;
                    }
                    if (nextTypeIdx < LICENSE_TYPES.length) saveState(nextTypeIdx, nextLetterIdx);

                } catch (err) {
                    console.error(`❌ Error processing letter ${letter}:`, err.message);
                }
            }
        }
    } catch (error) {
        console.error("❌ CRITICAL ERROR:", error.message);
    } finally {
        console.log("\n🏁 SCRAPE COMPLETE.");
        await browser.close();
    }
}

runMasterScraper();