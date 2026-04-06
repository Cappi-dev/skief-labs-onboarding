require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

async function generateSessionCookie() {
    console.log("🤖 Starting Session Manager...");
    
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
        // Press Enter instead of trying to click a specific button
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.keyboard.press('Enter') 
        ]);

        console.log("Extracting cookies...");
        const cookies = await page.cookies();
        
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        if (cookieString.includes('_openc_session')) {
            console.log("✅ Successfully grabbed session cookie!");
            fs.writeFileSync('cookies.json', JSON.stringify({ cookie: cookieString }, null, 4));
            console.log("💾 Cookie saved to cookies.json");
        } else {
            console.log("❌ Login failed or session cookie not found.");
        }

    } catch (error) {
        console.error("Error during session generation:", error.message);
    } finally {
        await browser.close();
    }
}

generateSessionCookie();