const axios = require('axios');

// We use the root domain and add specific paths in the functions
const BASE_URL = 'https://lbvmprod.portalus.thentiacloud.net/rest/public';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
});

async function searchProfiles(skip = 0, take = 20) {
    try {
        // Path for Search
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
        console.error('Search Error:', error.message);
    }
}

async function getProfileDetails(id) {
    try {
        /**
         * UPDATED PATH: 
         * Based on your browser check, Louisiana uses this custom path 
         * and it MUST be a POST request.
         */
        const response = await client.post('/custom-public-register/profile/individual/', {
            id: id
        });
        return response.data;
    } catch (error) {
        console.error(`Details Error for ${id}:`, error.message);
    }
}

module.exports = { searchProfiles, getProfileDetails };