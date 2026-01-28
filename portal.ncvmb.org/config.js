module.exports = {
    SOURCE_HOST: 'portal.ncvmb.org',
    BASE_URL: 'https://portal.ncvmb.org/Verification/search.aspx',
    OUTPUT_CSV: 'output/output_portal.ncvmb.org_profiles_2026.csv',
    OUTPUT_JSONL: 'output/output_portal.ncvmb.org_profiles_2026.jsonl',
    BATCH_SIZE: 5, // We will process in batches as requested
    DELAY: 2000    // Short delay between batches
};