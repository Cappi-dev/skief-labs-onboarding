const parseAndMerge = (summary, details, sourceUrl) => {
    const cols = summary.columnValues || [];
    const deepData = {};
    
    const toCamel = (str) => {
        if (!str) return '';
        return str.toLowerCase()
            .replace('register_profile_label_', '')
            .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
            .trim();
    };

    const pairs = details?.result?.nameValuePairs;
    if (Array.isArray(pairs)) {
        pairs.forEach(pair => {
            let key = toCamel(pair.name);
            if (key === 'zip code') key = 'zipCode';
            if (key === 'initialDate') key = 'initialRegistrationDate';
            deepData[key] = pair.value;
        });
    }

    // --- TABLE EXTRACTION (Calibrated to Louisiana Portal) ---
    const tableData = details?.result?.tables || [];
    const discTable = tableData.find(t => t.tableTitle === "REGISTER_PROFILE_HEADING_NOTICES") || {};
    
    const publicDisciplinaryActions = (discTable.records && Array.isArray(discTable.records)) 
        ? discTable.records.map(record => {
            const vals = record.columnValues || {};
            return {
                type: vals["REGISTER_PROFILE_HEADING_NOTICES0"] || "",
                effectiveDate: vals["REGISTER_PROFILE_HEADING_NOTICES1"] || "",
                caseNumber: vals["REGISTER_PROFILE_HEADING_NOTICES2"] || ""
            };
        }) 
        : [];

    return {
        jsonl: {
            licenseNumber: cols[0]?.data || deepData.licenseNumber || '',
            firstName: cols[2]?.data || deepData.firstName || '',
            lastName: cols[1]?.data || deepData.lastName || '',
            fullName: details?.result?.pageTitle?.values?.filter(v => v).join(' ').replace(/\s+/g, ' ').trim() || `${cols[2]?.data} ${cols[1]?.data}`,
            city: cols[4]?.data || deepData.city || '',
            state: deepData.state || 'Louisiana',
            zipCode: cols[5]?.data || deepData.zipCode || '',
            licenseType: cols[3]?.data || deepData.licenseType || '',
            licenseStatus: deepData.licenseStatus || '',
            initialRegistrationDate: deepData.initialRegistrationDate || deepData.initialDate || '', 
            expirationDate: deepData.expirationDate || '',
            publicDisciplinaryActions: publicDisciplinaryActions, 
            scrapedAt: new Date().toISOString(),
            sourceUrl: `https://${sourceUrl}/webs/portal/register/#/`,
            profileUrl: `https://${sourceUrl}/webs/portal/register/#/profile/${summary.id}`,
            rawHTML: JSON.stringify(details)
        }
    };
};

module.exports = { parseAndMerge };