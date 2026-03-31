const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const URL = "https://alvma.com/resources/available-relief-veterinarians/";

async function scrapeAlabama() {
    console.log("🚀 Starting Alabama Elementor-Grid Scraper...");

    try {
        const { data } = await axios.get(URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const results = [];
        const scrapedAt = new Date().toISOString();

        // Target each veterinarian's section
        $('.elementor-inner-section').each((index, element) => {
            const section = $(element);
            
            // 1. Get the Name from the <h5> heading
            const vetName = section.find('h5.elementor-heading-title').text().trim();

            if (vetName) {
                // 2. Get all text from the text editor blocks
                const allText = section.text();
                
                // 3. Extract Phone and Email using Regex
                const emailMatch = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                const phoneMatch = allText.match(/(\(\d{3}\)\s*|\d{3}[.-])?\d{3}[.-]\d{4}/);

                // 4. Extract Location (it's usually the text before "Phone" or "Licensed")
                // We'll clean up the raw text to get the address info
                const cleanText = section.find('.elementor-widget-text-editor').first().text().trim();

                results.push({
                    vetName: vetName,
                    phone: phoneMatch ? phoneMatch[0] : "",
                    email: emailMatch ? emailMatch[0] : "",
                    location: cleanText.split(/Phone:|Email:/i)[0].trim(),
                    sourceUrl: URL,
                    scrapedAt: scrapedAt
                });
            }
        });

        if (results.length > 0) {
            // Remove potential duplicates (sometimes Elementor mirrors sections for mobile)
            const uniqueResults = results.filter((v, i, a) => a.findIndex(t => t.vetName === v.vetName) === i);

            fs.writeFileSync('alabama_relief.json', JSON.stringify(uniqueResults, null, 2));
            
            const headers = ["vetName", "phone", "email", "location", "sourceUrl", "scrapedAt"];
            const csvHeader = headers.join(',') + "\n";
            const csvRows = uniqueResults.map(row => {
                return headers.map(header => `"${row[header].toString().replace(/"/g, '""')}"`).join(',');
            }).join('\n');

            fs.writeFileSync('alabama_relief.csv', csvHeader + csvRows);
            console.log(`✅ Success! Extracted ${uniqueResults.length} veterinarians from the grid.`);
        } else {
            console.log("⚠️ Selector failed. The class names might be dynamic.");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

scrapeAlabama();