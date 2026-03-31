const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const URL = "https://www.arkvetmed.org/resources/relief-veterinarians/";

async function scrapeArkansas() {
    console.log("🚀 Starting Arkansas VMA Scraper with formatted headers...");

    try {
        const { data } = await axios.get(URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const results = [];
        const scrapedAt = new Date().toISOString();

        $('table tr').each((index, element) => {
            const columns = $(element).find('td');
            
            if (columns.length > 0) {
                const rowData = [];
                columns.each((i, col) => {
                    rowData.push($(col).text().trim());
                });

                // Only process rows that have the expected number of columns (usually 5)
                // And skip the header row if it contains the word "Name"
                if (rowData.length >= 4 && !rowData[0].toLowerCase().includes('name')) {
                    results.push({
                        vetName: rowData[0] || "",
                        university: rowData[1] || "",
                        phone: rowData[2] || "",
                        email: rowData[3] || "",
                        location: rowData[4] || "",
                        sourceUrl: URL,
                        scrapedAt: scrapedAt
                    });
                }
            }
        });

        if (results.length > 0) {
            // Save JSON
            fs.writeFileSync('arkansas_vets.json', JSON.stringify(results, null, 2));
            
            // Create CSV with camelCase headers
            const headers = ["vetName", "university", "phone", "email", "location", "sourceUrl", "scrapedAt"];
            const csvHeader = headers.join(',') + "\n";
            
            const csvRows = results.map(row => {
                return headers.map(header => {
                    // Wrap in quotes to handle commas inside the data
                    let value = row[header] ? row[header].replace(/"/g, '""') : "";
                    return `"${value}"`;
                }).join(',');
            }).join('\n');

            fs.writeFileSync('arkansas_vets.csv', csvHeader + csvRows);

            console.log(`✅ Success! Extracted ${results.length} veterinarians into clean columns.`);
        } else {
            console.log("⚠️ No data found. Please check the site structure.");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

scrapeArkansas();