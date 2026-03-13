import * as cheerio from 'cheerio';

export function parseUtahResults(html, sourceUrl) {
    const $ = cheerio.load(html);
    const results = [];
    $('.resultsTable tr.bg_off, .resultsTable tr.bg_on').each((i, el) => {
        const cols = $(el).find('td');
        if (cols.length >= 4) {
            const nameTag = $(cols[0]).find('a');
            const onClickAttr = nameTag.attr('onclick') || '';
            const match = onClickAttr.match(/value='(\d+)'/);
            if (match) {
                results.push({
                    fullName: nameTag.text().trim(),
                    listLicenseNumber: $(cols[3]).text().trim(),
                    index: match[1], 
                    sourceUrl,
                    scrapedAt: new Date().toISOString()
                });
            }
        }
    });
    return results;
}

export function parseUtahDetails(html, profileUrl) {
    const $ = cheerio.load(html);
    const getVal = (label) => $(`td:contains("${label}")`).next('td').text().replace(/\s\s+/g, ' ').trim();

    // 🛡️ Armen's Request: Keep the full raw string
    const addressRaw = getVal("City, State, Zip, Country:");
    let city = '', state = '', zip = '', country = '';

    const addressMatch = addressRaw.match(/^(.*?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)(?:\s+(.*))?$/i);
    if (addressMatch) {
        city = addressMatch[1].trim();
        state = addressMatch[2].trim();
        zip = addressMatch[3].trim();
        country = addressMatch[4] ? addressMatch[4].trim() : ''; 
    } else {
        city = addressRaw; 
    }

    const education = [];
    $('h3:contains("Education:")').next('table').find('tr').each((i, el) => {
        const cols = $(el).find('td');
        if (cols.length >= 4) {
            education.push([$(cols[0]).text().trim(), $(cols[1]).text().trim(), $(cols[2]).text().trim(), $(cols[3]).text().trim()].join('|'));
        }
    });

    return {
        fullName: getVal("Name:"), 
        addressRaw, // 👈 Original string kept for safety
        city, state, zip, country,
        profession: getVal("Profession:"),
        licenseType: getVal("License Type:"),
        licenseNumber: getVal("License Number:"),
        obtainedBy: getVal("Obtained By:"),
        licenseStatus: getVal("License Status:"),
        originalIssueDate: getVal("Original Issue Date:"),
        expirationDate: getVal("Expiration Date:"),
        disciplinaryAction: getVal("Agency and Disciplinary Action*:"),
        docketNumber: getVal("Docket and Citation Number(s):"),
        ePrescriber: getVal("E-Prescriber:"),
        education,
        profileUrl, 
        scrapedAt: new Date().toISOString()
    };
}