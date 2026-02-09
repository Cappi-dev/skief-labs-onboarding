const parseAndMerge = (searchData, detailData) => {
    // The details are often inside a 'result' key from the API response
    const data = detailData?.result || detailData || {};
    
    // 1. Get the primary (first) records for the clean columns
    const firstReg = (data.registrationRecords && data.registrationRecords.length > 0) ? data.registrationRecords[0] : {};
    const firstPractice = (data.placesOfPractice && data.placesOfPractice.length > 0) ? data.placesOfPractice[0] : {};

    const merged = {
        // --- CLEAN COLUMNS ---
        fullName: `${searchData.firstName || ''} ${searchData.lastName || ''}`.trim(),
        firstName: searchData.firstName || "",
        lastName: searchData.lastName || "",
        licenseNumber: firstReg.licenseNumber || "",
        licenseStatus: firstReg.registrationStatus || "N/A",
        licenseType: firstReg.classOfRegistration || searchData.licenseCategory || "",
        employerName: firstPractice.employerName || "N/A",
        businessAddress: firstPractice.businessAddress || "",
        businessCity: firstPractice.businessCity || "",
        businessZip: firstPractice.businessZipCode || "",
        
        // --- DATA OVERFLOW (Moved to the end to keep it "clean") ---
        allPlacesOfPractice: data.placesOfPractice ? JSON.stringify(data.placesOfPractice) : "[]",
        allRegistrationRecords: data.registrationRecords ? JSON.stringify(data.registrationRecords) : "[]",
        
        // --- METADATA ---
        profileUrl: `https://nsbvme.us.thentiacloud.net/webs/nsbvme/register/#/profile/${searchData.id || data.id}`,
        scrapedAt: new Date().toISOString(),
        sourceUrl: "https://nsbvme.us.thentiacloud.net/webs/nsbvme/register/#"
    };

    return merged;
};

// CRITICAL: Ensure this export name matches the import in main.js
module.exports = { parseAndMerge };