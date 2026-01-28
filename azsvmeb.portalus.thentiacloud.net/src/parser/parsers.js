const parseAndMerge = (summary, details, sourceUrl) => {
    const cols = summary.columnValues || [];
    const deepData = {};
    
    const toCamel = (str) => {
        if (!str) return '';
        return str.toLowerCase()
            .replace('register_profile_label_', '')
            .replace('cust_register_profile_label_', '')
            .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
            .trim();
    };

    const pairs = details?.result?.nameValuePairs || [];
    pairs.forEach(pair => {
        let key = toCamel(pair.name);
        if (key === 'issueDate' || key === 'initialDate') key = 'initialRegistrationDate';
        if (key === 'expirationDate') key = 'licenseExpirationDate';
        deepData[key] = pair.value;
    });

    const tableData = details?.result?.tables || [];

    // Extract Practice Sites (Employer) - Handles "View Business" objects
    const practiceTable = tableData.find(t => t.tableTitle === "REGISTER_PROFILE_HEADING_PRACTICE_SITES") || {};
    const practiceSites = (practiceTable.records || []).map(r => {
        const val = r.columnValues?.["REGISTER_PROFILE_HEADING_PRACTICE_SITES0"];
        // Logic to extract name from 'View Business' objects or raw strings
        if (val && typeof val === 'object') {
            return val.displayValue || val.data || val.value || "";
        }
        return (typeof val === 'string' ? val : "");
    }).filter(v => v && v !== "N/A" && v !== "null").join('; ') || "None Listed";

    // Extract Education
    const eduTable = tableData.find(t => t.tableTitle === "CUST_REGISTER_PROFILE_HEADING_EDUCATION") || {};
    const education = (eduTable.records || []).map(r => {
        const val = r.columnValues?.["CUST_REGISTER_PROFILE_HEADING_EDUCATION0"];
        if (val && typeof val === 'object') {
            return val.displayValue || val.data || val.value || "";
        }
        return (typeof val === 'string' ? val : "");
    }).filter(v => v && v !== "N/A" && v !== "null").join('; ') || "None Listed";

    // Extract Disciplinary Actions
    const discTable = tableData.find(t => t.tableTitle === "REGISTER_PROFILE_HEADING_NOTICES") || {};
    const publicDisciplinaryActions = (discTable.records && Array.isArray(discTable.records)) 
        ? discTable.records.map(record => {
            const vals = record.columnValues || {};
            const getVal = (v) => {
                if (v && typeof v === 'object') return v.displayValue || v.data || v.value || "";
                return (typeof v === 'string' ? v : "");
            };
            return {
                type: getVal(vals["REGISTER_PROFILE_HEADING_NOTICES0"]),
                caseNumber: getVal(vals["REGISTER_PROFILE_HEADING_NOTICES1"]),
                effectiveDate: getVal(vals["REGISTER_PROFILE_HEADING_NOTICES2"])
            };
        }) : [];

    return {
        jsonl: {
            licenseNumber: deepData.licenseNumber || cols[0]?.data || '',
            firstName: details?.result?.pageTitle?.values?.[0] || '',
            lastName: details?.result?.pageTitle?.values?.[1] || '',
            fullName: details?.result?.pageTitle?.values?.filter(v => v).join(' ') || '',
            licenseType: deepData.licenseType || '',
            licenseStatus: deepData.licenseStatus || '',
            initialRegistrationDate: deepData.initialRegistrationDate || '',
            licenseExpirationDate: deepData.licenseExpirationDate || '',
            education: education,
            practiceSites: practiceSites,
            publicDisciplinaryActions: publicDisciplinaryActions,
            scrapedAt: new Date().toISOString(),
            sourceUrl: 'https://azsvmeb.portalus.thentiacloud.net/webs/portal/register/#/',
            profileUrl: `https://azsvmeb.portalus.thentiacloud.net/webs/portal/register/#/profile/${summary.id}`,
            rawHTML: JSON.stringify(details)
        }
    };
};

module.exports = { parseAndMerge };