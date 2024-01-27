/*
 * Copyright 2024 Dominik Kilian
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the “Software”), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions
 * of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
*/

import vre from '../src/vre';

console.log('\n');


console.log(`const tokenRegExpBase = ${vre`<FIRST> <STICKY>

repeat whitespace
{
    begin: [{(]
or
    end: [)}]
or
    label: ([a-zA-Z_] repeat [a-zA-Z0-9_])
    ":"
or
    keyword: at-least-1 [a-zA-Z0-9\u2011\\-]
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

console.log(`const cacheDetectionRegExp = ${vre`<FIRST> <IGNORE-CASE>
begin-of-text
repeat whitespace
"<CACHE>"
`};\n`);

const number = vre`
    optional [+-]                   // Sign
    {
        at-least-1 digit            // Integral part
        optional ("." repeat digit) // Optional factional part
    or
        "." at-least-1 digit        // Variant with only fractional part
    }
    optional {                      // Optional exponent part
        [eE]
        optional [+-]
        at-least-1 digit
    }
`;

const ws = vre`repeat whitespace`;

console.log(vre`<CACHE> <FIRST>
        begin-of-text ${ws}
        "[" ${ws}               // Begin of array
        optional {              // Array can be empty
            repeat {            // Numbers ended with comma
                ${number} ${ws}
                "," ${ws}
            }
            ${number} ${ws}   // Last number has no comma
        }
        "]" ${ws}
        end-of-text
    `);