const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const DOMAIN = 'msbvm.portalus.thentiacloud.net';
const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));

const HEADERS = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'referer': `https://${DOMAIN}/webs/portal/register/`,
    'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'cookie': 'PHPSESSID=c367qe8eqljn8v6k36lg4bgb4e' 
};

async function initSession() {
    try {
        await client.get(`https://${DOMAIN}/webs/portal/register/`, { headers: HEADERS });
    } catch (e) { console.error("Init failed:", e.message); }
}

async function searchProfiles(skip = 0, take = 20) {
    const url = `https://${DOMAIN}/rest/public/profile/search/?keyword=all&skip=${skip}&take=${take}&lang=en-us&licenseType=all&licenseStatus=all&disciplined=false`;
    try {
        const response = await client.get(url, { headers: HEADERS });
        return response.data;
    } catch (e) { return null; }
}

async function getProfileDetails(profileId) {
    const url = `https://${DOMAIN}/rest/public/custom-public-register/profile/individual/`;
    try {
        const response = await client.post(url, { id: profileId }, { headers: HEADERS });
        return response.data;
    } catch (e) { return null; }
}

module.exports = { initSession, searchProfiles, getProfileDetails };