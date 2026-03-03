import { gotScraping } from 'got-scraping';

const BASE_URL = 'https://vet.hlb.state.mn.us/api/licensure/onlineEntitySearch';

// 🟢 Fresh Headers from your manual search
const HEADERS = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'priority': 'u=1, i',
    'referer': 'https://vet.hlb.state.mn.us/',
    'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'uzlc': '7f90008ffed972-7d61-4fb4-a0fb-1e70ecc5b2c24-1771383967051416379930-002535f05d2c4ef59f88210112765304Bndw2v7a84bb86', //thiss
    'x-client-identifier': 'B20FB678-DA63-43E4-846F-3A630E6306F7',
    'Cookie':'__uzma=8ffed972-7d61-4fb4-a0fb-1e70ecc5b2c2; __uzmb=1771383963; __uzme=2027; __ssds=0; __ssuzjsr0=a9be0cd8e; __uzmaj0=8ffed972-7d61-4fb4-a0fb-1e70ecc5b2c2; __uzmbj0=1771383967; __uzmlj0=ENQb9mvx0KuLv386OrtS9kRZsAQg+OU3Upi8Opq6hio=; __uzmcj0=881768264378; __uzmdj0=1771800346; __uzmfj0=7f90008ffed972-7d61-4fb4-a0fb-1e70ecc5b2c24-1771383967051416379930-002535f05d2c4ef59f882; uzmxj=7f9000ec05265c-910b-4a08-b619-a33b654de4544-1771383967051416379930-23cf3feb08e55f1a82; __uzmc=2505685633974; __uzmd=1771812276; __uzmf=7f90008ffed972-7d61-4fb4-a0fb-1e70ecc5b2c25-1771383964001428312660-00222b87b1896bc2746856; uzmx=7f9000ec05265c-910b-4a08-b619-a33b654de4545-1771383964001428312660-2fae4b19274fa60d856'
};

// 🟢 Randomized human delay (1.5s to 3s)
export const sleep = () => {
    const ms = Math.floor(Math.random() * (3000 - 1500 + 1)) + 1500;
    return new Promise(resolve => setTimeout(resolve, ms));
};

async function safeRequest(url) {
    const response = await gotScraping({
        url,
        method: 'GET',
        headers: HEADERS,
        headerGeneratorOptions: {
            browsers: ['chrome'],
            operatingSystems: ['windows']
        }
    });

    // 🔴 SAFETY CHECK: If the server sends HTML (Challenge) or is empty
    if (!response.body || response.body.includes('<!DOCTYPE') || response.body.includes('perfdrive')) {
        console.error(`\n🛑 BOT BLOCK DETECTED. The server requested browser verification.`);
        console.error(`Please refresh your headers in api.js. state.json has saved your progress.`);
        process.exit(1); // Force close the script so it doesn't skip data
    }

    try {
        return JSON.parse(response.body);
    } catch (e) {
        console.error(`❌ JSON Parse Error at ${url}. Body starts with: ${response.body.substring(0, 30)}`);
        process.exit(1);
    }
}

export async function searchByLastName(licenseType, lastNamePrefix) {
    const url = `${BASE_URL}/search?TopResults=200&LastName=${lastNamePrefix}&FirstName=&IncludeNameHistory=true&IncludeAlternateNames=true&LicenseType=${licenseType}`;
    const data = await safeRequest(url);
    return data?.Content?.Results || [];
}

export async function getProfileDetail(entityId) {
    const url = `${BASE_URL}/detail/${entityId}`;
    return await safeRequest(url);
}