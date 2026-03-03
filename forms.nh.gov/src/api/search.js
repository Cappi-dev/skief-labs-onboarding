import client from './client.js';
import * as cheerio from 'cheerio';
import { solveChallenge } from './shield.js';

export async function performInitialSearch() {
    const searchUrl = 'Search.aspx?facility=N';
    console.log("📡 Connecting to Search.aspx...");
    
    let res = await client.get(searchUrl);

    let attempts = 0;
    while (res.data.includes('leastFactor') && attempts < 5) {
        attempts++;
        console.log(`🛡️ Solving Entry Shield attempt #${attempts}...`);
        
        const keyValue = solveChallenge(res.data);
        if (!keyValue) throw new Error("Math parsing failed.");

        await client.defaults.jar.setCookie(`KEY=${keyValue}; Path=/; Domain=forms.nh.gov`, 'https://forms.nh.gov');
        await new Promise(r => setTimeout(r, 2000));
        res = await client.get(searchUrl);
    }

    const $ = cheerio.load(res.data);
    const viewState = $('#__VIEWSTATE').val();
    if (!viewState) throw new Error("💥 ViewState missing. IP Reputation block likely.");

    const payload = new URLSearchParams();
    payload.append('__VIEWSTATE', viewState);
    payload.append('__VIEWSTATEGENERATOR', $('#__VIEWSTATEGENERATOR').val());
    payload.append('__EVENTVALIDATION', $('#__EVENTVALIDATION').val());
    payload.append('t_web_lookup__license_type_name', 'Veterinarian');
    payload.append('t_web_lookup__last_name', 'A'); 
    payload.append('sch_button', 'Search');

    console.log("🔓 Shield bypassed. Executing search for Last Name 'A'...");
    await client.post(searchUrl, payload.toString(), {
        headers: { 'Referer': `https://forms.nh.gov/licenseverification/${searchUrl}` }
    });

    const results = await client.get('SearchResults.aspx');
    return results.data;
}