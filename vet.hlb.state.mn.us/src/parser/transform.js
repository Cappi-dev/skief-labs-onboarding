function parseAddress(rawAddress) {
    if (!rawAddress) return { city: 'N/A', state: 'N/A', zipCode: 'N/A' };
    try {
        const lines = rawAddress.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
        const lastLine = lines[lines.length - 1]; 
        const match = lastLine.match(/^(.*),\s+([A-Z]{2})\s+(\d{5}(-\d{4})?)$/);
        if (match) return { city: match[1].trim(), state: match[2], zipCode: match[3] };
        return { city: lastLine, state: 'N/A', zipCode: 'N/A' };
    } catch (e) {
        return { city: 'N/A', state: 'N/A', zipCode: 'N/A' };
    }
}

export function transformProfile(searchData, profileData) {
    const detail = profileData.Content || profileData;
    const license = detail.Licenses?.[0] || {};
    const address = parseAddress(detail.DesignatedAddress || detail.BusinessAddress);

    return {
        entityId: searchData.EntityId,
        licenseNumber: license.LicenseNumber || 'N/A',
        firstName: detail.FirstName || 'N/A',
        middleName: detail.MiddleName || '',
        lastName: detail.LastName || 'N/A',
        fullName: [detail.FirstName, detail.MiddleName, detail.LastName].filter(Boolean).join(' '),
        
        // New fields extracted from the raw data
        birthYear: detail.DateOfBirth ? detail.DateOfBirth.split('-')[0] : 'N/A',
        issueDate: license.GrantDate || 'N/A',
        expirationDate: license.ExpireDate || 'N/A',

        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        licenseType: license.LicenseTypeDescription || searchData.LicenseTypes || 'N/A',
        licenseStatus: license.LicenseStatusDescription || 'N/A',
        profileUrl: `https://vet.hlb.state.mn.us/api/licensure/onlineEntitySearch/detail/${searchData.EntityId}`,
        sourceUrl: `https://vet.hlb.state.mn.us/api/licensure/onlineEntitySearch/search`,
        
        full_json_data: {
            search_api_response: searchData,
            detail_api_response: profileData
        },
        
        scrapedAt: new Date().toISOString()
    };
}