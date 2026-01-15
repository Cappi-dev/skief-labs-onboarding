const axios = require('axios');

const BASE_URL = 'https://lbvmprod.portalus.thentiacloud.net/rest/public';

// List of User Agents to rotate
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

async function searchProfiles(skip = 0, take = 20) {
    try {
        const response = await client.get('/profile/search/', {
            params: {
                keyword: 'all',
                skip,
                take,
                lang: 'en-us',
                licenseType: 'all',
                licenseStatus: 'all',
                disciplined: false
            },
            headers: { 'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)] }
        });
        return response.data;
    } catch (error) {
        console.error('Search Error:', error.message);
        return null;
    }
}

async function getProfileDetails(id) {
    try {
        const response = await client.post('/custom-public-register/profile/individual/', 
        { id: id },
        { headers: { 'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)] } }
        );
        return response.data;
    } catch (error) {
        if (error.response?.status === 429) return '429';
        console.error(`Details Error for ${id}:`, error.message);
        return null;
    }
}

module.exports = { searchProfiles, getProfileDetails };