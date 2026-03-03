
const axios = require('axios');
const config = require('../../config');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function solveCaptcha(base64Image) {
    if (!config.TWO_CAPTCHA_API_KEY) throw new Error("Missing 2Captcha API Key in config.js");

    
    console.log("      🚀 Sending to 2Captcha...");
    const submitRes = await axios.post('http://2captcha.com/in.php', {
        key: config.TWO_CAPTCHA_API_KEY,
        method: 'base64',
        body: base64Image,
        json: 1
    });

    if (submitRes.data.status !== 1) throw new Error(`2Captcha Submission Failed: ${submitRes.data.request}`);
    const requestId = submitRes.data.request;

   
    process.stdout.write(`      ⏳ Waiting for solution (ID: ${requestId})...`);
    let retries = 0;
    while (retries < 20) {
        await sleep(5000); 
        process.stdout.write('.');
        
        const resultRes = await axios.get(`http://2captcha.com/res.php?key=${config.TWO_CAPTCHA_API_KEY}&action=get&id=${requestId}&json=1`);
        
        if (resultRes.data.status === 1) {
            console.log(" Done!");
            return resultRes.data.request; 
        }
        if (resultRes.data.request !== 'CAPCHA_NOT_READY') {
            throw new Error(`2Captcha Parsing Failed: ${resultRes.data.request}`);
        }
        retries++;
    }
    throw new Error('Captcha Timeout (20 attempts)');
}

module.exports = { solveCaptcha };