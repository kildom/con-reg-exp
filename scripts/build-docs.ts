
import * as fs from 'node:fs';

import * as showdown from 'showdown';
import { template } from 'underscore';
const showdownHighlight = require('showdown-highlight');
const hljs = require('highlight.js');
import cre from '../src/con-reg-exp';

hljs.registerLanguage('cre', (hljs) => {
    return {
        name: 'cre',
        aliases: [],
        case_insensitive: false,
        keywords: {
            $pattern: /[a-zA-Z0-9\\-]+/,
            keyword: ['or', "match", "group", "not"],
            literal: [
                "any", "digit", "white-space", "whitespace", "word-char", "word-character",
                "nl", "new-line", "lf", "line-feed", "cr", "carriage-return", "tab", "tabulation",
                "nul", "null", "sp", "space", "nbsp", "term", "terminator", "line-term", "line-terminator",
                "prop", "property",
            ],
        },
        contains: [
            hljs.COMMENT(/\/\*/, /\*\//),
            hljs.COMMENT(/\/\//, /$/),
            {
                scope: 'literal',
                begin: cre.ignoreCase`"\\", [rnt0]`,
            },
            {
                scope: 'keyword',
                begin: cre.ignoreCase`
                    optional ("lazy-" or "non-greedy-");
                    {
                        "optional";
                    } or {
                        optional "repeat-";
                        {
                            optional "at-";
                            "least-" or "most-";
                            at-least-1 digit;
                        } or {
                            at-least-1 digit;
                            optional ("-to-", at-least-1 digit);
                        }
                        optional ("-time", optional "s");
                    } or {
                        "repeat";
                    }`,
            },
            {
                scope: 'name',
                begin: cre`[a-zA-Z_], repeat [a-zA-Z0-9_], ":"`,
            },
            {
                scope: 'string',
                begin: /"/,
                end: /"/,
                contains: [
                    { begin: cre`"\\", any` },
                    { scope: 'subst', begin: /\${/, end: /}/ },
                ],
            },
            {
                scope: 'string',
                begin: /'/,
                end: /'/,
                contains: [
                    { begin: cre`"\\", any` },
                    { scope: 'subst', begin: /\${/, end: /}/ },
                ],
            },
            {
                scope: 'text',
                begin: /</,
                end: />/,
            },
            {
                scope: 'regexp',
                begin: /\[/,
                end: /\]/,
                contains: [
                    { begin: cre`"\\", any` },
                    { scope: 'subst', begin: /\${/, end: /}/ },
                ],
            },
            {
                scope: 'subst',
                begin: /\${/,
                end: /}/,
            },
            {
                scope: 'type',
                begin: cre.ignoreCase`
                    {
                        "end" or "start" or "begin", "-of-", "text" or "line";
                    } or {
                        "word-bound", optional "ary";
                    } or {
                        "look", optional "-", "ahead" or "behind";
                    }
                    `,
            }
        ]
    }
});
let js = hljs.getLanguage('javascript').rawDefinition();

let jscre = {
    ...js,
    aliases: [],
    name: 'javascriptwithcre',
    contains: [
        {
            begin: /cre(?:\.[a-zA-Z0-9_.]+)?`/,
            end: /\B|\b/,
            starts: {
                begin: /\B|\b/,
                end: '`',
                terminatorEnd: "`",
                subLanguage: "cre",
            },
        },
        {
            scope: 'regexp',
            begin: cre`"/", lookahead not "/"`,
            end: /\/[gimuvsy]*/,
            contains: [
                { begin: cre`"\\", any` },
                {
                    begin: /\[/,
                    end: /\]/,
                    contains: [
                        { begin: cre`"\\", any` },
                    ],
                },
            ],
        },
        ...js.contains,
    ],
}
hljs.registerLanguage('javascriptwithcre', () => jscre);

showdown.extension('gitHubAlerts', function () {
    let myext1 = {
        type: 'lang',
        regex: /(?<!(?:^|\n)\s*>[^\n]*\r?\n)(?<=^|\n)(?<prefix>[ \t]*>)(?<type>[ \t]*\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*)(?<text>(?:\r?\n\k<prefix>.*?(?=\r?\n|$))+)/gsi,
        replace: (m0, prefix, type, text) => {
            let className = type.replace(/[^a-z]+/gi, '').toLowerCase();
            let title = className.substring(0, 1).toUpperCase() + className.substring(1);
            let res = `${prefix}<div class="--gitHubAlert-begin-${className}">${title}</div>${text}\n`
                + `${prefix}<div class="--gitHubAlert-end"></div>\n`;
            return res;
        }
    };
    let myext2 = {
        type: 'output',
        regex: /<div class="--gitHubAlert-begin-(\w+)">(.*?)<\/div>/g,
        replace: '<div class="gitHubAlert-$1"><div class="gitHubAlert-title">$2</div><div class="gitHubAlert-text">'
    };
    let myext3 = {
        type: 'output',
        regex: /<div class="--gitHubAlert-end"><\/div>/g,
        replace: '</div></div>'
    };
    return [myext1, myext2, myext3];
});

showdown.extension('tryItLink', function () {
    let myext1 = {
        type: 'output',
        regex: cre.global.ignoreCase`
            "<p";
            optional {
                whitespace;
                lazy-repeat any;
            }
            ">"
            repeat whitespace;
            link: {
                "<a";
                whitespace;
                lazy-repeat any;
            }
            ">try it</a>"
            repeat whitespace;
            "</p>"
        `,
        replace: '$1 class="try-it-link" target="cre-web-demo">try it</a>',
    };
    return [myext1];
});


let docsDir = 'docs';
let webDir = 'web';
let markdownFiles: string[] = [];

markdownFiles = fs.readdirSync(docsDir)
    .filter(name => name.endsWith('.md'))
    .filter(name => !name.startsWith('_'))
    .filter(name => name !== 'index.md');

let templateText = fs.readFileSync('docs/tmpl/docs.tmpl.html', 'utf-8');
let compiled = template(templateText);

interface TocEntry {
    level: number;
    id: string;
    title: string;
    children: TocEntry[];
}

fs.mkdirSync(webDir, { recursive: true });

for (let file of markdownFiles) {
    let html = convertMarkdown(file);
    let menu = convertMarkdown('_menu.md');
    let all = html.matchAll(cre.global.cache`
        "<h", level: digit;
        lazy-repeat any;
        "id=", ["], id: lazy-repeat any, ["];
        lazy-repeat any;
        ">";
        title: lazy-repeat any;
        "</h", match<level>;
    `);
    let toc: TocEntry[] = [];
    let tocStack: TocEntry[][] = [toc];
    for (let m of all) {
        let level = parseInt(m.groups?.level || '0');
        while (level < tocStack.length) {
            tocStack.pop();
        }
        let children: TocEntry[] = [];
        tocStack.at(-1)?.push({ ...m.groups as unknown as TocEntry, level: level, children });
        tocStack.push(children);
    }
    html = compiled({ html, toc, menu });
    fs.writeFileSync(`${webDir}/${file.replace('.md', '')}.html`, html);
}

function convertMarkdown(fileName: string): string {
    let markdown = fs.readFileSync(`${docsDir}/${fileName}`, 'utf-8');
    let mdConverter = new showdown.Converter({
        extensions: [
            showdownHighlight({
                pre: true,
                auto_detection: true,
            }),
            'gitHubAlerts',
            'tryItLink',
        ],
        ghCompatibleHeaderId: true,
        simplifiedAutoLink: true,
        tables: true,
    });
    let html = mdConverter.makeHtml(markdown);
    html = html
        .replace(/&amp;nbsp;/g, ' ')
        .replace(cre.global`".md", lookahead ["#]`, '.html');
    return html;
}
