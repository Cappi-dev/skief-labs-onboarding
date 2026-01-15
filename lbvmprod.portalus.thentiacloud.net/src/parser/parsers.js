const parseAndMerge = (summary, details, sourceUrl) => {
    // 1. Summary Data (Mapped from the search results)
    const cols = summary.columnValues || [];
    const summaryData = {
        licenseNumber: cols[0]?.data || '',
        lastName: cols[1]?.data || '',
        firstName: cols[2]?.data || '',
        licenseType: cols[3]?.data || '',
        city: cols[4]?.data || '',
        zipCode: cols[5]?.data || '',
    };

    // 2. RECURSIVE MAPPING: Extract all secondary fields dynamically
    const deepData = {};
    const pairs = details?.result?.nameValuePairs;
    if (Array.isArray(pairs)) {
        pairs.forEach(pair => {
            // Converts "REGISTER_PROFILE_LABEL_SPECIALTY" -> "specialty"
            const key = pair.name.replace('REGISTER_PROFILE_LABEL_', '').toLowerCase();
            deepData[key] = pair.value;
        });
    }

    // 3. TABLE EXTRACTION: Capture all table records (Addresses, Actions, etc.)
    const tables = details?.result?.tables;
    if (Array.isArray(tables)) {
        tables.forEach((table, tIndex) => {
            const title = table.tableTitle ? table.tableTitle.replace('REGISTER_PROFILE_HEADING_', '').toLowerCase() : `table_${tIndex}`;
            if (Array.isArray(table.records)) {
                table.records.forEach((record, rIndex) => {
                    if (Array.isArray(record.columnValues)) {
                        record.columnValues.forEach((col, cIndex) => {
                            deepData[`${title}_row${rIndex}_col${cIndex}`] = col.data || '';
                        });
                    }
                });
            }
        });
    }

    // 4. MERGE EVERYTHING
    const merged = {
        ...summaryData,
        ...deepData,
        fullName: details?.result?.pageTitle?.values?.join(' ') || `${summaryData.firstName} ${summaryData.lastName}`,
        scrapedAt: new Date().toISOString(),
        sourceUrl: sourceUrl, // Requirement #1
        profileUrl: `https://lbvmprod.portalus.thentiacloud.net/webs/portal/register/#/profile/${summary.id}`,
        // Requirement #3: Save raw JSON as "rawHTML" string for API scrapers
        rawHTML: JSON.stringify(details) 
    };

    return { jsonl: merged };
};

module.exports = { parseAndMerge };