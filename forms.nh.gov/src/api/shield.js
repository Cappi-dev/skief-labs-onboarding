export function solveChallenge(html) {
    const pMatch = html.match(/var p=(\d+);/);
    const sMatch = html.match(/var s=(\d+);/);
    if (!pMatch || !sMatch) return null;

    let p = parseInt(pMatch[1]);
    const s = parseInt(sMatch[1]);
    const cleanHtml = html.replace(/\/\*[\s\S]*?\*\//g, '');

    const blockRegex = /if\s*\(\(s\s*>>\s*(\d+)\)\s*&\s*1\)\s*p([+-])=\s*(\d+)\s*\*\s*(\d+)\s*;?\s*else\s*p([+-])=\s*(\d+)\s*\*\s*(\d+)/g;
    
    let match;
    while ((match = blockRegex.exec(cleanHtml)) !== null) {
        const shift = parseInt(match[1]);
        if ((s >> shift) & 1) {
            p = (match[2] === '+') ? p + (parseInt(match[3]) * parseInt(match[4])) : p - (parseInt(match[3]) * parseInt(match[4]));
        } else {
            p = (match[5] === '+') ? p + (parseInt(match[6]) * parseInt(match[7])) : p - (parseInt(match[6]) * parseInt(match[7]));
        }
    }

    const finalMatch = cleanHtml.match(/p\s*([+-])=\s*(\d+);?\s*n=leastFactor/);
    if (finalMatch) {
        p = (finalMatch[1] === '+') ? p + parseInt(finalMatch[2]) : p - parseInt(finalMatch[2]);
    }

    const n = leastFactor(p);
    
    // UPDATED REGEX: Captures the final static number next to the :1
    const staticNumMatch = html.match(/s\+":(\d+):1/);
    const staticNum = staticNumMatch ? staticNumMatch[1] : '';

    return `${n}*${p / n}:${s}:${staticNum}:1`;
}

function leastFactor(n) {
    if (n == 0) return 0;
    if (n % 1 || n * n < 2) return 1;
    if (n % 2 == 0) return 2;
    if (n % 3 == 0) return 3;
    if (n % 5 == 0) return 5;
    let m = Math.sqrt(n);
    for (let i = 7; i <= m; i += 30) {
        if (n % i == 0) return i;
        if (n % (i + 4) == 0) return i + 4;
        if (n % (i + 6) == 0) return i + 6;
        if (n % (i + 10) == 0) return i + 10;
        if (n % (i + 12) == 0) return i + 12;
        if (n % (i + 16) == 0) return i + 16;
        if (n % (i + 22) == 0) return i + 22;
        if (n % (i + 24) == 0) return i + 24;
    }
    return n;
}