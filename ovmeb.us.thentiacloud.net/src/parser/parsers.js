const parseAndMerge = (summary, details, domain) => {
    const pairs = details?.result?.nameValuePairs || [];
    const data = {};
    pairs.forEach(p => { data[p.name] = p.value; });

    const tables = details?.result?.tables || [];
    const getTableContent = (title) => {
        const table = tables.find(t => t.tableTitle === title);
        if (!table || !table.records) return "None Listed";
        return table.records.map(r => {
            return Object.values(r.columnValues || {})
                .map(v => (typeof v === 'object' ? v.displayValue || v.data : v))
                .filter(v => v)
                .join(', ');
        }).join('; ');
    };

    return {
        jsonl: {
            licenseNumber: data.REGISTER_PROFILE_LABEL_LICENSE_NUMBER || summary.licenseNumber || '',
            firstName: data.REGISTER_PROFILE_LABEL_FIRST_NAME || '',
            lastName: data.REGISTER_PROFILE_LABEL_LAST_NAME || '',
            fullName: `${data.REGISTER_PROFILE_LABEL_FIRST_NAME || ''} ${data.REGISTER_PROFILE_LABEL_LAST_NAME || ''}`.trim(),
            licenseType: data.REGISTER_PROFILE_LABEL_LICENSE_CATEGORY || summary.licenseType || '',
            licenseStatus: data.REGISTER_PROFILE_LABEL_LICENSE_STATUS || '',
            initialRegistrationDate: data.REGISTER_PROFILE_LABEL_INITIAL_DATE || '',
            licenseExpirationDate: data.REGISTER_PROFILE_LABEL_EXPIRATION_DATE || '',
            education: getTableContent("CUST_REGISTER_PROFILE_HEADING_EDUCATION"),
            practiceSites: getTableContent("REGISTER_PROFILE_HEADING_PRACTICE_SITES"),
            scrapedAt: new Date().toISOString(),
            profileUrl: `https://${domain}/webs/ovmeb/register/#/profile/${summary.id}`
        }
    };
};

module.exports = { parseAndMerge };