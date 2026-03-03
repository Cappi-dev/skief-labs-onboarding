import * as cheerio from 'cheerio';

export function parseProfile(html, url) {
    const $ = cheerio.load(html);
    return {
        name: $('#_ctl31__ctl1_full_name').text().trim(),
        licenseNo: $('#_ctl37__ctl1_license_no').text().trim(),
        profession: $('#_ctl37__ctl1_profession_id').text().trim(),
        licenseType: $('#_ctl37__ctl1_license_type').text().trim(),
        status: $('#_ctl37__ctl1_sec_lic_status').text().trim(),
        issueDate: $('#_ctl37__ctl1_issue_date').text().trim(),
        expiryDate: $('#_ctl37__ctl1_expiration_date').text().trim(),
        sourceUrl: 'https://forms.nh.gov/licenseverification/Search.aspx',
        profileUrl: url,
        scrapedAt: new Date().toISOString()
    };
}