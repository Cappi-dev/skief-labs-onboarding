const parseAndMerge = (searchItem, profileDetails, sourceHost) => {
    const data = {};

    // 1. HELPER: Recursive function to flatten nested objects/arrays
    const flatten = (obj, prefix = '') => {
        if (!obj) return;
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const newKey = prefix ? `${prefix}_${key}` : key;

            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                flatten(value, newKey);
            } else if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (typeof item === 'object') {
                        flatten(item, `${newKey}_${index}`);
                    } else {
                        data[`${newKey}_${index}`] = item;
                    }
                });
            } else {
                data[newKey] = value;
            }
        });
    };

    // 2. Process Search Data
    flatten(searchItem, 'search');

    // 3. Process Profile Details
    flatten(profileDetails, 'profile');

    // 4. Mapped/Formatted Primary Keys (Updated to match your Test Result keys)
    const normalized = {
        licenseNumber: searchItem.licenseNumber || data.profile_licenseNumber || '',
        // Extraction from the 'licensee' HTML or searchItem.lastName
        firstName: searchItem.firstName || '', // Search API sometimes doesn't have firstName separate
        lastName: searchItem.lastName || '',
        fullName: searchItem.licensee ? searchItem.licensee.split('<br>')[0].replace(/<[^>]*>?/gm, '') : `${searchItem.lastName || ''}`,
        licenseStatus: searchItem.status || data.profile_status || '',
        licenseType: searchItem.lType || data.profile_licenseType || '',
        // Location data
        city: searchItem.city || data.profile_city || '',
        state: searchItem.state || data.profile_state || '',
        zipCode: searchItem.zipCode || data.profile_zipCode || '',
        expirationDate: searchItem.exp_date || data.profile_expirationDate || '',
        
        // Metadata
        scrapedAt: new Date().toISOString(),
        sourceUrl: `https://${sourceHost}/VetLicensingPortal/Guest/Home/Licensee_Search`,
        profileUrl: `https://${sourceHost}/VetLicensingPortal/Guest/Home/Get_Licensee_Info?id=${searchItem.licenseNumber}`,
        
        // Requirement: Save raw JSON as "rawHTML" for API scrapers
        rawHTML: JSON.stringify(profileDetails),
        
        // Append all other recursive data
        ...data
    };

    return { jsonl: normalized };
};

module.exports = { parseAndMerge };