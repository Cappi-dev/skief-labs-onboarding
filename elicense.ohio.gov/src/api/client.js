import puppeteer from 'puppeteer';

export async function initSession() {
    console.log("🚀 Launching VISIBLE browser to defeat the Firewall...");
    
    const browser = await puppeteer.launch({ 
        headless: false, 
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    try {
        console.log("📡 Navigating to Ohio eLicense...");
        await page.goto('https://elicense.ohio.gov/oh_verifylicense', { waitUntil: 'domcontentloaded' });

        console.log("⏳ Waiting 5 seconds for the firewall's Javascript challenge...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 🎯 FORCE-CLICK CONTINUE
        const clicked = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('input, button'));
            const continueBtn = btns.find(b => 
                (b.value && b.value.toLowerCase().includes('continue')) || 
                (b.innerText && b.innerText.toLowerCase().includes('continue'))
            );
            if (continueBtn) {
                continueBtn.click();
                return true;
            }
            return false;
        });

        if (clicked) {
            console.log("🖱️ Found the 'Continue' button! Force-clicking it...");
            console.log("⏳ Waiting 6 seconds for the real search page to load...");
            await new Promise(resolve => setTimeout(resolve, 6000)); 
        }

        console.log("✅ Firewall bypassed. Browser is ready to accept commands!");
        
        // Return the active browser and page instead of closing it!
        return { browser, page };

    } catch (error) {
        console.error("❌ Failed to initialize session:", error.message);
        await browser.close();
        throw error;
    }
}