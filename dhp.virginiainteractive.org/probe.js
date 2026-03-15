import puppeteer from 'puppeteer';

async function runProbe() {
    console.log("🚀 Launching Probe...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        console.log("📡 Navigating to Virginia DHP...");
        await page.goto('https://dhp.virginiainteractive.org/Lookup/Index', { waitUntil: 'networkidle2' });
        
        console.log("📄 Page loaded! Extracting form data...");

        const formData = await page.evaluate(() => {
            const data = {
                dropdowns: [],
                textInputs: [],
                buttons: [],
                captchas: false
            };

            // 1. Find all Dropdowns (Selects)
            document.querySelectorAll('select').forEach(select => {
                const options = Array.from(select.options).map(opt => ({
                    text: opt.innerText.trim(),
                    value: opt.value
                }));
                data.dropdowns.push({
                    id: select.id,
                    name: select.name,
                    optionCount: options.length,
                    firstFewOptions: options.slice(0, 4) // Just grab a few to see what they are
                });
            });

            // 2. Find all Text Inputs
            document.querySelectorAll('input[type="text"]').forEach(input => {
                data.textInputs.push({
                    id: input.id,
                    name: input.name,
                    placeholder: input.placeholder || ''
                });
            });

            // 3. Find Search Buttons
            document.querySelectorAll('input[type="submit"], button').forEach(btn => {
                data.buttons.push({
                    id: btn.id,
                    value: btn.value || btn.innerText.trim()
                });
            });

            // 4. Check for Captchas / Firewalls
            if (document.querySelector('iframe[src*="recaptcha"], iframe[src*="turnstile"], #cf-challenge-running')) {
                data.captchas = true;
            }

            return data;
        });

        console.log("\n📊 --- PROBE RESULTS ---");
        console.log(JSON.stringify(formData, null, 2));

    } catch (e) {
        console.error("❌ Probe failed:", e.message);
    } finally {
        console.log("\n👻 Closing browser.");
        await browser.close();
    }
}

runProbe();