import axios from 'axios';

const API_KEY = 'API_KEY_HERE'; 

export async function solveRecaptcha(siteKey, pageUrl) {
    console.log("🧩 Captcha triggered. Sending to 2Captcha...");
    
    const submit = await axios.get(`https://2captcha.com/in.php?key=${API_KEY}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${pageUrl}&json=1`);
    if (submit.data.status !== 1) throw new Error("2Captcha Submit Fail: " + submit.data.request);
    
    const requestId = submit.data.request;
    console.log("⏳ Waiting for solver...");

    while (true) {
        await new Promise(r => setTimeout(r, 7000));
        const check = await axios.get(`https://2captcha.com/res.php?key=${API_KEY}&action=get&id=${requestId}&json=1`);
        
        if (check.data.request === 'CAPCHA_NOT_READY') continue;
        
        if (check.data.status === 1) {
            console.log("✅ Captcha solved!");
            return check.data.request;
        }
        throw new Error("2Captcha Error: " + check.data.request);
    }
}