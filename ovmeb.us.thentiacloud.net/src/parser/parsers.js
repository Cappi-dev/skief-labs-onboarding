const parseAndMerge = (type, searchData, detailData) => {
    const data = detailData?.result || detailData || {};
    
    const primaryReg = (data.registrationRecords && data.registrationRecords.length > 0) ? data.registrationRecords[0] : {};
    const primaryPractice = (data.placesOfPractice && data.placesOfPractice.length > 0) ? data.placesOfPractice[0] : {};

    // Combine all disciplinary sources to fix the "No" issue for records with public notices
    const disciplineSource = (data.disciplinaryActions?.length > 0) ? data.disciplinaryActions : (data.publicNotices || []);

    return {
        // --- Identity ---
        categoryType: type.toUpperCase(),
        firstName: type === 'licensee' ? (data.firstName || searchData.firstName || "N/A") : "N/A",
        lastName: type === 'licensee' ? (data.lastName || searchData.lastName || "N/A") : "N/A",
        entityName: type === 'licensee' 
            ? `${data.firstName || ''} ${data.lastName || ''}`.trim() 
            : (data.facilityName || searchData.facilityName || "N/A"),
        
        // --- License Info ---
        licenseNumber: primaryReg.licenseNumber || searchData.licenseNumber || "N/A",
        initialLicenseDate: data.initialLicenseDate || "N/A",
        expirationDate: data.licenseExpirationDate || "N/A",
        licenseStatus: primaryReg.registrationStatus || searchData.licenseStatus || "N/A",

        // --- Disciplinary Actions ---
        hasDisciplinaryHistory: disciplineSource.length > 0 ? "Yes" : "No",

        // --- Primary Practice Location ---
        primaryEmployerName: primaryPractice.employerName || "N/A",
        primaryPracticeAddress: type === 'licensee' ? primaryPractice.businessAddress : (data.physicalAddress?.street || "N/A"),
        primaryPracticeCity: type === 'licensee' ? primaryPractice.businessCity : (data.physicalAddress?.city || "N/A"),
        primaryPracticeZip: type === 'licensee' ? primaryPractice.businessZipCode : (data.physicalAddress?.zipCode || "N/A"),
        
        profileUrl: `https://ovmeb.us.thentiacloud.net/webs/ovmeb/register/#/profile/${searchData.id || data.id}`,
        
        // --- Full Recursive Data ---
        allRegistrationHistory: JSON.stringify(data.registrationRecords || []),
        allPracticeLocations: JSON.stringify(data.placesOfPractice || []),
        allDisciplinaryActions: JSON.stringify(disciplineSource)
    };
};

// EXPORT AS OBJECT
module.exports = { parseAndMerge };