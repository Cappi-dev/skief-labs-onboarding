const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const CLINIC_URL = "https://akvma.org/find-a-veterinarian/";
const RELIEF_URL = "https://akvma.org/relief-veterinarians/";

// Function to decode Cloudflare protected emails
function decodeEmail(encodedString) {
    let email = "", r = parseInt(encodedString.substr(0, 2), 16), n, i;
    for (n = 2; encodedString.length - n; n += 2) {
        i = parseInt(encodedString.substr(n, 2), 16) ^ r;
        email += String.fromCharCode(i);
    }
    return email;
}

async function scrapeAlaska() {
    console.log("🚀 Starting Master Alaska Scraper with Email Decoding...");
    const results = [];
    const scrapedAt = new Date().toISOString();

    try {
        // --- PART 1: Scrape Relief Veterinarians ---
        console.log("📥 Fetching Relief Veterinarians...");
        const reliefRes = await axios.get(RELIEF_URL);
        const $relief = cheerio.load(reliefRes.data);

        $relief('.elementor-widget-text-editor').each((i, el) => {
            const container = $relief(el);
            const html = container.html();
            const rawText = container.text().trim();
            
            if (rawText.includes('Dr.')) {
                let name = rawText.split('Practice Area')[0].replace('Strong', '').trim();
                
                // Try to find encoded Cloudflare email in the HTML
                let email = "";
                const cfEmailMatch = html.match(/data-cfemail="([^"]+)"/);
                if (cfEmailMatch) {
                    email = decodeEmail(cfEmailMatch[1]);
                } else {
                    // Fallback to standard regex if not encoded
                    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
                    const match = rawText.match(emailRegex);
                    if (match) email = match[0];
                }
                
                const phoneMatch = rawText.match(/(\d{3}[.-])?\d{3}[.-]\d{4}/);
                
                let serviceArea = "";
                if (rawText.includes('Service Area:')) {
                    serviceArea = rawText.split('Service Area:')[1].trim();
                }

                if (name && (email || phoneMatch)) {
                    results.push({
                        vetName: name,
                        phone: phoneMatch ? phoneMatch[0] : "",
                        email: email,
                        location: serviceArea || "Alaska",
                        type: "Relief Vet",
                        sourceUrl: RELIEF_URL,
                        scrapedAt: scrapedAt
                    });
                }
            }
        });

        // --- PART 2: Scrape Clinics ---
        console.log("📥 Fetching Clinic Directory...");
        const clinicRes = await axios.get(CLINIC_URL);
        const $clinic = cheerio.load(clinicRes.data);

        $clinic('article').each((i, el) => {
            const article = $clinic(el);
            const titles = [];
            article.find('.elementor-heading-title').each((j, head) => {
                titles.push($clinic(head).text().trim());
            });

            if (titles.length > 0) {
                const phoneMatch = article.text().match(/(\d{3}[.-])?\d{3}[.-]\d{4}/);
                results.push({
                    vetName: titles[0], 
                    phone: phoneMatch ? phoneMatch[0] : "",
                    email: "", 
                    location: titles.slice(1, 3).join(', '),
                    type: "Clinic",
                    sourceUrl: CLINIC_URL,
                    scrapedAt: scrapedAt
                });
            }
        });

        // --- PART 3: Save Data ---
        if (results.length > 0) {
            const uniqueResults = results.filter((v, i, a) => a.findIndex(t => t.vetName === v.vetName) === i);

            fs.writeFileSync('alaska_master_list.json', JSON.stringify(uniqueResults, null, 2));

            const headers = ["vetName", "phone", "email", "location", "type", "sourceUrl", "scrapedAt"];
            const csvRows = uniqueResults.map(row => 
                headers.map(h => `"${(row[h] || "").toString().replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(',')
            );
            fs.writeFileSync('alaska_master_list.csv', [headers.join(','), ...csvRows].join('\n'));

            console.log(`✅ Success! Captured ${uniqueResults.length} records with decoded emails.`);
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

scrapeAlaska();