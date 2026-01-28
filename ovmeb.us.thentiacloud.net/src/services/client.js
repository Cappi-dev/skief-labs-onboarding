const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const DOMAIN = 'ovmeb.us.thentiacloud.net';
const jar = new CookieJar();
const client = wrapper(axios.create({ 
    jar, 
    withCredentials: true,
    // This helps bypass some basic TLS fingerprinting
    maxRedirects: 5
}));

const HEADERS = {
    'Host': DOMAIN,
    'Connection': 'keep-alive',
    'accept': 'application/json, text/plain, */*',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'origin': `https://${DOMAIN}`,
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    'referer': `https://${DOMAIN}/webs/ovmeb/register/`,
    'accept-language': 'en-US,en;q=0.9',
};

async function initSession() {
    console.log("🔌 Initializing session...");
    try {
        // Landing page to set initial cookies
        await client.get(`https://${DOMAIN}/webs/ovmeb/register/`, { headers: HEADERS });
        console.log("✅ Session established.");
    } catch (error) {
        console.error("❌ Session init failed:", error.message);
    }
}

async function searchProfiles(skip = 0, take = 20) {
    // Reverting to 'keyword=all' as per your successful browser CURL
    const url = `https://${DOMAIN}/rest/public/registrant/search/?keyword=all&skip=${skip}&take=${take}&lang=en-us`;
    try {
        const response = await client.get(url, { headers: HEADERS });
        
        // Detailed logging to help troubleshoot
        if (response.data && response.data.result && response.data.result.dataResults) {
            console.log(`📊 Found ${response.data.result.dataResults.length} records in this batch.`);
        }
        
        return response.data; 
    } catch (error) {
        console.error(`[Search Error] Skip ${skip}:`, error.message);
        return null;
    }
}

async function getProfileDetails(profileId) {
    const url = `https://${DOMAIN}/rest/public/custom-public-register/profile/individual/`;
    try {
        const response = await client.post(url, { id: profileId }, { headers: HEADERS });
        return response.data; 
    } catch (error) {
        return null;
    }
}

module.exports = { initSession, searchProfiles, getProfileDetails };