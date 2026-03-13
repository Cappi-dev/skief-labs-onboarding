import { initSession } from './client.js';

async function runProbe() {
    const { $ } = await initSession();

    console.log("\n🕵️ Brute-Forcing the Salesforce Form Structure...");

    console.log("\n--- ALL DROPDOWNS (SELECT MENUS) ---");
    $('select').each((i, el) => {
        const name = $(el).attr('name') || 'NO_NAME';
        const id = $(el).attr('id') || 'NO_ID';
        console.log(`Dropdown ${i + 1}: Name="${name}" | ID="${id}"`);
        
        // Print the first 3 options to see what this dropdown is for
        let options = [];
        $(el).find('option').slice(0, 3).each((j, opt) => {
            options.push($(opt).text().trim());
        });
        console.log(`   Preview: [${options.join(', ')} ...]`);
    });

    console.log("\n--- ALL BUTTONS & SUBMITS ---");
    $('input[type="submit"], input[type="button"], button').each((i, el) => {
        const name = $(el).attr('name') || 'NO_NAME';
        const value = $(el).attr('value') || $(el).text().trim() || 'NO_VALUE';
        console.log(`Button ${i + 1}: Name="${name}" | Value/Text="${value}"`);
    });
}

runProbe();