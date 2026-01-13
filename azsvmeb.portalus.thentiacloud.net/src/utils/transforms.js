
function toCamelCase(str) {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, '')
        .replace(/_+/g, '');
}


function flattenObject(obj, prefix = '', res = {}) {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const camelKey = toCamelCase(key);
            const propName = prefix ? `${prefix}.${camelKey}` : camelKey;

            // Check for both Objects AND Arrays for recursion
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                flattenObject(obj[key], propName, res);
            } else {
                res[propName] = obj[key];
            }
        }
    }
    return res;
}

module.exports = { toCamelCase, flattenObject };