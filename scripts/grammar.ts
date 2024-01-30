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
import fs from 'node:fs';

let grammar = {
    "scopeName": "source.cre",
    "patterns": [
        {
            "begin": "(cre)((?:\\.[a-zA-Z]+)*)`",
            "end": "`",
            "beginCaptures": {
                "1": {
                    "name": "string.regexp",
                },
                "2": {
                    "patterns": [
                        {
                            "match": "[a-zA-Z]+",
                            "name": "support.class",
                        }
                    ]
                }
            },
            "patterns": [
                {
                    "match": "\\\\`",
                    "name": "invalid.illegal",
                },
                {
                    "include": "#cre"
                }
            ]
        }
    ],
    "repository": {
        "comment": {
            "patterns": [
                {
                    "begin": "//",
                    "end": "$",
                    "name": "comment.line"
                },
                {
                    "begin": "/\\*",
                    "end": "\\*/",
                    "name": "comment.block"
                }
            ]
        },
        "cre": {
            "patterns": [
                {
                    "include": "#comment"
                },
                {
                    "match": cre`([a-zA-Z_] repeat [a-zA-Z0-9_]) ":"`,
                    "name": "entity.name.function",
                },
                {
                    "match": cre.ignoreCase`
                        word-boundary
                        {
                            optional ("lazy-" or "non-greedy-")
                            {
                                "optional"
                            or
                                optional "repeat-"
                                {
                                    optional "at-"
                                    ("least-" or "most-")
                                    at-least-1 digit
                                or
                                    at-least-1 digit
                                    optional ("-to-" at-least-1 digit)
                                }
                                optional ("-time" optional "s")
                            or
                                "repeat"
                            }
                        or "match"
                        or "group"
                        or "not"
                        or "or"
                        }
                        word-boundary
                        `,
                    "name": "storage.type"
                },
                {
                    "match": cre`["] lazy-repeat ("\\" any or any) ["] `,
                    "name": "string.quoted.double"
                },
                {
                    "match": cre.ignoreCase`
                        word-boundary {
                            ("end" or "start" or "begin") "-of-" ("text" or "line")
                            or "word-bound" optional "ary"
                            or "look" optional "-" ("ahead" or "behind")
                        } word-boundary
                        `,
                    "name": "keyword.control"
                },
                {
                    "match": cre.ignoreCase`
                        word-boundary
                        {
                            "any"
                            or "digit"
                            or "white" optional "-" "space"
                            or "word-char" optional "acter"
                            or "nl"
                            or "new-line"
                            or "lf"
                            or "line-feed"
                            or "cr"
                            or "carriage-return"
                            or "tab" optional "ulation"
                            or "nul" optional "l"
                            or "sp" optional "ace"
                            or "nbsp"
                            or optional "line-" "term" optional "inator"
                            or "prop" optional "erty"
                        }
                        word-boundary
                    or
                        {
                            "\\n"
                            or "\\r"
                            or "\\t"
                            or "\\0"
                        }
                        word-boundary
                    `,
                    "name": "support.class"
                },
                {
                    "match": cre`"[" lazy-repeat ("\\" any or any) "]"`,
                    "name": "string.other"
                },
                {
                    "match": cre`"<" lazy-repeat any ">"`,
                    "name": "entity.name.function",
                },
                {
                    "match": cre`"\${" lazy-repeat any "}"`,
                    "name": "string.regexp",
                }
            ]
        }
    }
};

function processObject(value: any) {
    if (value instanceof Array) {
        for (let i = 0; i < value.length; i++) {
            if (value[i] instanceof RegExp) {
                value[i] = convert(value[i] as RegExp);
            } else if (typeof value[i] === 'object') {
                processObject(value[i]);
            }
        }
    } else {
        for (let i in value) {
            if (value[i] instanceof RegExp) {
                value[i] = convert(value[i] as RegExp);
            } else if (typeof value[i] === 'object') {
                processObject(value[i]);
            }
        }
    }
    return value;
}

function convert(exp: RegExp): string {
    let flags = exp.ignoreCase ? '(?i)' : '';
    return `${flags}${exp.source}`;
}

let res = JSON.stringify(processObject(grammar), null, 4);

console.log(res);
