/**
 * Parser to clean and structure all veterinarian data columns
 */
async function parseVeterinarians(page) {
    const data = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        
        return rows.map(row => {
            const columns = row.querySelectorAll('td');
            
            // We check for 6 columns now to include Expiration and Status
            if (columns.length >= 6) {
                return {
                    licenseNumber: columns[0]?.innerText.trim() || 'N/A',
                    fullName: columns[1]?.innerText.trim() || 'N/A',
                    city: columns[2]?.innerText.trim() || 'N/A',
                    state: columns[3]?.innerText.trim() || 'N/A',
                    expirationDate: columns[4]?.innerText.trim() || 'N/A',
                    licenseStatus: columns[5]?.innerText.trim() || 'N/A'
                };
            }
            return null;
        }).filter(item => item !== null && item.fullName !== 'Name'); 
    });

    return data;
}


module.exports = { parseVeterinarians };