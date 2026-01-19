const parseAndMerge = (summary, details, sourceUrl) => {
    // 1. Summary Data (Mapping Search API to camelCase)
    const cols = summary.columnValues || [];
    
    // 2. Extract Details (Mapping Profile API nameValuePairs)
    const deepData = {};
    const pairs = details?.result?.nameValuePairs;
    if (Array.isArray(pairs)) {
        pairs.forEach(pair => {
            // Converts "REGISTER_PROFILE_LABEL_LICENSE_NUMBER" -> "license_number"
            const key = pair.name.replace('REGISTER_PROFILE_LABEL_', '').toLowerCase();
            deepData[key] = pair.value;
        });
    }

    // 3. Normalized Merged Object (Exactly matching your Excel requirement)
    const merged = {
        licenseNumber: cols[0]?.data || deepData['license_number'] || '',
        firstName: cols[2]?.data || deepData['first_name'] || '',
        lastName: cols[1]?.data || deepData['last_name'] || '',
        city: cols[4]?.data || deepData['city'] || '',
        state: deepData['state'] || 'Louisiana',
        zipCode: cols[5]?.data || deepData['zip_code'] || deepData['zip code'] || '',
        licenseType: cols[3]?.data || deepData['license_type'] || '',
        licenseStatus: deepData['license_status'] || '',
        initialDate: deepData['initial_date'] || '',
        expirationDate: deepData['expiration_date'] || '',
        fullName: details?.result?.pageTitle?.values?.join(' ') || `${cols[2]?.data} ${cols[1]?.data}`,
        scrapedAt: new Date().toISOString(),
        sourceUrl: sourceUrl,
        profileUrl: `https://${sourceUrl}/webs/portal/register/#/profile/${summary.id}`,
        rawHTML: JSON.stringify(details) 
    };

    return { jsonl: merged };
};

module.exports = { parseAndMerge };