import vre from './src/vre';

function eq(a: RegExp, b: RegExp) {
    let theSame = (a.source === b.source) && ([...a.flags].sort().join('') === [...b.flags].sort().join(''));
    if (!theSame) {
        console.error('Generated:', a);
        console.error('Expected: ', b);
        throw new Error('Not equal!');
    }
}

// Assertions

// Input boundary assertion: ^, $

eq(vre`begin-of-text end-of-text`, /^$/gs);
eq(vre`start-of-text`, /^/gs);

eq(vre`begin-of-line end-of-line`, /^$/gms);
eq(vre`start-of-line`, /^/gms);

eq(vre`begin-of-text begin-of-line end-of-line end-of-text`, /^(?<=[\r\n\u2028\u2029]|^)(?=[\r\n\u2028\u2029]|$)$/gs);
eq(vre`start-of-text start-of-line`, /^(?<=[\r\n\u2028\u2029]|^)/gs);

eq(vre`not begin-of-text not end-of-text`, /(?<!^)(?!$)/gs);
eq(vre`not start-of-text`, /(?<!^)/gs);

eq(vre`not begin-of-line not end-of-line`, /(?<!^)(?!$)/gms);
eq(vre`not start-of-line`, /(?<!^)/gms);

eq(vre`not begin-of-text not begin-of-line not end-of-line not end-of-text`, /(?<!^)(?<![\r\n\u2028\u2029]|^)(?![\r\n\u2028\u2029]|$)(?!$)/gs);
eq(vre`not start-of-text not start-of-line`, /(?<!^)(?<![\r\n\u2028\u2029]|^)/gs);


let abc = vre`"abc"`
console.log(vre`<CACHE>${abc}`);
console.log(vre`<CACHE>${abc}`);

// Lookahead assertion: (?=...), (?!...)

