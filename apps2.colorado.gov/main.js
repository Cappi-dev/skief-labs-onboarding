const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const qs = require('qs');
const fs = require('fs');
const path = require('path');

const { parseAspState, parseSearchResults, parseProfile } = require('./src/parser/parser');


const API_KEY_2CAPTCHA = 'API_KEY_HERE'; // <--- PASTE KEY
const BASE_URL = 'https://apps2.colorado.gov/dora/licensing/lookup/licenselookup.aspx';
const DETAIL_BASE_URL = 'https://apps2.colorado.gov/dora/licensing/Lookup/licensedetail.aspx?id=';

const OUTPUT_DIR = './output_colorado_2026';
const OUTPUT_JSONL = path.join(OUTPUT_DIR, 'output_colorado_2026.jsonl');
const OUTPUT_CSV = path.join(OUTPUT_DIR, 'output_colorado_2026.csv');


if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);


const csvHeaders = [
    'fullName', 
    'contactType', 
    'city', 
    'state', 
    'zipCode', 
    'licenseNumber', 
    'licenseMethod', 
    'licenseType', 
    'status', 
    'originalDate', 
    'effectiveDate', 
    'expirationDate', 
    'boardProgramActions', 
    'onlineDocuments', 
    'scrapedAt', 
    'sourceUrl', 
    'profileUrl'
];

if (!fs.existsSync(OUTPUT_CSV)) {
    fs.writeFileSync(OUTPUT_CSV, csvHeaders.join(',') + '\n');
}

const jar = new CookieJar();
const client = wrapper(axios.create({
    jar, withCredentials: true,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'Origin': 'https://apps2.colorado.gov',
        'Referer': BASE_URL,
        'X-MicrosoftAjax': 'Delta=true'
    }
}));

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function solveCaptcha(base64Image) {
    const submit = await axios.post('http://2captcha.com/in.php', {
        key: API_KEY_2CAPTCHA,
        method: 'base64', body: base64Image, json: 1
    });
    if (submit.data.status !== 1) throw new Error(`2Captcha Error: ${submit.data.request}`);
    
    const id = submit.data.request;
    process.stdout.write(`      ⏳ Solving (${id})...`);
    
    for (let i = 0; i < 20; i++) {
        await sleep(5000);
        process.stdout.write('.');
        const res = await axios.get(`http://2captcha.com/res.php?key=${API_KEY_2CAPTCHA}&action=get&id=${id}&json=1`);
        if (res.data.status === 1) {
            console.log(" Done!");
            return res.data.request;
        }
    }
    throw new Error('Captcha Timeout');
}

async function run() {
    console.log("🚀 Starting Scraper (CamelCase + Docs + Actions)");

    const alpha = "abcdefghijklmnopqrstuvwxyz".split("");
    const combos = [];
    for (let i of alpha) for (let j of alpha) combos.push(i + j);

    for (const combo of combos) {
        console.log(`\n----------------------------------------`);
        console.log(`🔍 Searching: [${combo}]`);

        try {
            jar.removeAllCookiesSync();

            console.log("   1. Fetching Landing Page...");
            const landing = await client.get(BASE_URL);
            let state = parseAspState(landing.data);

            console.log("   2. Handshake...");
            const primeRes = await client.post(BASE_URL, qs.stringify({
                '__EVENTTARGET': 'ctl00$MainContentPlaceHolder$ucLicenseLookup$ctl03$lbMultipleCredentialTypePrefix',
                '__VIEWSTATE': state.viewState,
                '__VIEWSTATEGENERATOR': state.viewGen,
                '__EVENTVALIDATION': state.eventVal,
                'ctl00$ScriptManager1': 'ctl00$MainContentPlaceHolder$ucLicenseLookup$UpdtPanelGridLookup|ctl00$MainContentPlaceHolder$ucLicenseLookup$ctl03$lbMultipleCredentialTypePrefix',
                'ctl00$MainContentPlaceHolder$ucLicenseLookup$ctl03$lbMultipleCredentialTypePrefix': '190',
                '__ASYNCPOST': 'true'
            }));
            
            const getDelta = (key) => primeRes.data.match(new RegExp(`\\|hiddenField\\|${key}\\|([^|]+)(\\||$)`))?.[1];
            state.viewState = getDelta('__VIEWSTATE') || state.viewState;
            state.viewGen = getDelta('__VIEWSTATEGENERATOR') || state.viewGen;
            state.eventVal = getDelta('__EVENTVALIDATION') || state.eventVal;

            console.log("   3. Solving Captcha...");
            const captchaUrl = new URL(state.captchaSrc, BASE_URL).href;
            const imgRes = await client.get(captchaUrl, { responseType: 'arraybuffer' });
            const base64Img = Buffer.from(imgRes.data, 'binary').toString('base64');
            const code = await solveCaptcha(base64Img);

            console.log("   4. Sending Search...");
            const searchRes = await client.post(BASE_URL, qs.stringify({
                'ctl00$ScriptManager1': 'ctl00$MainContentPlaceHolder$ucLicenseLookup$UpdtPanelGridLookup|ctl00$MainContentPlaceHolder$ucLicenseLookup$UpdtPanelGridLookup',
                '__EVENTTARGET': 'ctl00$MainContentPlaceHolder$ucLicenseLookup$UpdtPanelGridLookup',
                '__EVENTARGUMENT': '11~~5',
                '__VIEWSTATE': state.viewState,
                '__VIEWSTATEGENERATOR': state.viewGen,
                '__EVENTVALIDATION': state.eventVal,
                'ctl00$MainContentPlaceHolder$ucLicenseLookup$ctl03$lbMultipleCredentialTypePrefix': '190',
                'ctl00$MainContentPlaceHolder$ucLicenseLookup$ctl03$ddCredPrefix': '', 
                'ctl00$MainContentPlaceHolder$ucLicenseLookup$ctl03$tbLastName_Contact': combo,
                'ctl00$MainContentPlaceHolder$ucLicenseLookup$CaptchaSecurity1$txtCAPTCHA': code,
                'ctl00$MainContentPlaceHolder$ucLicenseLookup$ResizeLicDetailPopupID_ClientState': '0,0',
                'ctl00$OutsidePlaceHolder$ucLicenseDetailPopup$ResizeLicDetailPopupID_ClientState': '0,0',
                '__ASYNCPOST': 'true'
            }));

            const searchResults = parseSearchResults(searchRes.data);
            
            if (searchResults.length > 0) {
                console.log(`   🎉 Found ${searchResults.length} matches! Fetching details...`);
                
                for (const result of searchResults) {
                    try {
                        const detailUrl = `${DETAIL_BASE_URL}${encodeURIComponent(result.fullId)}`;
                        const detailRes = await client.get(detailUrl);
                        
                        const data = parseProfile(detailRes.data, detailUrl, new Date().toISOString(), result.contactType);
                        
                        fs.appendFileSync(OUTPUT_JSONL, JSON.stringify(data) + '\n');

                       
                        const escape = (t) => t ? `"${String(t).replace(/"/g, '""')}"` : '""';
                        const csvLine = [
                            data.fullName, 
                            data.contactType,
                            data.city, 
                            data.state, 
                            data.zipCode,
                            data.licenseNumber, 
                            data.licenseMethod, 
                            data.licenseType,
                            data.status, 
                            data.originalDate, 
                            data.effectiveDate, 
                            data.expirationDate,
                            data.boardProgramActions, 
                            data.onlineDocuments, 
                            data.scrapedAt, 
                            data.sourceUrl, 
                            data.profileUrl
                        ].map(escape).join(',') + '\n';
                        
                        fs.appendFileSync(OUTPUT_CSV, csvLine);
                        console.log(`      ✅ Saved: ${data.fullName}`);
                    } catch (detailErr) {
                        console.error(`      ⚠️ Detail Error: ${detailErr.message}`);
                    }
                    await sleep(200); 
                }
            } else {
                console.log("   ⚠️ No results.");
            }

        } catch (e) {
            console.error(`   ❌ Error: ${e.message}`);
        }
        await sleep(2000);
    }
}

run();