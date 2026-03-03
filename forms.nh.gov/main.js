import client from './src/api/client.js';
import { solveChallenge } from './src/api/shield.js';
import { solveRecaptcha } from './src/api/captcha.js';
import { parseProfile } from './src/parser/detail.js';
import { initFiles, saveRecord } from './src/utils/io.js';
import * as cheerio from 'cheerio';
import fs from 'fs';

const STATE_FILE = './state.json';

// Initialize files and state automatically
initFiles();
if (!fs.existsSync(STATE_FILE)) fs.writeFileSync(STATE_FILE, JSON.stringify({ currentLetter: 'A', processedLinks: [] }, null, 2));
let state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

// Handle Axios Captcha Redirects
// Handle Axios Captcha Redirects
async function handleAxiosCaptcha(captchaResponse, targetUrl) {
    const $c = cheerio.load(captchaResponse.data);
    const siteKey = $c('.g-recaptcha').attr('data-sitekey');
    const currentUrl = captchaResponse.request.res.responseUrl; 

    if (!siteKey) throw new Error("Could not find reCAPTCHA site key on page.");
    
    const token = await solveRecaptcha(siteKey, currentUrl);

    const payload = new URLSearchParams();
    payload.append('__EVENTTARGET', '');
    payload.append('__EVENTARGUMENT', '');
    payload.append('__VIEWSTATE', $c('#__VIEWSTATE').val() || '');
    payload.append('__VIEWSTATEGENERATOR', $c('#__VIEWSTATEGENERATOR').val() || '');
    payload.append('__EVENTVALIDATION', $c('#__EVENTVALIDATION').val() || '');
    payload.append('g-recaptcha-response', token);
    payload.append('submit_button', 'Submit'); 

    console.log("🔓 Submitting Captcha token to server...");
    let res = await client.post(currentUrl, payload.toString(), {
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': currentUrl,
            'Origin': 'https://forms.nh.gov' // Added to prevent ASP.NET Cross-Origin block
        }
    });

    // 1. Did the server throw the Math Shield at us during submission?
    if (res.data.includes('leastFactor')) {
        console.log("🛡️ Shield triggered after Captcha! Solving...");
        const keyValue = solveChallenge(res.data);
        if (keyValue) {
            await client.defaults.jar.setCookie(`KEY=${keyValue}; Path=/; Domain=forms.nh.gov`, 'https://forms.nh.gov');
            await new Promise(r => setTimeout(r, 1500));
            res = await client.get(targetUrl); // Fetch the profile again
        }
    }

    // 2. Are we STILL stuck on the CAPTCHA page?
    if (res.request.res.responseUrl.includes('SolveCaptcha.aspx')) {
        console.log("⚠️ Server REJECTED the Captcha. Saving debug_captcha_fail.html...");
        fs.writeFileSync('debug_captcha_fail.html', res.data);
    }

    return res; 
}

async function start() {
    console.log("🚀 Starting NH Scraper Engine (Axios Mode)...");

    try {
        const searchUrl = 'Search.aspx?facility=N';
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        const startIndex = letters.indexOf(state.currentLetter);

        for (let i = startIndex; i < letters.length; i++) {
            const letter = letters[i];
            state.currentLetter = letter;
            console.log(`\n🔤 Searching Letter: ${letter}`);

            // 1. Get fresh ViewState (and handle shield if it pops up)
            let res = await client.get(searchUrl);
            if (res.data.includes('leastFactor')) {
                console.log("🛡️ Solving Entry Shield...");
                const keyValue = solveChallenge(res.data);
                if (!keyValue) throw new Error("Math parsing failed.");
                await client.defaults.jar.setCookie(`KEY=${keyValue}; Path=/; Domain=forms.nh.gov`, 'https://forms.nh.gov');
                await new Promise(r => setTimeout(r, 1500));
                res = await client.get(searchUrl); // Re-fetch now that we are trusted
            }

            const $ = cheerio.load(res.data);
            
            // 2. Build the Payload
            const payload = new URLSearchParams();
            payload.append('__VIEWSTATE', $('#__VIEWSTATE').val() || '');
            payload.append('__VIEWSTATEGENERATOR', $('#__VIEWSTATEGENERATOR').val() || '');
            payload.append('__EVENTVALIDATION', $('#__EVENTVALIDATION').val() || '');
            payload.append('t_web_lookup__license_type_name', 'Veterinarian');
            payload.append('t_web_lookup__last_name', letter);
            payload.append('sch_button', 'Search');

            // 3. Perform the POST Search
            const postRes = await client.post(searchUrl, payload.toString(), {
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': `https://forms.nh.gov/licenseverification/${searchUrl}` 
                }
            });
            
            const resultsPage = cheerio.load(postRes.data);
            const links = resultsPage('#datagrid_results tr a[href*="Details.aspx"]').map((i, el) => resultsPage(el).attr('href')).get();

            console.log(`🔍 Found ${links.length} profiles.`);

            if (links.length === 0 && postRes.data.includes('leastFactor')) {
                console.log("⚠️ Shield triggered during POST. Session dropped. Retrying letter...");
                i--; // Step back to retry this letter
                continue; 
            }

            for (const relativeLink of links) {
                const fullLink = `https://forms.nh.gov/licenseverification/${relativeLink}`;
                if (state.processedLinks.includes(fullLink)) continue;
                
                let profileRes = await client.get(relativeLink);

                // Handle Captcha Redirects
                if (profileRes.request.res.responseUrl.includes('SolveCaptcha.aspx')) {
                    profileRes = await handleAxiosCaptcha(profileRes, fullLink);
                }
                
                const data = parseProfile(profileRes.data, fullLink);

                if (data.name) {
                    saveRecord(data);
                    state.processedLinks.push(fullLink);
                    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
                    console.log(`✅ Saved: ${data.name}`);
                }
                await new Promise(r => setTimeout(r, 1500));
            }
        }
        
        console.log("🏁 Extraction Complete!");

    } catch (err) {
        console.error("💥 Error:", err.message);
    }
}

start();