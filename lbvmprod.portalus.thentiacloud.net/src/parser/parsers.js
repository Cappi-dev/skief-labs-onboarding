const parseAndMerge = (summary, details, sourceUrl) => {
    const cols = summary.columnValues || [];
    const summaryData = {
        licenseNumber: cols[0]?.data || '',
        lastName: cols[1]?.data || '',
        firstName: cols[2]?.data || '',
        licenseType: cols[3]?.data || '',
        city: cols[4]?.data || '',
        zipCode: cols[5]?.data || '',
    };

    const deepData = {};
    // SAFETY GUARD: Check if results and nameValuePairs exist
    const pairs = details?.result?.nameValuePairs;
    if (Array.isArray(pairs)) {
        pairs.forEach(pair => {
            const key = pair.name.replace('REGISTER_PROFILE_LABEL_', '').toLowerCase();
            deepData[key] = pair.value;
        });
    }

    // SAFETY GUARD: Check if tables is an array
    const tables = details?.result?.tables;
    if (Array.isArray(tables)) {
        tables.forEach((table, tIndex) => {
            const title = table.tableTitle ? table.tableTitle.replace('REGISTER_PROFILE_HEADING_', '').toLowerCase() : `table_${tIndex}`;
            
            // Check if records is an array before looping
            if (Array.isArray(table.records)) {
                table.records.forEach((record, rIndex) => {
                    if (Array.isArray(record.columnValues)) {
                        record.columnValues.forEach((col, cIndex) => {
                            deepData[`${title}_${rIndex}_col_${cIndex}`] = col.data || '';
                        });
                    }
                });
            }
        });
    }

    const merged = {
        ...summaryData,
        ...deepData,
        fullName: details?.result?.pageTitle?.values?.join(' ') || `${summaryData.firstName} ${summaryData.lastName}`,
        scrapedAt: new Date().toISOString(),
        sourceUrl: sourceUrl,
        profileUrl: `https://lbvmprod.portalus.thentiacloud.net/webs/portal/register/#/profile/${summary.id}`
    };

    return { jsonl: merged, csv: merged };
};

module.exports = { parseAndMerge };