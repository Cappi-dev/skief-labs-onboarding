import * as cheerio from 'cheerio';

export function parseProfile(html, profileUrl) {
    const $ = cheerio.load(html);
    const data = {};

    // 1. RECURSIVE LABEL PARSER (For Demographic Info)
    $('.rlabel, .rdata').each((i, el) => {
        const labelText = $(el).find('span').text().trim() || $(el).text().trim();
        const valueText = $(el).next('.rdata').text().trim();

        if (labelText && valueText && labelText !== valueText) {
            let cleanLabel = labelText.replace(':', '').replace('#', 'No').trim();
            const camelKey = cleanLabel
                .split(/[^a-zA-Z0-9]/)
                .filter(Boolean)
                .map((word, index) => 
                    index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join('');
            if (camelKey) data[camelKey] = valueText;
        }
    });

    // 2. CSR STATUS EXTRACTION (From the UDO DataGrid)
    const csrTable = $('.udo_datagrid');
    let csrStatus = "None";
    csrTable.find('tr').each((i, el) => {
        const rowText = $(el).text();
        if (rowText.includes('CSR')) {
            csrStatus = $(el).find('td').last().text().trim();
        }
    });
    data.csrStatus = csrStatus;

    // 3. LITIGATION / DISCIPLINE (Yes/No Flag)
    const litigationContent = $('#label_disinfo').nextAll('.repeater').first().text().trim();
    data.hasLitigation = (litigationContent && litigationContent !== '-') ? "Yes" : "No";

    // 4. RELATED LICENSES COUNT
    const relatedCount = $('.repeatercontainer tr').length;
    data.relatedCount = relatedCount > 0 ? relatedCount : 0;

    // 5. NAME PARSING & FALLBACKS
    data.fullName = data.name || $('#_ctl27__ctl1_full_name').text().trim() || '';
    data.licenseNo = data.licNo || $('#_ctl37__ctl1_license_no').text().trim() || '';
    
    const nameParts = data.fullName.split(' ').filter(Boolean);
    data.firstName = nameParts[0] || '';
    data.lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    data.middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

    // 6. META DATA
    data.profileUrl = profileUrl;
    data.sourceUrl = "https://mylicense.in.gov/EVerification/Search.aspx";
    data.scrapedAt = new Date().toISOString();

    return data;
}