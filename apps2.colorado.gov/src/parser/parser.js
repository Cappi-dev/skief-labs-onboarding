const { JSDOM } = require('jsdom');


function parseAspState(html) {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    return {
        viewState: doc.querySelector('#__VIEWSTATE')?.value,
        viewGen: doc.querySelector('#__VIEWSTATEGENERATOR')?.value,
        eventVal: doc.querySelector('#__EVENTVALIDATION')?.value,
        captchaSrc: doc.getElementById('FormShield1_Image')?.src
    };
}


 
function parseSearchResults(html) {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const results = [];

    const rows = Array.from(doc.querySelectorAll('table[id*="gvSearchResults"] tbody tr'));

    for (const row of rows) {
        if (row.className.includes('Header')) continue;

        const cells = row.querySelectorAll('td');
        if (cells.length < 5) continue;

        const link = cells[0].querySelector('a');
        if (!link) continue;

        const href = link.href; 
        const match = href.match(/'(.*?)'/);
        if (!match) continue;
        const fullId = match[1];

        
        const contactType = cells[4]?.textContent.trim() || 'N/A';

        results.push({ fullId, contactType });
    }
    return results;
}


function parseProfile(html, url, scrapedAt, contactType) {
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    
    const getTableVal = (headerName) => {
        const headers = Array.from(doc.querySelectorAll('th'));
        const targetHeader = headers.find(th => th.textContent.trim().includes(headerName));
        
        if (targetHeader) {
            const index = Array.from(targetHeader.parentElement.children).indexOf(targetHeader);
            const table = targetHeader.closest('table');
            const dataRow = table.querySelector('tbody tr'); 
            if (dataRow && dataRow.children[index]) {
                return dataRow.children[index].textContent.trim();
            }
        }
        return 'N/A';
    };

   
    const fullAddress = getTableVal('City, State, Zip Code');
    let city = 'N/A', state = 'N/A', zipCode = 'N/A';
    if (fullAddress !== 'N/A' && fullAddress.includes(',')) {
        const parts = fullAddress.split(',');
        city = parts[0].trim();
        const stateZip = parts[1].trim().split(/\s+/);
        if (stateZip.length >= 1) state = stateZip[0];
        if (stateZip.length >= 2) zipCode = stateZip[1];
    }

    
    let actions = 'N/A';
    const grid2 = doc.querySelector('table[id*="Grid2"]');
    if (grid2) {
        const rows = Array.from(grid2.querySelectorAll('tbody tr'));
       
        const actionList = rows.map(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
            if (cells.length === 0 || cells[0].includes('There is no Discipline')) return null;
            return cells.join(' | '); 
        }).filter(x => x); 

        if (actionList.length > 0) actions = actionList.join('; ');
    }

 
    let documents = 'N/A';
    const grid3 = doc.querySelector('table[id*="Grid3"]');
    if (grid3) {
        const rows = Array.from(grid3.querySelectorAll('tbody tr'));
        const docList = rows.map(row => {
            const link = row.querySelector('a')?.href;
            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length < 3) return null;
            
            const barcode = cells[1].textContent.trim();
            const type = cells[2].textContent.trim();
            
            return `[Type: ${type}, Barcode: ${barcode}, Link: ${link}]`;
        }).filter(x => x);

        if (docList.length > 0) documents = docList.join('; ');
    }

    return {
        fullName: getTableVal('Name'),
        contactType: contactType,
        city: city,
        state: state,
        zipCode: zipCode,
        licenseNumber: getTableVal('License Number'),
        licenseMethod: getTableVal('License Method'),
        licenseType: getTableVal('License Type'),
        status: getTableVal('License Status'),
        originalDate: getTableVal('Original Issue Date'),
        effectiveDate: getTableVal('Effective Date'),
        expirationDate: getTableVal('Expiration Date'),
        boardProgramActions: actions,
        onlineDocuments: documents, // <--- NEW FIELD
        sourceUrl: 'https://apps2.colorado.gov/dora/licensing/lookup/licenselookup.aspx',
        profileUrl: url
    };
}

module.exports = { parseAspState, parseSearchResults, parseProfile };