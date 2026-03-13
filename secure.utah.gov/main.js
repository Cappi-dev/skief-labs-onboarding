import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { solveRecaptchaV2 } from './src/api/captcha.js';
import { parseUtahResults, parseUtahDetails } from './src/parser/parser.js';
import { ensureOutputDir, saveData, getState, saveState, getAlreadyScrapedLicenses } from './src/utils/io.js';

// 🛑 REMEMBER TO PUT YOUR FRESH INCOGNITO COOKIES HERE!
const CHROME_COOKIES = "JSESSIONID=5F8FC2273F8A5C1C0D537D30A5995FA7; TS01bdb7d2=0143bf5170a8af78cf61ee5e85ec7b272d5d880ae7cb67a540ca0c3a15c702aaa875322d376e04c0e98678072eeac29730dcae8a4aa8cff38a220933e1cacef53ddb4b1380; TS01959f26=0143bf51704ebd364422e7644b58d80d5de4e1e1f6cb67a540ca0c3a15c702aaa875322d37b1c1c5b804bd20ffeacf1934e64ee5a7; fontsize=90%25; _gid=GA1.2.1857731006.1773111857; _gat_UA-103830962-11=1; _gat_gtag_UA_827740_14=1; _ga_QEDS9FB4SZ=GS2.1.s1773111856$o1$g0$t1773111856$j60$l0$h0; _ga=GA1.1.761108563.1773111857; _ga_ELDEEFYB93=GS2.1.s1773111856$o1$g0$t1773111856$j60$l0$h0; _ga_2BGCKCEY54=GS2.2.s1773111857$o1$g0$t1773111857$j60$l0$h0";

const jar = new CookieJar();
CHROME_COOKIES.split('; ').forEach(cookieStr => {
    if (cookieStr.trim()) jar.setCookieSync(cookieStr.trim(), 'https://secure.utah.gov');
});

const client = wrapper(axios.create({
    jar, withCredentials: true,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Origin': 'https://secure.utah.gov',
        'Connection': 'keep-alive'
    }
}));

async function start() {
    console.log("🚀 Starting the Master Pagination Run...");
    ensureOutputDir();
    
    // We grab your state. It should be around Page 9 based on your last message!
    let { lastPage, lastIndex } = getState();
    let currentPage = lastPage || 1;
    
    const scrapedLicenses = getAlreadyScrapedLicenses();
    console.log(`🧠 Shield Active: Loaded ${scrapedLicenses.size} previously scraped licenses.`);

    console.log(`📡 Performing Master Handshake...`);
    
    const homeRes = await client.get('https://secure.utah.gov/llv/search/index.html');
    const $ = cheerio.load(homeRes.data);
    const csrfToken = $('input[name="_csrf"]').val();

    if (!csrfToken) {
        console.error("🛑 FATAL: The Utah Firewall blocked your connection. Get fresh cookies and try again.");
        process.exit(1);
    }

    const captchaToken = await solveRecaptchaV2('6LcnfQgTAAAAAAQo9tcJNSmgKKa7BePLiAqP3BWF', 'https://secure.utah.gov/llv/search/index.html');
    
    const params = new URLSearchParams();
    params.append('count', '');
    params.append('fullName', ''); // Leave blank because it gives us everyone anyway!
    params.append('startsWith', 'true');
    params.append('g-recaptcha-response', captchaToken.trim());
    params.append('action', 'search');
    params.append('type', 'by_name');
    params.append('_csrf', csrfToken);
    
    ['943', '997', '945', '947', '949', '951', '953'].forEach(id => {
        const name = $(`input[value="${id}"]`).attr('name');
        if (name) params.append(name, id);
        params.append('professions', id);
    });

    await client.post('https://secure.utah.gov/llv/search/index.html', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': 'https://secure.utah.gov/llv/search/index.html' }
    });
    console.log(`✅ Handshake Accepted! Starting at Page ${currentPage}...`);

    // The Master Loop: Just keep going page by page until there are no more pages.
    while (true) {
        console.log(`\n📄 Fetching Page ${currentPage}...`);
        const listUrl = `https://secure.utah.gov/llv/search/search.html?fullName=&startsWith=true&currentPage=${currentPage}&orderBy=full_name`;
        const listRes = await client.get(listUrl);
        const items = parseUtahResults(listRes.data, listUrl);
        
        // If the page is empty, we reached the end of the Z's! We are done!
        if (items.length === 0) {
            console.log("🎉 DATABASE COMPLETE! No more records found.");
            break;
        }

        const listCsrf = cheerio.load(listRes.data)('input[name="_csrf"]').val();
        
        for (let j = 0; j < items.length; j++) {
            // Skip down to the exact person we left off on your current page
            if (currentPage === lastPage && j <= lastIndex) continue;
            
            const item = items[j];

            if (scrapedLicenses.has(item.listLicenseNumber)) {
                console.log(`   ⏭️ Skipping duplicate: ${item.fullName}`);
                continue;
            }

            let success = false;
            let dAttempts = 0;
            while (!success && dAttempts < 3) {
                dAttempts++;
                console.log(`   ✍️ Scraping: ${item.fullName} (Attempt ${dAttempts}/3)`);
                try {
                    const detailCaptcha = await solveRecaptchaV2('6LcnfQgTAAAAAAQo9tcJNSmgKKa7BePLiAqP3BWF', listUrl);
                    const db = new URLSearchParams({ index: item.index, 'g-recaptcha-response': detailCaptcha, _csrf: listCsrf });
                    const dRes = await client.post('https://secure.utah.gov/llv/search/detail.html', db.toString(), { 
                        headers: { 'Referer': listUrl, 'Origin': 'https://secure.utah.gov' } 
                    });

                    const details = parseUtahDetails(dRes.data, "N/A (Captcha Protected)");
                    
                    if (!details.fullName || details.fullName.trim() === "") {
                        throw new Error("Server sent empty data.");
                    }

                    details.sourceUrl = listUrl;
                    saveData(details);
                    
                    // Save state as "ALL" since we aren't tracking letters anymore
                    saveState("ALL", currentPage, j);
                    scrapedLicenses.add(details.licenseNumber);
                    success = true;
                } catch (e) { 
                    console.error(`   ❌ Attempt ${dAttempts} failed for ${item.fullName}: ${e.message}`);
                    if (dAttempts < 3) await new Promise(r => setTimeout(r, 3000));
                }
            }
        }
        currentPage++;
        lastIndex = -1; // Reset index for the next page
    }
}

start();