import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import qs from 'qs';
import http from 'http';
import { loadExistingRecords, saveRecord, loadState, saveState } from './src/utils/io.js';

// 🛑 Suppress TLS warnings for legacy gov site
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const ZYTE_API_KEY = '';

const client = axios.create({
    proxy: false,
    maxRedirects: 0,
    validateStatus: (status) => status < 400, 
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    }
});

const OCCUPATIONS = ['Veterinarian', 'Veterinarian Faculty', 'Veterinary Establishment - Ambulatory', 'Veterinary Establishment - Stationary', 'Veterinary Intern/Resident', 'Veterinary Technician'];
const STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const COMBINATIONS = ['']; 
for (let a of ALPHABET) {
    for (let b of ALPHABET) { COMBINATIONS.push(a + b.toLowerCase()); }
}

/**
 *  Get a Sticky IP via Zyte Session API
 */
function createZyteSession() {
    return new Promise((resolve, reject) => {
        const req = http.request({
            host: 'api.zyte.com',
            port: 8011,
            path: '/sessions',
            method: 'POST',
            headers: { 'Authorization': 'Basic ' + Buffer.from(ZYTE_API_KEY + ':').toString('base64') }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => res.statusCode === 200 ? resolve(data.trim()) : reject(new Error(`Zyte Session Error: ${data}`)));
        });
        req.on('error', reject);
        req.end();
    });
}

function updateJar(jar, response) {
    if (response.headers['set-cookie']) {
        response.headers['set-cookie'].forEach(c => {
            try { jar.setCookieSync(c, 'https://dhp.virginiainteractive.org'); } catch(e){}
        });
    }
}

function getExactId(map, targetName) {
    if (map[targetName]) return map[targetName];
    const cleanTarget = targetName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    for (let key in map) {
        if (key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanTarget) return map[key];
    }
    return null;
}

async function runMasterScraper() {
    console.log(" STARTING VIRGINIA MASTER SCRAPER (V47 - STICKY AXIOS EDITION)...");
    
    const existingRecords = loadExistingRecords();
    const stateTracker = loadState();
    
    let startOccIdx = stateTracker.occIdx;
    let startStateIdx = stateTracker.stateIdx;
    let startComboIdx = stateTracker.comboIdx;

    try {
        console.log(" Fetching Database IDs...");
        const initAgent = new HttpsProxyAgent(`http://${ZYTE_API_KEY}:@api.zyte.com:8011`);
        const initRes = await client.get(`https://dhp.virginiainteractive.org/Lookup/Index`, { httpsAgent: initAgent });
        const $init = cheerio.load(initRes.data);
        
        const occupationMap = {};
        $init('#OccupationId option').each((_, el) => { if ($init(el).attr('value')) occupationMap[$init(el).text().trim()] = $init(el).attr('value'); });
        const stateMap = {};
        $init('#State option').each((_, el) => { if ($init(el).attr('value')) stateMap[$init(el).text().trim()] = $init(el).attr('value'); });

        for (let i = startOccIdx; i < OCCUPATIONS.length; i++) {
            const occupation = OCCUPATIONS[i];
            const occId = getExactId(occupationMap, occupation);

            for (let j = (i === startOccIdx ? startStateIdx : 0); j < STATES.length; j++) {
                const targetState = STATES[j];
                const stateId = getExactId(stateMap, targetState);
                if (!stateId) continue;

                console.log(`\n========================================`);
                console.log(` TARGET: ${occupation} | STATE: ${targetState}`);
                console.log(`========================================`);

                let k = (i === startOccIdx && j === startStateIdx) ? startComboIdx : 0;
                
                while (k < COMBINATIONS.length) {
                    const searchLetters = COMBINATIONS[k];
                    const jar = new CookieJar();
                    
                    try {
                        const zyteSessionId = await createZyteSession();
                        const loopAgent = new HttpsProxyAgent(`http://${ZYTE_API_KEY}:@api.zyte.com:8011`);
                        
                        //  Sticky session + Local Cookie Control
                        const zyteHeaders = {
                            'X-Crawlera-Session': zyteSessionId,
                            'X-Crawlera-Cookies': 'disable'
                        };

                        // 1. GET Token
                        const getRes = await client.get('https://dhp.virginiainteractive.org/Lookup/Index', { 
                            httpsAgent: loopAgent,
                            headers: zyteHeaders 
                        });
                        updateJar(jar, getRes);
                        const $get = cheerio.load(getRes.data);
                        const token = $get('input[name="__RequestVerificationToken"]').last().val();

                        // 2. POST Search
                        const payload = qs.stringify({
                            '__RequestVerificationToken': token, 'OccupationId': occId, 'LName': searchLetters,
                            'State': stateId, 'LicStatus': '0', 'submitBtn': 'Search', 'SearchByOther': 'true'
                        });

                        const postRes = await client.post('https://dhp.virginiainteractive.org/Lookup/Index', payload, {
                            httpsAgent: loopAgent,
                            headers: { 
                                ...zyteHeaders, 
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Cookie': jar.getCookieStringSync('https://dhp.virginiainteractive.org'),
                                'Referer': 'https://dhp.virginiainteractive.org/Lookup/Index'
                            }
                        });
                        updateJar(jar, postRes);

                        // 3. Follow Redirect
                        let resultUrl = 'https://dhp.virginiainteractive.org' + (postRes.headers.location || '/Lookup/Result');
                        let resultRes = await client.get(resultUrl, {
                            httpsAgent: loopAgent,
                            headers: { ...zyteHeaders, 'Cookie': jar.getCookieStringSync('https://dhp.virginiainteractive.org') }
                        });
                        updateJar(jar, resultRes);

                        // 4. Pagination Loop
                        let pageNum = 1;
                        while (true) {
                            const $result = cheerio.load(resultRes.data);
                            const links = [];
                            $result('table tr a[href*="/Lookup/Detail/"]').each((_, a) => {
                                links.push('https://dhp.virginiainteractive.org' + $result(a).attr('href'));
                            });

                            console.log(`   🔤 "${searchLetters || 'BLANK'}" | Page ${pageNum}: ${links.length} profiles.`);

                            for (const link of links) {
                                if (existingRecords.has(link)) continue;
                                
                                const profileRes = await client.get(link, { 
                                    httpsAgent: loopAgent,
                                    headers: { ...zyteHeaders, 'Cookie': jar.getCookieStringSync('https://dhp.virginiainteractive.org') }
                                });
                                const $$ = cheerio.load(profileRes.data);
                                $$('[style*="display:none"], .hidden').remove();

                                const record = {
                                    searchedState: targetState, name: "", licenseNumber: "", occupation: "", licenseStatus: "", 
                                    issueDate: "", expireDate: "", address: "", additionalPublicInformation: "",
                                    profileUrl: link, sourceUrl: link, scrapedAt: new Date().toISOString()
                                };

                                $$('th, label, .detail-label, strong').each((_, el) => {
                                    let keyRaw = $$(el).text().replace(':', '').trim().toLowerCase();
                                    let val = $$(el).next('td, span, div').text().trim() || $$(el).parent().next('td, span, div').text().trim();
                                    if (val) {
                                        val = val.replace(/\s+/g, ' ');
                                        if (keyRaw === 'name') record.name = val;
                                        else if (keyRaw.includes('license number')) record.licenseNumber = val;
                                        else if (keyRaw.includes('occupation')) record.occupation = val;
                                        else if (keyRaw.includes('status')) record.licenseStatus = val;
                                        else if (keyRaw.includes('issue') || keyRaw.includes('initial')) record.issueDate = val;
                                        else if (keyRaw.includes('expire')) record.expireDate = val;
                                        else if (keyRaw.includes('address')) record.address = val;
                                        else if (keyRaw.includes('public info')) record.additionalPublicInformation = val;
                                    }
                                });

                                if (record.name) {
                                    saveRecord(record);
                                    existingRecords.add(link);
                                }
                            }

                            // Corrected Cheerio Pagination Check
                            const hasNextPage = $result('div.paging a').filter((i, el) => {
                                return $result(el).text().trim() === String(pageNum + 1);
                            }).length > 0;

                            if (!hasNextPage) break;

                            pageNum++;
                            resultRes = await client.get(`https://dhp.virginiainteractive.org/Lookup/Result?Page=${pageNum}`, {
                                httpsAgent: loopAgent,
                                headers: { 
                                    ...zyteHeaders, 
                                    'Cookie': jar.getCookieStringSync('https://dhp.virginiainteractive.org'),
                                    'Referer': resultUrl
                                }
                            });
                            updateJar(jar, resultRes);
                        }

                        k++;
                        saveState(i, j, k);
                        if (searchLetters === '') break; 

                    } catch (err) {
                        console.error(`   ❌ Error: ${err.message}. Retrying...`);
                        await new Promise(r => setTimeout(r, 5000));
                    }
                }
            }
        }
    } catch (error) { console.error("\n❌ FINAL EXIT:", error.message); }
}

runMasterScraper();