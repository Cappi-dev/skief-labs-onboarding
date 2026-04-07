require('dotenv').config();
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');

const TWOCAPTCHA_API_KEY = process.env.TWOCAPTCHA_KEY;
const SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

async function solveCaptcha() {
    console.log("Asking 2Captcha to solve the security check...");
    
    const taskResponse = await axios.post('https://api.2captcha.com/createTask', {
        clientKey: TWOCAPTCHA_API_KEY,
        task: {
            type: "RecaptchaV2TaskProxyless",
            websiteURL: "https://opencorporates.com/users/sign_in",
            websiteKey: SITE_KEY
        }
    });

    if (taskResponse.data.errorId !== 0) {
        console.log("2Captcha error: " + taskResponse.data.errorDescription);
        return null;
    }

    const taskId = taskResponse.data.taskId;
    let isDone = false;

    while (!isDone) {
        await new Promise(r => setTimeout(r, 5000));
        
        const resultResponse = await axios.post('https://api.2captcha.com/getTaskResult', {
            clientKey: TWOCAPTCHA_API_KEY,
            taskId: taskId
        });

        if (resultResponse.data.status === "ready") {
            return resultResponse.data.solution.gRecaptchaResponse;
        }
    }
}

async function generateSessionCookie() {
    console.log("Starting Session Manager...");

    const browser = await puppeteer.launch({ 
        headless: false, 
        args: ['--no-sandbox', '--disable-web-security'] 
    });
    
    const page = await browser.newPage();

    try {
        console.log("Navigating to OpenCorporates login page...");
        await page.goto('https://opencorporates.com/users/sign_in', { waitUntil: 'networkidle2' });

        console.log("Entering credentials...");
        await page.waitForSelector('#user_email');
        await page.type('#user_email', process.env.OC_EMAIL, { delay: 50 });
        await page.type('#user_password', process.env.OC_PASSWORD, { delay: 50 });

        console.log("Pressing Enter to Login...");
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.keyboard.press('Enter') 
        ]);

        const pageTitle = await page.title();
        
        if (pageTitle.toLowerCase().includes('security') || pageTitle.toLowerCase().includes('attention')) {
            console.log("Security wall detected. Starting bypass...");
            
            const token = await solveCaptcha();
            
            if (token) {
                console.log("Injecting token into the page...");
                
                await page.evaluate((captchaToken) => {
                    document.getElementById('g-recaptcha-response').innerHTML = captchaToken;
                }, token);

                console.log("Submitting the security form...");
                
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle2' }),
                    page.evaluate(() => {
                        document.querySelector('form').submit();
                    })
                ]);
            }
        }

        console.log("Extracting cookies...");
        const cookies = await page.cookies();
        
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        if (cookieString.includes('_openc_session')) {
            console.log("Successfully grabbed session cookie!");
            fs.writeFileSync('cookies.json', JSON.stringify({ cookie: cookieString }, null, 4));
            console.log("Cookie saved to cookies.json");
        } else {
            console.log("Login failed or session cookie not found.");
        }

    } catch (error) {
        console.error("Error during session generation:", error.message);
    } finally {
        await browser.close();
    }
}

generateSessionCookie();