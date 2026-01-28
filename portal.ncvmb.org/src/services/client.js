const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const { JSDOM } = require('jsdom');
const qs = require('qs');

const jar = new CookieJar();
const client = wrapper(axios.create({ 
    baseURL: 'https://portal.ncvmb.org',
    jar, 
    withCredentials: true 
}));

const getViewState = (html) => {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    return {
        '__VIEWSTATE': doc.querySelector('#__VIEWSTATE')?.value || '',
        '__VIEWSTATEGENERATOR': doc.querySelector('#__VIEWSTATEGENERATOR')?.value || '',
        '__EVENTVALIDATION': doc.querySelector('#__EVENTVALIDATION')?.value || ''
    };
};

const searchLicense = async (type, number) => {
    try {
        const init = await client.get('/Verification/search.aspx');
        const tokens = getViewState(init.data);

        const payload = qs.stringify({
            ...tokens,
            'ctl00$Content$ddLicType': type,
            'ctl00$Content$txtLicenseNumber': number,
            'ctl00$Content$btnEnter': 'Search'
        });

        const response = await client.post('/Verification/search.aspx', payload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'https://portal.ncvmb.org/Verification/search.aspx'
            }
        });

        return response.data;
    } catch (error) {
        console.error(`[Network Error]: ${error.message}`);
        return null;
    }
};

module.exports = { searchLicense };