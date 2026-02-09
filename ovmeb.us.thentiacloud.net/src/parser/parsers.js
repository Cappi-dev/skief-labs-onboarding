const parseLicensee = (searchData, detailData) => {
    const data = detailData?.result || detailData || {};
    const primaryReg = data.registrationRecords?.[0] || {};
    const primaryPractice = data.placesOfPractice?.[0] || {};
    const disciplineSource = (data.disciplinaryActions?.length > 0) ? data.disciplinaryActions : (data.publicNotices || []);

    return {
        firstName: data.firstName || searchData.firstName || "N/A",
        lastName: data.lastName || searchData.lastName || "N/A",
        // NEW: Added per request
        previousNames: data.otherName || "N/A",
        licenseCategory: primaryReg.classOfRegistration || searchData.licenseCategory || "N/A",
        
        licenseNumber: primaryReg.licenseNumber || searchData.licenseNumber || "N/A",
        licenseStatus: primaryReg.registrationStatus || searchData.licenseStatus || "N/A",
        initialLicenseDate: data.initialLicenseDate || "N/A",
        expirationDate: data.licenseExpirationDate || "N/A",
        hasDisciplinaryHistory: disciplineSource.length > 0 ? "Yes" : "No",
        primaryEmployer: primaryPractice.employerName || "N/A",
        primaryPracticeAddress: primaryPractice.businessAddress || "N/A",
        primaryPracticeCity: primaryPractice.businessCity || "N/A",
        profileUrl: `https://ovmeb.us.thentiacloud.net/webs/ovmeb/register/#/profile/${searchData.id || data.id}`,
        allRegistrationHistory: JSON.stringify(data.registrationRecords || []),
        allPracticeLocations: JSON.stringify(data.placesOfPractice || []),
        allDisciplinaryActions: JSON.stringify(disciplineSource)
    };
};

const parseFacility = (searchData, detailData) => {
    const data = detailData?.result || detailData || {};
    const primaryReg = data.registrationRecords?.[0] || {};
    const disciplineSource = (data.disciplinaryActions?.length > 0) ? data.disciplinaryActions : (data.publicNotices || []);

    return {
        facilityName: data.name || data.facilityName || searchData.facilityName || "N/A",
        licenseCategory: "Facility", // Standardized for clinics
        licenseNumber: data.licenseNumber || primaryReg.licenseNumber || searchData.licenseNumber || "N/A",
        facilityStatus: data.status || primaryReg.registrationStatus || searchData.licenseStatus || "N/A",
        initialDate: data.initialDate || data.registrationDate || "N/A",
        expirationDate: data.expirationDate || data.licenseExpirationDate || "N/A",
        ownerName: data.ownerName || data.owner || "N/A",
        managerName: data.managerName || data.manager || "N/A",
        hasDisciplinaryHistory: disciplineSource.length > 0 ? "Yes" : "No",
        address: data.physicalAddress?.street || data.address || "N/A",
        city: data.physicalAddress?.city || data.city || "N/A",
        zip: data.physicalAddress?.zipCode || data.zipCode || "N/A",
        telephone: data.physicalAddress?.phone || data.phoneNumber || "N/A",
        profileUrl: `https://ovmeb.us.thentiacloud.net/webs/ovmeb/register/#/profile/${searchData.id || data.id}`,
        allRegistrationHistory: JSON.stringify(data.registrationRecords || []),
        allDisciplinaryActions: JSON.stringify(disciplineSource)
    };
};

module.exports = { parseLicensee, parseFacility };