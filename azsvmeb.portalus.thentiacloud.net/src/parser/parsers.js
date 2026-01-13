const { flattenObject, toCamelCase } = require('../utils/transforms');

function parseAndMerge(searchData, profileData, sourceUrl) {
    const cols = searchData.columnValues || [];
    
    // Extract the actual profile data from the nested 'result' key
    // This removes the errorCode/errorMessage clutter
    const actualProfile = profileData.result || {};

    const standardized = {
        fullName: `${cols[1]?.data || ''} ${cols[2]?.data || ''}`.trim(),
        firstName: cols[1]?.data || '',
        lastName: cols[2]?.data || '',
        licenseNumber: cols[0]?.data || '',
        licenseType: cols[3]?.data || '',
        licenseStatus: cols[4]?.data || '',
        licenseExpiryDate: cols[5]?.data || '',
        scrapedAt: new Date().toISOString(),
        sourceUrl: sourceUrl,
        currentPageUrl: `https://azsvmeb.portalus.thentiacloud.net/webs/portal/register/#/profile/${searchData.id}`
    };

    const processedData = {};
    // Only process the keys inside the actual profile result
    for (const key in actualProfile) {
        processedData[toCamelCase(key)] = actualProfile[key];
    }

    const finalRecord = { ...processedData, ...standardized };

    return {
        jsonl: finalRecord,
        csv: flattenObject(finalRecord)
    };
}
module.exports = { parseAndMerge };