import axios from 'axios';

const API_KEY = '6d881536e9bf2da434a9d63e18c8ba00'; // Your 2Captcha Key

export async function solveRecaptchaV2(siteKey, pageUrl) {
    console.log("🧩 Requesting standard reCAPTCHA v2 token from 2Captcha...");
    
    // Standard V2 request (NO version=v3 flag)
    const url = `https://2captcha.com/in.php?key=${API_KEY}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${pageUrl}&json=1`;
    
    const submit = await axios.get(url);
    if (submit.data.status !== 1) throw new Error("2Captcha Submit Fail: " + submit.data.request);
    
    const requestId = submit.data.request;
    console.log("⏳ Waiting for v2 solver (usually 15-45 seconds)...");

    while (true) {
        await new Promise(r => setTimeout(r, 10000));
        const check = await axios.get(`https://2captcha.com/res.php?key=${API_KEY}&action=get&id=${requestId}&json=1`);
        
        if (check.data.request === 'CAPCHA_NOT_READY') continue;
        
        if (check.data.status === 1) {
            console.log("✅ Captcha v2 token secured!");
            return check.data.request;
        }
        throw new Error("2Captcha Error: " + check.data.request);
    }
}