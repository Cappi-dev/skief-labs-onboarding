const axios = require('axios');

const HEADERS = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json;charset=UTF-8',
    'referer': 'https://azsvmeb.portalus.thentiacloud.net/webs/portal/register/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
};

async function searchProfiles(skip = 0, take = 20) {
    const url = `https://azsvmeb.portalus.thentiacloud.net/rest/public/profile/search/?keyword=all&skip=${skip}&take=${take}&lang=en-us&licenseType=all&licenseStatus=Active&disciplined=false`;
    try {
        const response = await axios.get(url, { headers: HEADERS });
        return response.data; 
    } catch (error) {
        console.error(`[Search Error] Skip ${skip}:`, error.message);
        return null;
    }
}

async function getProfileDetails(profileId, retries = 3) {
    const url = 'https://azsvmeb.portalus.thentiacloud.net/rest/public/custom-public-register/profile/individual/';
    
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.post(url, { id: profileId }, { headers: HEADERS });
            return response.data; 
        } catch (error) {
            if (error.response && error.response.status === 429) {
                // Exponential Backoff: Wait 10s, then 20s, then 30s
                const waitTime = (i + 1) * 10000; 
                console.warn(`Rate limited (429) on Profile ${profileId}. Retrying in ${waitTime/1000}s... (Attempt ${i+1}/${retries})`);
                await new Promise(res => setTimeout(res, waitTime));
            } else {
                console.error(`[Profile Error] ID ${profileId}:`, error.message);
                return null;
            }
        }
    }
    return null;
}

module.exports = { searchProfiles, getProfileDetails };