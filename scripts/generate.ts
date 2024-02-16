/*!
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

import cre from '../src/con-reg-exp';

console.log('\n');


console.log(`const tokenRegExpBase = ${cre.sticky.legacy`
begin-of-text;
repeat whitespace;
{
    begin: [{(];
} or {
    end: [)}];
} or {
    separator: [,;];
} or {
    label: ([a-zA-Z_], repeat [a-zA-Z0-9_]);
    ":";
} or {
    keyword: at-least-1 [a-zA-Z0-9\u2011\\-];
} or {
    literal: {
        _literalQuote: ["'];
        lazy-repeat (("\\", any) or any);
        match<_literalQuote>;
    }
} or {
    "<";
    identifier: lazy-repeat any;
    ">";
} or {
    "[";
    optional complement: "^";
    characterClass: lazy-repeat (("\\", any) or any);
    "]";
} or {
    prefix: ("\`", at-least-3 [A-Z]);
    index: at-least-1 [0-9];
    "}";
} or {
    comment1: ("/*", lazy-repeat any, "*/");
} or {
    comment2: ("//", lazy-repeat any);
    end-of-line;
}
repeat whitespace;
`};\n`);

console.log(`const tokenRegExpVMode = ${cre.sticky.legacy`
begin-of-text;
repeat whitespace;
{
    begin: [{(];
} or {
    end: [)}];
} or {
    separator: [,;];
} or {
    label: ([a-zA-Z_], repeat [a-zA-Z0-9_]);
    ":";
} or {
    keyword: at-least-1 [a-zA-Z0-9\u2011\\-];
} or {
    literal: {
        _literalQuote: ["'];
        lazy-repeat (("\\", any) or any);
        match<_literalQuote>;
    }
} or {
    "<";
    identifier: lazy-repeat any;
    ">";
} or {
    characterClassVMode: "[";
    optional complement: "^";
} or {
    prefix: ("\`", at-least-3 [A-Z]);
    index: at-least-1 [0-9];
    "}";
} or {
    comment1: ("/*", lazy-repeat any, "*/");
} or {
    comment2: ("//", lazy-repeat any);
    end-of-line;
}
repeat whitespace;
`};\n`);


console.log(`const quantifierRegExp = ${cre`
begin-of-text;
optional lazy: ("lazy-" or "non-greedy-");
{
    optional: "optional";
} or {
    repeat: "repeat";
} or {
    optional "repeat-";
    {
        optional "at-";
        (least: "least-") or (most: "most-");
        count: at-least-1 digit;
    } or {
        min: at-least-1 digit;
        optional ("-to-", max: at-least-1 digit);
    }
    optional ("-time", optional "s")
}
end-of-text;
`};\n`);
