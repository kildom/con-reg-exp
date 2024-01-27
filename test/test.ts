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

