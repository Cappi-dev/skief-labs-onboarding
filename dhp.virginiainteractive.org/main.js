import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import qs from 'qs';
import { loadExistingRecords, saveRecord, loadState, saveState } from './src/utils/io.js';

// 🍪 Setup the Cookie Jar to hold the ASP.NET Session
const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://dhp.virginiainteractive.org',
    'Referer': 'https://dhp.virginiainteractive.org/Lookup/Index',
    'Content-Type': 'application/x-www-form-urlencoded'
};

const OCCUPATIONS = [
    'Veterinarian', 'Veterinarian Faculty', 'Veterinary Establishment - Ambulatory',
    'Veterinary Establishment - Stationary', 'Veterinary Intern/Resident', 'Veterinary Technician'
];

const STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 
    'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 
    'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 
    'West Virginia', 'Wisconsin', 'Wyoming'
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const COMBINATIONS = ['']; 
for (let a of ALPHABET) {
    for (let b of ALPHABET) {
        COMBINATIONS.push(a + b.toLowerCase());
    }
}

async function runMasterScraper() {
    console.log("🚀 STARTING VIRGINIA API SCRAPER (V7 - LIGHTNING EDITION)...");
    
    const existingRecords = loadExistingRecords();
    const stateTracker = loadState();
    
    let startOccIdx = stateTracker.occIdx;
    let startStateIdx = stateTracker.stateIdx;
    let startComboIdx = stateTracker.comboIdx;

    try {
        console.log("🗺️ Fetching internal Database IDs from server...");
        const initRes = await client.get('https://dhp.virginiainteractive.org/Lookup/Index', { headers });
        const $init = cheerio.load(initRes.data);
        
        const occupationMap = {};
        $init('#OccupationId option').each((_, el) => {
            if ($init(el).attr('value')) occupationMap[$init(el).text().trim()] = $init(el).attr('value');
        });

        const stateMap = {};
        $init('#State option').each((_, el) => {
            if ($init(el).attr('value')) stateMap[$init(el).text().trim()] = $init(el).attr('value');
        });

        for (let i = startOccIdx; i < OCCUPATIONS.length; i++) {
            const occupation = OCCUPATIONS[i];
            const occId = occupationMap[occupation];
            
            for (let j = (i === startOccIdx ? startStateIdx : 0); j < STATES.length; j++) {
                const targetState = STATES[j];
                const stateId = stateMap[targetState];
                
                console.log(`\n========================================`);
                console.log(`🎯 TARGET: ${occupation} [ID: ${occId}] | STATE: ${targetState} [ID: ${stateId}]`);
                console.log(`========================================`);

                let k = (i === startOccIdx && j === startStateIdx) ? startComboIdx : 0;
                
                while (k < COMBINATIONS.length) {
                    const searchLetters = COMBINATIONS[k];
                    console.log(`\n🔤 Mode: ${searchLetters === '' ? 'BLANK STRIKE' : `DEEP DIVE (${searchLetters})`}`);

                    try {
                        const getRes = await client.get('https://dhp.virginiainteractive.org/Lookup/Index', { headers });
                        const $get = cheerio.load(getRes.data);
                        const token = $get('input[name="__RequestVerificationToken"]').val();

                        await new Promise(res => setTimeout(res, 1000)); 

                        const payload = qs.stringify({
                            '__RequestVerificationToken': token,
                            'OccupationId': occId,
                            'FName': '',
                            'LName': searchLetters,
                            'State': stateId,
                            'Zip': '',
                            'LicStatus': '0',
                            'submitBtn': 'Search',
                            'SearchByOther': 'true'
                        });

                        const postRes = await client.post('https://dhp.virginiainteractive.org/Lookup/Index', payload, { headers });
                        const html = postRes.data.toLowerCase();
                        const $post = cheerio.load(postRes.data);

                        if (html.includes("maintain a volume of licensees")) {
                            throw new Error("🛑 IP BAN DETECTED! Change your VPN/IP and restart the script.");
                        }

                        if (html.includes('refine your search') || html.includes('your search returned too many records')) {
                            console.log(`   ⚠️ Search Limit Hit! Switching to Aa-Zz Deep Dive mode...`);
                            if (searchLetters === '') { k = 1; continue; } 
                            else { throw new Error("CRITICAL: Search limit hit even with 2 letters."); }
                        }

                        const profileLinks = [];
                        $post('table tr').each((_, row) => {
                            const link = $post(row).find('a').attr('href');
                            if (link && link.includes('/Lookup/Detail/')) {
                                profileLinks.push('https://dhp.virginiainteractive.org' + link);
                            }
                        });
                            
                        if (profileLinks.length > 0) {
                            console.log(`   📊 Found ${profileLinks.length} profiles. Engaging API Extractor...`);

                            for (const link of profileLinks) {
                                if (existingRecords.has(link)) {
                                    console.log(`      ⏭️ Skipping (Already scraped)`);
                                    continue;
                                }

                                console.log(`      🕵️ Extracting: ${link.split('/').pop()}`);
                                
                                const profileRes = await client.get(link, { headers });
                                
                                if (profileRes.data.toLowerCase().includes("maintain a volume of licensees")) {
                                    throw new Error("🛑 IP BAN DETECTED ON PROFILE! Change your VPN/IP and restart.");
                                }

                                const $$ = cheerio.load(profileRes.data); 
                                $$('[style*="display:none"], [style*="display: none"], .hidden').remove();
                                
                                const record = {
                                    searchedState: targetState, 
                                    name: "", licenseNumber: "", occupation: "", licenseStatus: "", 
                                    issueDate: "", expireDate: "", address: "", additionalPublicInformation: "",
                                    profileUrl: link, sourceUrl: link, scrapedAt: new Date().toISOString()
                                };

                                $$('th, label, .detail-label, strong').each((_, el) => {
                                    let keyRaw = $$(el).text().replace(':', '').trim().toLowerCase();
                                    let val = $$(el).next('td, span, div').text().trim();
                                    if (!val) val = $$(el).parent().next('td, span, div').text().trim();
                                    
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
                                
                                await new Promise(res => setTimeout(res, 1500));
                            }
                        } else {
                            console.log("   🤷‍♂️ No profiles found.");
                        }

                        console.log(`✅ Finished combination. Saving state...`);
                        
                        if (searchLetters === '') k = COMBINATIONS.length; 
                        else k++; 

                        let nextComboIdx = k, nextStateIdx = j, nextOccIdx = i;
                        if (nextComboIdx >= COMBINATIONS.length) {
                            nextComboIdx = 0; nextStateIdx++;
                            if (nextStateIdx >= STATES.length) { nextStateIdx = 0; nextOccIdx++; }
                        }
                        if (nextOccIdx < OCCUPATIONS.length) saveState(nextOccIdx, nextStateIdx, nextComboIdx);

                    } catch (err) {
                        console.error(`\n❌ SCRIPT HALTED:`, err.message);
                        throw new Error("Stopping to prevent skipping profiles.");
                    }
                }
            }
        }
    } catch (error) {
        console.error("\n❌ FINAL EXIT:", error.message);
        console.log("🛡️ Change your VPN, then run the script again. It will resume perfectly.\n");
    }
}

runMasterScraper();