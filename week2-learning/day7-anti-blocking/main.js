const { chromium } = require('playwright');

async function stealthScrape() {
    // 1. Random User-Agents list
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    ];
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

    // 2. Launch in headless: false (Requirement for Day 7)
    const browser = await chromium.launch({ headless: false }); 
    
    // Set the random User-Agent
    const context = await browser.newPage({ userAgent: randomUA });

    console.log(`🕵️ Using User-Agent: ${randomUA}`);
    await context.goto('https://quotes.toscrape.com/js');

    // 3. Add random delays (Requirement for Day 7)
    const randomDelay = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
    console.log(`😴 Mimicking human behavior: Sleeping for ${randomDelay/1000}s...`);
    await new Promise(r => setTimeout(r, randomDelay));

    const title = await context.title();
    console.log(`✅ Page Title: ${title}`);

    await browser.close();
}

stealthScrape();