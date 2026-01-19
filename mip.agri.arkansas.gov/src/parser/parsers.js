const parseAndMerge = (searchItem, profileDetails, sourceHost) => {
    const data = {};

    const flatten = (obj, prefix = '') => {
        if (!obj) return;
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const newKey = prefix ? `${prefix}_${key}` : key;
            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                flatten(value, newKey);
            } else if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (typeof item === 'object') flatten(item, `${newKey}_${index}`);
                    else data[`${newKey}_${index}`] = item;
                });
            } else {
                data[newKey] = value;
            }
        });
    };

    flatten(searchItem, 'search');
    flatten(profileDetails, 'profile');

    // HELPER: Extract City, State, Zip from a raw address string if it exists
    const rawAddr = searchItem.address || data.profile_Address || '';
    let city = searchItem.city || data.profile_city || '';
    let state = searchItem.state || data.profile_state || '';
    let zipCode = searchItem.zipCode || data.profile_zipCode || '';

    // If those fields are blank, try to parse them from the raw address string (e.g., "LITTLE ROCK, AR 72201")
    if (!city && rawAddr.includes(',')) {
        const parts = rawAddr.replace(/<br>/g, ' ').split(',');
        city = parts[0].trim();
        if (parts[1]) {
            const stateZip = parts[1].trim().split(' ');
            state = stateZip[0];
            zipCode = stateZip[1] || '';
        }
    }

    const normalized = {
        licenseNumber: searchItem.licenseNumber || data.profile_licenseNumber || '',
        firstName: searchItem.firstName || data.profile_firstName || '', // Usually empty in Search API
        lastName: searchItem.lastName || data.profile_lastName || '',
        fullName: searchItem.licensee ? searchItem.licensee.split('<br>')[0].replace(/<[^>]*>?/gm, '') : `${searchItem.lastName || ''}`,
        licenseStatus: searchItem.status || data.profile_status || '',
        licenseType: searchItem.lType || data.profile_licenseType || '',
        city: city,
        state: state,
        zipCode: zipCode,
        expirationDate: searchItem.exp_date || data.profile_expirationDate || '',
        scrapedAt: new Date().toISOString(),
        sourceUrl: `https://${sourceHost}/VetLicensingPortal/Guest/Home/Licensee_Search`,
        profileUrl: `https://${sourceHost}/VetLicensingPortal/Guest/Home/Get_Licensee_Info?id=${searchItem.licenseNumber}`,
        rawHTML: JSON.stringify(profileDetails),
        ...data
    };

    return { jsonl: normalized };
};

module.exports = { parseAndMerge };