const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const jar = new CookieJar();
const client = wrapper(axios.create({ 
    jar, 
    withCredentials: true,
    headers: {
        'authority': 'ovmeb.us.thentiacloud.net',
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'referer': 'https://ovmeb.us.thentiacloud.net/webs/ovmeb/register/',
        'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
    }
}));

const BASE_URLS = {
    licensee: 'https://ovmeb.us.thentiacloud.net/rest/public/registrant',
    facility: 'https://ovmeb.us.thentiacloud.net/rest/public/facility'
};

const initSession = async () => {
    try {
        await client.get('https://ovmeb.us.thentiacloud.net/webs/ovmeb/register/');
        return true;
    } catch (error) { return false; }
};

const searchProfiles = async (type, skip = 0, take = 20) => {
    try {
        const response = await client.get(`${BASE_URLS[type]}/search/`, {
            params: { keyword: 'all', skip, take }
        });
        return response.data;
    } catch (error) { return null; }
};

const getProfileDetails = async (type, profileId) => {
    try {
        const response = await client.get(`${BASE_URLS[type]}/get/`, {
            params: { id: profileId }
        });
        return response.data;
    } catch (error) { return null; }
};

module.exports = { initSession, searchProfiles, getProfileDetails };