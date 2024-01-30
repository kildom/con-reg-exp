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

import cre, { CREError } from '../src/con-reg-exp';

function eq(a: RegExp, b: RegExp) {
    let theSame = (a.source === b.source) && ([...a.flags].sort().join('') === [...b.flags].sort().join(''));
    if (!theSame) {
        console.error('Generated:', a);
        console.error('Expected: ', b);
        throw new Error('Not equal!');
    }
}

function except(func: any) {
    try {
        func();
    } catch (err) {
        if (err instanceof CREError) return;
        console.error('Error different than expected!');
        throw err;
    }
    throw new Error('Expecting error');
}

// Assertions

// Input boundary assertion: ^, $

eq(cre`begin-of-text end-of-text`, /^$/gsu);
eq(cre`start-of-text`, /^/gsu);

eq(cre`begin-of-line end-of-line`, /^$/gmsu);
eq(cre`start-of-line`, /^/gmsu);

eq(cre`begin-of-text begin-of-line end-of-line end-of-text`, /^(?<=[\r\n\u2028\u2029]|^)(?=[\r\n\u2028\u2029]|$)$/gsu);
eq(cre`start-of-text start-of-line`, /^(?<=[\r\n\u2028\u2029]|^)/gsu);

eq(cre`not begin-of-text not end-of-text`, /(?<!^)(?!$)/gsu);
eq(cre`not start-of-text`, /(?<!^)/gsu);

eq(cre`not begin-of-line not end-of-line`, /(?<!^)(?!$)/gmsu);
eq(cre`not start-of-line`, /(?<!^)/gmsu);

eq(cre`not begin-of-text not begin-of-line not end-of-line not end-of-text`, /(?<!^)(?<![\r\n\u2028\u2029]|^)(?![\r\n\u2028\u2029]|$)(?!$)/gsu);
eq(cre`not start-of-text not start-of-line`, /(?<!^)(?<![\r\n\u2028\u2029]|^)/gsu);

// Lookahead assertion: (?=...), (?!...)

// Upgraded unicode

eq(cre.unicode`[\w--_]`, /[\w--_]/gmsv);

// Interpolation, mismatching flags

except(() => {let abc = cre.ignoreCase`"abc"`; cre`${abc}`; });
except(() => {let abc = cre`"abc"`; cre.ignoreCase`${abc}`; });
except(() => {let abc = cre.legacy`"abc"`; cre`${abc}`; });
except(() => {let abc = cre`"abc"`; cre.legacy`${abc}`; });
except(() => {let abc = cre.ignoreCase.legacy`"abc"`; cre.legacy`${abc}`; });
except(() => {let abc = cre.ignoreCase`"abc"`; cre.ignoreCase.legacy`${abc}`; });

