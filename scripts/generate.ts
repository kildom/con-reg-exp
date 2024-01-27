import vre from '../src/vre';

console.log('\n');


console.log(`const tokenRegexBase = ${vre`<FIRST> <STICKY>

repeat whitespace
{
    begin: [{(]
or
    end: [)}]
or
    label: ([a-zA-Z_] repeat [a-zA-Z0-9_])
    ":"
or
    keyword: at-least-1 [a-zA-Z0-9\\-]
or
    literal: {
        ["]
        lazy-repeat ("\\" any or any)
        ["]
    }
or
    "<"
    identifier: lazy-repeat any
    ">"
or
    "["
    optional complement: "^"
    characterClass: lazy-repeat ("\\" any or any)
    "]"
or
    prefix: ("\`" at-least-3 [A-Z])
    index: at-least-1 [0-9]
    "}"
or
    comment1: ("/*" lazy-repeat any "*/")
or
    comment2: ("//" lazy-repeat any) end-of-line
}
repeat whitespace
`};\n`);


console.log(`const quantifierRegExp = ${vre`<FIRST>
begin-of-text
optional lazy: ("lazy-" or "non-greeny-")
{
    optional: "optional"
or
    repeat: "repeat"
or
    optional "repeat-"
    {
        optional "at-"
        (least: "least-" or most: "most-")
        count: at-least-1 digit
    or
        min: at-least-1 digit
        optional ("-to-" max: at-least-1 digit)
    }
    optional ("-time" optional "s")
}
end-of-text
`};\n`);

console.log(`const cacheDetectionRegExp = ${vre`<CACHE> <FIRST> <IGNORE-CASE>
begin-of-text
repeat whitespace
"<CACHE>"
`};\n`);
