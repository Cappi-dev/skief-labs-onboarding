const axios = require('axios');

const BASE_URL = 'https://lbvmprod.portalus.thentiacloud.net/rest/public';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // From your image_9ac0d0.png
        'Cookie': 'PHPSESSID=5sh6ub2ign45bjtifj3jj79htq' 
    }
});

async function searchProfiles(skip = 0, take = 20) {
    try {
        // FIX: Changed from .post to .get to match your image_9ac0d0.png
        const response = await client.get('/profile/search/', {
            params: {
                keyword: 'all',
                skip: skip,
                take: take,
                lang: 'en-us',
                licenseType: 'all',
                licenseStatus: 'all',
                disciplined: false
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Search Error: ${error.response?.status || error.message}`);
        return null;
    }
}

async function getProfileDetails(id) {
    try {
        // Details remains a POST as per standard Thentia individual profiles
        const response = await client.post('/custom-public-register/profile/individual/', { id: id });
        return response.data;
    } catch (error) {
        if (error.response?.status === 429) return '429';
        return null;
    }
}

module.exports = { searchProfiles, getProfileDetails };