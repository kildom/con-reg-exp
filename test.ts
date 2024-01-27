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

function x(x: string) {
    return vre;
}

console.log(vre.cache`<FIRST>
begin-of-text
optional group<lazy> ("lazy-" or "non-greeny-")
{
    group<optional> "optional"
or
    group<repeat> "repeat"
or
    optional "repeat-"
    {
        optional "at-"
        (group<least> "least-" or group<most> "most-")
        group<count> at-least-1 digit
    or
        group<min> at-least-1 digit
        optional ("-to-" group<max> at-least-1 digit)
    }
    optional ("-time" optional "s")
}
end-of-text
`);
// Lookahead assertion: (?=...), (?!...)

