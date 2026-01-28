const parseAndMerge = (searchItem, profileDetails, sourceHost) => {
    const clean = (str) => str ? str.replace(/<[^>]*>?/gm, '').trim() : '';
    
    // 1. Get the actual data object from the profileDetails
    const detailsArray = Array.isArray(profileDetails) ? profileDetails : (profileDetails?.data || []);
    const actualData = detailsArray[0] || {}; 

    // 2. Improved Address Parsing
    let city = '', state = '', zip = '', workAddr = '';
    const rawAddress = actualData.mail_Address || searchItem.address || '';
    if (rawAddress) {
        const parts = rawAddress.split(/<br\s*\/?>/i).map(p => clean(p)).filter(p => p);
        workAddr = parts[0] || ''; 
        const lastPart = parts[parts.length - 1] || '';
        if (lastPart.includes(',')) {
            const [c, sz] = lastPart.split(',');
            city = c.trim();
            if (sz) {
                const partsSZ = sz.trim().split(/\s+/);
                state = partsSZ[0];
                zip = partsSZ[1] || '';
            }
        }
    }

    // 3. Smart Disciplinary Logic (Fixes Duplicates)
    let publicDisciplinaryActions = [];
    if (actualData.has_disc_action === true || actualData.disciplinary_action !== "None") {
        publicDisciplinaryActions = [{
            type: "Board Action",
            description: clean(actualData.disciplinary_action),
            date: clean(actualData.lissuedate) // Using issue date as proxy if no event date
        }];
    }

    const id = searchItem.licenseNumber || actualData.lno || searchItem.licenseId;

    return {
        jsonl: {
            licenseNumber: actualData.lno || searchItem.licenseNumber || '',
            fullName: clean(actualData.name || (searchItem.licensee ? searchItem.licensee.split(/<br\s*\/?>/i)[0] : '')),
            licenseType: actualData.ltype || searchItem.lType || '',
            licenseStatus: actualData.lstatus || searchItem.status || '',
            businessName: clean(actualData.company || searchItem.business || ''),
            practiceType: actualData.practice_type || "None Listed",
            supervisingVet: actualData.supervising_Vet || "None",
            workAddressName: workAddr,
            city: city,
            state: state,
            zipCode: zip,
            initialRegistrationDate: actualData.lissuedate || '',
            expirationDate: actualData.lexpdate || searchItem.exp_date || '',
            publicDisciplinaryActions: publicDisciplinaryActions,
            scrapedAt: new Date().toISOString(),
            sourceUrl: `https://${sourceHost}/VetLicensingPortal/Guest/Home/Licensee_Search`,
            profileUrl: `https://${sourceHost}/VetLicensingPortal/Guest/Home/Get_Licensee_Info?id=${id}`,
            rawHTML: JSON.stringify(profileDetails)
        }
    };
};

module.exports = { parseAndMerge };