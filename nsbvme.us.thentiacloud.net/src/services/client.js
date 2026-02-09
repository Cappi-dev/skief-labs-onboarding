const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const jar = new CookieJar();
const client = wrapper(axios.create({ 
    jar, 
    withCredentials: true,
    headers: {
        'accept': 'application/json, text/plain, */*',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        'referer': 'https://nsbvme.us.thentiacloud.net/webs/nsbvme/register/',
        'accept-language': 'en-US,en;q=0.9',
    }
}));

const BASE_URL = 'https://nsbvme.us.thentiacloud.net/rest/public/registrant';

const initSession = async () => {
    try {
        console.log("🍪 Initializing session...");
        await client.get('https://nsbvme.us.thentiacloud.net/webs/nsbvme/register/');
        return true;
    } catch (error) { return false; }
};

const searchProfiles = async (skip = 0, take = 1) => {
    try {
        const response = await client.get(`${BASE_URL}/search/`, {
            params: { keyword: 'all', skip, take }
        });
        return response.data;
    } catch (error) { return null; }
};

const getProfileDetails = async (profileId) => {
    try {
        const response = await client.get(`${BASE_URL}/get/`, {
            params: { id: profileId }
        });
        return response.data;
    } catch (error) { return null; }
};

module.exports = { initSession, searchProfiles, getProfileDetails };