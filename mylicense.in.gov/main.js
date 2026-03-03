import { performInitialSearch, goToPage } from './src/api/search.js';
import { parseProfile } from './src/parser/detail.js';
import client from './src/api/client.js';
import { saveRecord, initFiles } from './src/utils/io.js';
import * as cheerio from 'cheerio';
import fs from 'fs';

const delay = (ms) => new Promise(res => setTimeout(res, ms));
const STATE_FILE = './state.json';

function saveCrawlerState(queue) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ queue }, null, 2));
}

function loadCrawlerState() {
    if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')).queue;
    }
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
}

async function startCrawl() {
    console.log("🚀 Starting Indiana Extraction - Anti-Throttling Mode...");
    initFiles();
    
    const seenRecords = new Set();
    const jsonlPath = './output/output_mylicense_in_gov_2026.jsonl';
    
    if (fs.existsSync(jsonlPath)) {
        fs.readFileSync(jsonlPath, 'utf8').split('\n').forEach(line => {
            if (!line.trim()) return;
            try { 
                const r = JSON.parse(line); 
                if (r.status) {
                    const key = `${r.licenseNo}|${r.fullName}|${r.cityStateZip}`.toLowerCase();
                    seenRecords.add(key); 
                }
            } catch(e){}
        });
    }

    let queue = loadCrawlerState();
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    while (queue.length > 0) {
        const currentFragment = queue[0];
        console.log(`🔤 Cluster: "${currentFragment}" (${queue.length} left)`);

        try {
            let html = await performInitialSearch(currentFragment);
            let $ = cheerio.load(html);
            
            const hasMoreClusters = $('a[href*="datagrid_results$_ctl44$_ctl40"]').length > 0;
            if (hasMoreClusters && currentFragment.length < 4) {
                queue.shift();
                const subLetters = alphabet.map(l => currentFragment + l);
                queue.unshift(...subLetters); 
                saveCrawlerState(queue);
                continue;
            }

            const visiblePages = $('.datagrid tr:last-child td a, .datagrid tr:last-child td span')
                                 .filter((i, el) => $(el).text().trim().match(/^\d+$/))
                                 .map((i, el) => parseInt($(el).text().trim())).get();
            const totalPages = visiblePages.length > 0 ? Math.max(...visiblePages) : 1;

            let lastPageIdentifier = "";

            for (let page = 1; page <= totalPages; page++) {
                if (page > 1) html = await goToPage(html, page);

                const $p = cheerio.load(html);
                const rows = $p('#datagrid_results > tbody > tr').filter((i, el) => $p(el).find('> td').length >= 6);
                if (rows.length === 0) break;

                const currentFirstRow = $p(rows[0]).text().trim();
                if (page > 1 && currentFirstRow === lastPageIdentifier) break;
                lastPageIdentifier = currentFirstRow;

                for (let i = 0; i < rows.length; i++) {
                    const cols = $p(rows[i]).find('> td');
                    const gridName = $p(cols[0]).text().trim();
                    const gridLicenseNo = $p(cols[1]).text().trim() || "PENDING";
                    const gridAddress = $p(cols[5]).text().trim();

                    const uniqueKey = `${gridLicenseNo}|${gridName}|${gridAddress}`.toLowerCase();
                    if (seenRecords.has(uniqueKey)) continue;

                    // 🎯 START SMART-RETRY BLOCK
                    let success = false;
                    let attempts = 0;
                    const maxRetries = 5;

                    while (!success && attempts < maxRetries) {
                        try {
                            attempts++;
                            const detailLink = $p(cols[0]).find('a').attr('href');
                            const url = `https://mylicense.in.gov/EVerification/${detailLink}`;
                            
                            const res = await client.get(url);
                            const profile = parseProfile(res.data, url);
                            
                            if (!profile.status) throw new Error("Blank Detail Page");

                            const finalData = { ...profile, fullName: gridName, licenseNo: gridLicenseNo, cityStateZip: gridAddress };
                            saveRecord(finalData);
                            seenRecords.add(uniqueKey);
                            console.log(`✅ Saved: ${finalData.fullName}`);
                            
                            success = true;
                            await delay(1500); 
                        } catch (err) {
                            console.error(`⚠️ Attempt ${attempts} failed for ${gridName}: ${err.message}`);
                            if (attempts < maxRetries) {
                                const waitSecs = 5 * attempts;
                                console.log(`⏳ Waiting ${waitSecs}s before retry...`);
                                await delay(waitSecs * 1000); 
                            } else {
                                console.error(`❌ Permanent failure for ${gridName}.`);
                                console.log(`🛑 Taking 5-minute COOLDOWN to clear server session...`);
                                await delay(300000); // 5 minute nap
                            }
                        }
                    }
                }
                console.log(`🏁 Finished Page ${page}/${totalPages} for "${currentFragment}"`);
            }
            queue.shift(); 
            saveCrawlerState(queue);

        } catch (e) {
            console.log(`💥 Search Error. Retrying in 15s...`);
            await delay(15000);
        }
    }
    console.log("🏁 Extraction Complete.");
    if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
}

startCrawl();