const parseAndMerge = (summary, details, domain) => {
    const pairs = details?.result?.nameValuePairs || [];
    const data = {};
    pairs.forEach(p => { data[p.name] = p.value; });

    const nameValues = details?.result?.pageTitle?.values || [];
    const firstName = nameValues[1] || ''; 
    const lastName = nameValues[0] || '';
    const middleName = data.REGISTER_PROFILE_LABEL_MIDDLE_NAME || '';
    const suffix = data.CUST_REGISTER_PROFILE_LABEL_SUFFIX || '';

    const tables = details?.result?.tables || [];

    // 1. DISCIPLINARY ACTION: Arizona Array Format
    const disciplineTable = tables.find(t => t.tableTitle?.includes("DISCIPLINARY_ACTION"));
    let disciplinaryAction = "[]"; 
    
    if (disciplineTable && disciplineTable.records && disciplineTable.records.length > 0) {
        const actions = disciplineTable.records.map(r => ({
            type: r.columnValues.ACTION_TYPE || 'Board Order',
            caseNumber: r.columnValues.CASE_NUMBER || 'N/A',
            effectiveDate: r.columnValues.EFFECTIVE_DATE || ''
        }));
        disciplinaryAction = JSON.stringify(actions);
    }

    // 2. PRACTICE SITES: Clean Merge
    const getPracticeSites = () => {
        const table = tables.find(t => t.tableTitle?.includes("EMPLOYER") || t.headers?.includes("EMPLOYER"));
        if (!table || !table.records) return "None Listed";
        return table.records.map(r => {
            const vals = r.columnValues || {};
            const empName = vals.SHARED_EMPLOYMENT_INFO_LABEL_EMPLOYER0 || '';
            const empAddr = vals.SHARED_EMPLOYMENT_INFO_LABEL_EMPLOYER1 || '';
            return empName && empAddr ? `${empName} - ${empAddr}` : (empName || empAddr || '');
        }).join('; ');
    };

    const typeMap = {
    'cvtt': 'Certified Veterinary Technician/Technologist',
    'vet': 'Veterinarian',
    'eut': 'Euthanasia Technician',
    'registration_class_a': 'Veterinarian', // Added this based on your results
    'registration_class_b': 'Veterinary State Board Exam'
};
    const rawType = data.REGISTER_PROFILE_LABEL_LICENSE_TYPE || '';
    const cleanType = rawType.toLowerCase().replace('reg_classofregistration_', '').replace('_tc_name', '');

    return {
        licenseNumber: data.REGISTER_PROFILE_LABEL_LICENSE_NUMBER || summary.licenseNumber || '',
        firstName,
        middleName,
        lastName,
        suffix,
        fullName: `${firstName} ${middleName} ${lastName} ${suffix}`.replace(/\s+/g, ' ').trim(),
        licenseType: typeMap[cleanType] || cleanType,
        licenseStatus: (data.REGISTER_PROFILE_LABEL_LICENSE_STATUS || '').toLowerCase().includes('active') ? 'active' : 'expired',
        disciplinaryAction, 
        initialDate: data.REGISTER_PROFILE_LABEL_ORIGINAL_DATE_OF_LICENSURE || '',
        expiryDate: data.REGISTER_PROFILE_LABEL_LICENSE_EXPIRY_DATE || '',
        practiceSites: getPracticeSites(),
        profileUrl: `https://${domain}/webs/portal/register/#/profile/${summary.id}`,
        // ADDED FIELDS
        scrapedAt: new Date().toISOString(),
        sourceUrl: `https://${domain}/webs/portal/register/#/`
    };
};

module.exports = { parseAndMerge };