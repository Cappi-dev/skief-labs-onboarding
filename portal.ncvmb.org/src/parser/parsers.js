const { JSDOM } = require('jsdom');

const parseProfile = (html) => {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const data = {};

    const container = doc.querySelector('.search-results');
    if (!container) return null;

    const dts = container.querySelectorAll('dt');
    dts.forEach(dt => {
        const key = dt.textContent.toLowerCase().trim();
        const value = dt.nextElementSibling?.textContent.trim();
        
        if (key.includes('name')) {
            data.fullName = value;
            if (value.includes(',')) {
                const parts = value.split(',');
                data.lastName = parts[0].trim();
                data.firstName = parts[1].trim();
            } else {
                data.firstName = value;
                data.lastName = '';
            }
        }
        if (key.includes('license number')) data.licenseNumber = value;
        if (key.includes('license type')) data.licenseType = value;
        if (key.includes('status')) data.licenseStatus = value; // Captures Revoked/Active correctly
        if (key.includes('issued date')) data.initialRegistrationDate = value;
        if (key.includes('revoke date')) data.revokeDate = value || '';
        
        if (key.includes('discipline')) {
            const discText = value.replace(/\s+/g, ' ').trim();
            data.publicDisciplinaryActions = discText.includes('No Discipline') ? [] : [{ type: "Discipline", detail: discText }];
        }
    });

    // Mandatory placeholders for CSV consistency across all states
    data.practiceType = "None Listed"; 
    data.supervisingVet = "None Listed";

    return data;
};

module.exports = { parseProfile };