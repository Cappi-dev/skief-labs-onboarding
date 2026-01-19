const axios = require('axios');
const https = require('https')

const BASE_URL = 'https://mip.agri.arkansas.gov/VetLicensingPortal/Guest/Home';

// User Agents for rotation
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
];

// List of state abbreviations for the discovery loop
const stateAbbreviations = [
    "AK","AL","AP","AR","AZ","CA","CO","CT","DC","DE","FL","FM","GA","GU","HI","IA","ID","IL","IN","KS","KY","LA","MA","MD","ME","MH","MI","MN","MO","MP","MS","MT","NC","ND","NE","NH","NJ","NM","NV","NY","OH","OK","OR","PA","PW","RI","SC","SD","TN","TX","UT","VA","VT","WA","WI","WV","WY"
];

const client = axios.create({
    baseURL: BASE_URL,
    // 2. Add this agent to ignore the "unable to verify" error
    httpsAgent: new https.Agent({  
        rejectUnauthorized: false
    }),
    headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-Requested-With': 'XMLHttpRequest',
        'Connection': 'keep-alive',
        'Cookie': '.AspNetCore.Antiforgery.-M5iseY6GMc=CfDJ8C0A9Z24x0hKu87qqU-_00Y6TuC3BeyPYBtlLYHITMyrsLRZiBbdkbcyKssOwT6XoTA9Nx3urGDUyVUmgcDZAaPt6KvWRrtiPFeF7WCeCKzhtKPJDTQwmVzK7fDRZxhU6kh1t1V5DcEezZHqV8DCveI; TS01bea79f=01a28dbe257fa6b028e93fd0c785a04da948ecf1be491e07e45b6fdafe839b537cf8f25061b2bd526e8c93eb7754a21502c3c0ac0b5217a5abedd5186236d1c4c7db0d8ace981ad7b77526c36a7bc98f98315ea7ee; TS013343a1=01a28dbe25cc66d8d4fedc562eac533c7bbd196647491e07e45b6fdafe839b537cf8f25061167d9ed843504c5f19fa0d484a2915a3'
    }
});

/**
 * Discovery: Search for licensees by state abbreviation (City parameter)
 */
async function searchByState(state) {
    try {
        const response = await client.get('/Licensee_Search_API', {
            params: {
                license: '',
                lastname: '',
                business: '',
                city: state, // The site uses 'city' to filter by state abbreviation
                zipcode: 'null',
                _: Date.now() // Timestamp cache-buster
            },
            headers: { 'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)] }
        });
        
        // Ensure we return the data array (usually response.data.data or similar)
        return response.data; 
    } catch (error) {
        console.error(`Search Error for State ${state}:`, error.message);
        return null;
    }
}

/**
 * Extraction: Get specific profile details by ID
 */
async function getProfileDetails(id) {
    try {
        const response = await client.get('/Get_Licensee_Info', {
            params: { id: id },
            headers: { 'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)] }
        });
        return response.data;
    } catch (error) {
        console.error(`Details Error for ID ${id}:`, error.message);
        return null;
    }
}

module.exports = { searchByState, getProfileDetails, stateAbbreviations };