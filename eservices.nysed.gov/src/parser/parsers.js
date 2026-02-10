const cheerio = require('cheerio');

/**
 * Parses the HTML content of the Vue.js modal
 */
const parseNYHtml = (html, profCode, enforcementText) => {
    const $ = cheerio.load(html);
    
    const name = $('#name').text().trim();
    // Validate that we have a real record
    if (!name || name === "" || name === "NOT ON FILE") return null;

    const licenseNum = $('#licenseNumber').text().trim();
    const sourceUrl = 'https://eservices.nysed.gov/professions/verification-search';
    const profileUrl = `${sourceUrl}?licenseNumber=${licenseNum}&professionCode=${profCode}`;

    return {
        fullName: name,
        licenseNumber: licenseNum,
        profession: $('#profession').text().trim(),
        licenseStatus: $('#status').text().trim(),
        dateOfLicensure: $('#dateOfLicensure').text().trim(),
        registrationThrough: $('#registeredThroughDate').text().trim(),
        address: $('#address').text().trim(),
        // Removes newlines for clean CSV output
        enforcementActions: (enforcementText || "No Enforcement Actions Found").replace(/\n/g, ' ').trim(),
        profileUrl: profileUrl,
        sourceUrl: sourceUrl,
        scrapedAt: new Date().toISOString()
    };
};

module.exports = { parseNYHtml };