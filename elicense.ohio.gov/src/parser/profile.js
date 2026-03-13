import fs from 'fs';
import * as cheerio from 'cheerio';

console.log("🛠️ Reading local HTML file for offline parsing...");
const html = fs.readFileSync('profile_debug.html', 'utf-8');
const $ = cheerio.load(html);

const profileData = {};

// These are the exact labels we want to hunt down
const labelsToFind = [
    "License Issue Date",
    "License Effective Date",
    "License Expiration Date",
    "Country"
];

console.log("🕵️ Hunting for data...");

labelsToFind.forEach(label => {
    // Find the deepest HTML element that contains EXACTLY our label text
    const el = $(`*:contains("${label}")`).filter(function() {
        return $(this).text().trim() === label;
    }).last();

    if (el.length > 0) {
        // Strategy 1: The value is in the very next element (Sibling)
        let val = el.next().text().trim();
        
        // Strategy 2: The value is in the next column (Parent's Sibling - common in tables)
        if (!val) {
            val = el.parent().next().text().trim();
        }
        
        // Strategy 3: Deeply nested Divs (Parent's Parent Sibling)
        if (!val) {
            val = el.parent().parent().next().text().trim();
        }
        
        profileData[label] = val;
    } else {
        profileData[label] = "NOT FOUND";
    }
});

console.log("\n🎯 --- EXTRACTED DATES AND COUNTRY ---");
console.log(profileData);