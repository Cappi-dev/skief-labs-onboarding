import { searchByLastName, getProfileDetail, sleep } from './src/client/api.js';
import { transformProfile } from './src/parser/transform.js';
import { saveRecord, saveState, loadState, isDuplicate } from './src/utils/io.js';

const LICENSE_TYPES = ['VM', 'VS', 'VT', 'IL', 'PF'];
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
const state = loadState();
let skipMode = !!state;

async function recursiveSearch(type, prefix) {
    if (skipMode) {
        // 🟢 FIX: Allow the script to drill down into the "parent" letters
        // Example: If we stopped at "anderp", we must allow "a" -> "an" -> "and"
        const isParent = state.lastPrefix.startsWith(prefix) && type === state.lastType;
        const isExactMatch = prefix === state.lastPrefix && type === state.lastType;

        if (isExactMatch) {
            skipMode = false; // We found the exact spot, start saving!
        } else if (!isParent) {
            return; // Not the right branch, skip it
        }
    }

    // Only search and save if we are NOT in skipMode (or if it's a parent we need to drill into)
    let results = [];
    if (!skipMode) {
        console.log(`\n🔍 Searching [${type}] prefix: "${prefix}"...`);
        saveState(prefix, type);
        results = await searchByLastName(type, prefix);

        for (const item of results) {
            if (isDuplicate(item.EntityId)) continue;
            await sleep(); 
            const detail = await getProfileDetail(item.EntityId);
            if (detail?.Content) {
                saveRecord(transformProfile(item, detail));
            }
        }
    } else {
        // If we are still in skipMode but it's a parent, we don't search, we just drill deeper
        // We need to fetch the count or just assume we need to go deeper
        results = await searchByLastName(type, prefix);
    }

    // If there were 50+ results, we must go deeper
    if (results.length >= 50) {
        for (const char of ALPHABET) {
            await recursiveSearch(type, prefix + char);
        }
    }
}

async function run() {
    console.log("🚀 Starting Minnesota Vet Scraper...");
    for (const type of LICENSE_TYPES) {
        for (const char of ALPHABET) {
            await recursiveSearch(type, char);
        }
    }
    console.log("\n✅ Scraping Complete!");
}

run();