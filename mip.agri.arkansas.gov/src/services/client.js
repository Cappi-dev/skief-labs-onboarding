const axios = require('axios');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = axios.create({
    baseURL: 'https://mip.agri.arkansas.gov',
    headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://mip.agri.arkansas.gov/VetLicensingPortal/Guest/Home/Licensee_Search',
        // Copy these values from your Cookies tab in image_9c91b1.png
        'Cookie': '.AspNetCore.Antiforgery=CfDJ8C0A9Z24x0hKu87qqU-_00a58xKGfPd5qj-Scai-Q1m7OANvDg9zgUc_qbaJrLAvUa4WxO7MYKQTVKDpwvApk9vmRavt6jKwR02toUcRBqo4dCa1OP8rF8Nvbz_n7vi35CCz81vGMxrCSzi_zUmNUtw; TS01331776=01a28dbe25b2b6280f961f232e759b426289991b565aaea0aeede13c0662d76eadfbcca421f83c51c1914ca551712cfae9ee160592; TS01bea79f=01a28dbe25b8dc2616d095921729421203cd0eb532d1f5500c5992d906a2a7d3ceef4fbda8b9dfedfed783249e48a05fffebc8c23c5b0da6a2b413bab95eb56d8514efc4ae218448af1e91dab2ce7fef61e87f3f06'    }
});

const stateAbbreviations = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

const searchByState = async (stateCode) => {
    try {
        const url = `/VetLicensingPortal/Guest/Home/Licensee_Search_API?license=&lastname=&business=&city=${stateCode}&zipcode=null&_=${Date.now()}`;
        const response = await client.get(url);
        return response.data?.data || response.data || [];
    } catch (error) { return []; }
};

const getProfileDetails = async (licenseId) => {
    try {
        // CHANGED: Using the endpoint you discovered in your Network tab
        const url = `/VetLicensingPortal/Guest/Home/Get_Licensee_Info?id=${licenseId}&_=${Date.now()}`;
        const response = await client.get(url);
        return response.data;
    } catch (error) {
        return null;
    }
};

module.exports = { searchByState, getProfileDetails, stateAbbreviations };