
import * as fs from 'node:fs';

import * as showdown from 'showdown';
import cre from '../src/con-reg-exp';

import { template } from 'underscore';
import { execFileSync } from 'node:child_process';

const copyFiles = {
    'docs/tmpl/index.js': 'web/index.js',
    'docs/tmpl/index.css': 'web/index.css',
    'docs/tmpl/npm.svg': 'web/npm.svg',
    'docs/tmpl/github-mark.svg': 'web/github-mark.svg',
    'docs/tmpl/docs.css': 'web/docs.css',
    'dist/browser/con-reg-exp.min.js': 'web/con-reg-exp.min.js',
};

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
};

function markdown(markdown: string, simple: boolean): string {
    let mdConverter = new showdown.Converter({
        /*extensions: [
            showdownHighlight({
                pre: true,
                auto_detection: true,
            }),
            'gitHubAlerts',
        ],*/
        ghCompatibleHeaderId: true,
        //openLinksInNewWindow: true,
        //prefixHeaderId: `...`,
        simplifiedAutoLink: true,
        tables: true,
        ghCodeBlocks: true,
    });
    let html = mdConverter.makeHtml(markdown);
    if (simple) {
        html = html.replace(cre.global.ignoreCase`
            begin-of-text;
            "<", tag: repeat [a-z], lazy-repeat any, ">";
            group repeat any;
            "</", match<tag>, ">", end-of-text;
            `, '$2');
    }
    return html;
}

function getHtmlId(markdownText: string): string {
    let x = markdown('#' + markdownText.trim(), false);
    return x.match(cre`"id=\"", id: lazy-repeat any, "\""`)?.groups?.id || '';
}

let indexText = fs.readFileSync('docs/index.md', 'utf8');

let m = indexText.match(cre`
    menuText: lazy-repeat any;
    begin-of-line, "#";
    at-least-1 whitespace;
    title: repeat (not term);
    subtitlesText: lazy-repeat any;
    contentText: (begin-of-line, "#", repeat any);
`);

let { menuText, title, subtitlesText, contentText } = m?.groups as { [key: string]: string; };
templateData.title = markdown(title, true);
templateData.copy = markdown(contentText.match(cre.cache`
    begin-of-line;
    copy: {
        repeat not term;
        "Copyright";
        repeat not term;
    }`)?.groups?.copy?.trim() || '', true);

function processMenu(menuText: string) {
    let all = menuText.matchAll(cre.global.cache`
        begin-of-line;
        repeat whitespace;
        "*";
        at-least-1 whitespace;
        item: repeat not term;
    `);
    for (let item of [...all].map(m => m.groups!.item as string)) {
        templateData.menu.push(markdown(item, true));
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
            title: markdown(subSection.title, true),
            html: markdown(subSection.content, false),
        }));
        let simple = !sub.some(x => x.html.indexOf('<pre') >= 0)
        templateData.sections.push({
            title: markdown(sec.title, true),
            simple,
            sub,
        })
    }
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
            title,
            code,
            regexp: regexpSplitted.join('↩\n'),
        });
    }
}

async function main() {
    processMenu(menuText);
    processSubtitle(subtitlesText);
    processSections(contentText);
    processSamples();

    //console.log(require('util').inspect(templateData, false, null, true))

    let templateText = fs.readFileSync(`docs/tmpl/index.tmpl.html`, 'utf-8');
    let compiled = template(templateText);
    let output = compiled(templateData);
    fs.mkdirSync('web', { recursive: true });
    fs.writeFileSync('web/index.html', output);
    for (let [from, to] of Object.entries(copyFiles)) {
        fs.copyFileSync(from, to);
    }
}

main();
