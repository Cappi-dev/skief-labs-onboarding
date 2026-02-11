const axios = require('axios');

/**
 * Direct API client for NYSED
 */
const fetchLicense = async (licenseNumber, professionCode) => {
    try {
        const config = {
            method: 'get',
            url: `https://api.nysed.gov/rosa/V2/byProfessionAndLicenseNumber?licenseNumber=${licenseNumber}&professionCode=${professionCode}`,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Origin': 'https://eservices.nysed.gov',
                'Referer': 'https://eservices.nysed.gov/',
                'x-oapi-key': 'BRJF4D6U646A5PNMIB77AAW9544QFQKAYAEWI9EPU0TNP72CEEO3L4KGVN5K3R44'
            }
        };

        const response = await axios(config);
        return response.data; 
    } catch (error) {
        if (error.response && error.response.status === 404) return null;
        throw error;
    }
};

module.exports = { fetchLicense };