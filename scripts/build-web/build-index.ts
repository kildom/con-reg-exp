
import * as fs from 'node:fs';

import * as showdown from 'showdown';
import cre from '../../src/con-reg-exp';

import { template } from 'underscore';
import { execFileSync } from 'node:child_process';
import { TextEncoder } from 'node:util';
import { deflateSync } from 'fflate';
import { convertMarkdownText, removeTopLevelTag } from './markdown';
import { TMPL_DIR } from './config';


interface Sources {
    menuText: string,
    title: string,
    subtitlesText: string,
    contentText: string,
};


const dictionaryText = "JSON.stringify(.parse( RegExp(.input(.lastMatch(.lastParen(.leftContext(.rightContext(.compile(.exec(.test(.toString(.replace(.match(.matchAll(;\n                                // `;\n\n    \n\nconsole.log(\n\nconst \n\nlet undefined \n\nvar \n\nif (\n\nfor (\n\nwhile (\n\nswitch (    case of in instanceof new true false do {\n    this. break;\n return    } else {\n        } or {\n        ) {\n        }\n);\n\n`;\n\n';\n\n\";\n\n/* */\n\n// = + - * / || && += -= *= ++;\n --;\n == === !== != >= <= < > ?? & | ~ ^ << >> >>> ... \nimport cre from 'con-reg-exp';\n\nimport cre from \"con-reg-exp\";\n\n = cre`.indices`.global`.ignoreCase`.legacy`.unicode`.sticky`.cache`optional begin-of-text; end-of-text; begin-of-line; end-of-line; word-boundary; repeat at-least-1 at-most-times -to- not new-line; line-feed; carriage-return; tabulation; null; space; any; digit; white-space; whitespace; word-character; line-terminator; prop< property< lookahead look-ahead lookbehind look-behind group \"${}\" '${}' ${ ";
const encoder = new TextEncoder();
const dictionary = encoder.encode(JSON.stringify(dictionaryText));

let templateData = {
    title: '',
    copy: '',
    subtitleList: [] as string[],
    subtitleEnding: '',
    menu: [] as string[],
    samples: [] as {
        title: string,
        regexp: string,
        code: string,
        demoURL: string,
    }[],
    sections: [] as {
        title: string,
        sub: {
            title: string,
            html: string,
        }[],
        simple: boolean,
    }[],
    getHtmlId: getHtmlId,
    removeTopLevelTag: removeTopLevelTag,
};

function getHtmlId(markdownText: string): string {
    let x = convertMarkdownText('#' + markdownText.trim(), false);
    return x.match(cre`"id=\"", id: lazy-repeat any, "\""`)?.groups?.id || '';
}

function readSources(): Sources {

    let indexText = fs.readFileSync('docs/index.md', 'utf8');

    let m = indexText.match(cre`
        menuText: lazy-repeat any;
        begin-of-line, "#";
        at-least-1 whitespace;
        title: repeat (not term);
        subtitlesText: lazy-repeat any;
        contentText: (begin-of-line, "#", repeat any);
    `);

    let sources: Sources = m?.groups as any;
    templateData.title = convertMarkdownText(sources.title, true);
    templateData.copy = convertMarkdownText(sources.contentText.match(cre.cache`
        begin-of-line;
        copy: {
            repeat not term;
            "Copyright";
            repeat not term;
        }`)?.groups?.copy?.trim() || '', true);
    return sources;
}

function processMenu(menuText: string) {
    let all = menuText.matchAll(cre.global.cache`
        begin-of-line;
        repeat whitespace;
        "*";
        at-least-1 whitespace;
        item: repeat not term;
    `);
    for (let item of [...all].map(m => m.groups!.item as string)) {
        templateData.menu.push(convertMarkdownText(item, true));
    }
}

function processSubtitle(subtitlesText: string) {
    let all = subtitlesText.matchAll(cre.global.cache`
        begin-of-line;
        repeat whitespace;
        "*";
        at-least-1 whitespace;
        subtitle: repeat not term;
    `);
    let list = [...all].map(m => m.groups!.subtitle as string);
    let ending = list[0];
    for (let text of list) {
        while (!text?.endsWith(ending)) {
            ending = ending.substring(1)
        }
    }
    list = list.map(text => text.substring(0, text.length - ending.length));
    templateData.subtitleList = list;
    templateData.subtitleEnding = ending;
}

function parseSections(text: string, level: number): { title: string, content: string }[] {
    let all = text.matchAll(cre.global.cache`
        begin-of-line, ${level} "#";
        at-least-1 whitespace;
        title: repeat not term;
        content: lazy-repeat any;
        end-of-text or lookahead {
            begin-of-line;
            ${`1-to-${level}`} "#";
            at-least-1 whitespace;
        }
    `);
    return [...all].map(m => ({ title: m.groups!.title, content: m.groups!.content }));
}

function processSections(contentText: string) {
    let list = parseSections(contentText, 2);
    for (let sec of list) {
        let subList = parseSections(sec.content, 3);
        let sub = subList.map(subSection => ({
            title: convertMarkdownText(subSection.title, true),
            html: convertMarkdownText(subSection.content, false),
        }));
        let simple = !sub.some(x => x.html.indexOf('<pre') >= 0)
        templateData.sections.push({
            title: convertMarkdownText(sec.title, true),
            simple,
            sub,
        })
    }
}

function createDemoURL(fileName: string, code: string): string {
    let textData = fileName + '\0' + code;
    let data = encoder.encode(textData);
    let output = deflateSync(data, { level: 9, dictionary, mem: 9 });
    let url = 'https://kildom.github.io/cre-web-demo/#1' + Buffer.from(output).toString('base64');
    return url;
}

function markdownHighlight(code: string, language: string) {
    return convertMarkdownText('```' + language + '\n' + code.trimEnd() + '\n```', true);
}

function processSamples() {
    for (let file of fs.readdirSync('docs/samples').sort()) {
        if (!file.endsWith('.mjs')) continue;
        let sourceCode = fs.readFileSync(`docs/samples/${file}`, 'utf-8');
        let pattern = cre`
            begin-of-text;
            lazy-repeat any;
            begin-of-line, "//", title: repeat not term;
            lazy-repeat any;
            begin-of-line, "// Convenient Regular Expression";
            code: lazy-repeat any;
            begin-of-line, "// Usage";
        `;
        let m = sourceCode.match(pattern);
        let title = m?.groups?.title?.trim() || '';
        let code = m?.groups?.code?.trim() || '';
        let out = execFileSync(process.execPath, [`docs/samples/${file}`], { encoding: 'utf8' });
        m = out.match(cre`begin-of-line, "Compiled:", regexp: repeat not term`);
        let regexp = m?.groups?.regexp?.trim() || '';
        let maxLineLength = code.split('\n').reduce((max, x) => Math.max(max, x.length), 50);
        let regexpLines = Math.ceil(regexp.length / maxLineLength);
        let regexpLineLength = maxLineLength;
        while (regexp.length % regexpLineLength <= 2 * regexpLines) {
            regexpLineLength++;
        }
        let regexpSplitted: string[] = [];
        while (regexp.length > 0) {
            regexpSplitted.push(regexp.substring(0, regexpLineLength));
            regexp = regexp.substring(regexpLineLength);
        }
        templateData.samples.push({
            title: markdownHighlight('// ' + title, 'javascript'),
            code: markdownHighlight(code, 'javascriptwithcre'),
            regexp: markdownHighlight(regexpSplitted.join('↩'), 'javascript').replace(/↩/g, '↩\n'),
            demoURL: createDemoURL(file.replace(cre`begin-of-text, repeat digit, "."`, ''), sourceCode),
        });
    }
}

export function buildIndex() {
    let sources = readSources();
    processMenu(sources.menuText);
    processSubtitle(sources.subtitlesText);
    processSections(sources.contentText);
    processSamples();

    let templateText = fs.readFileSync(`${TMPL_DIR}/index.tmpl.html`, 'utf-8');
    let compiled = template(templateText);
    let output = compiled(templateData);
    fs.mkdirSync('web', { recursive: true });
    fs.writeFileSync('web/index.html', output);
}
