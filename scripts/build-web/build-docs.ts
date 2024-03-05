
import * as fs from 'node:fs';

import { template } from 'underscore';
import cre from '../../src/con-reg-exp';
import { DOCS_DIR, TMPL_DIR, WEB_DIR } from './config';
import { convertMarkdownFile } from './markdown';

export function buildDocs() {

    let markdownFiles: string[] = [];

    markdownFiles = fs.readdirSync(DOCS_DIR)
        .filter(name => name.endsWith('.md'))
        .filter(name => !name.startsWith('_'))
        .filter(name => name !== 'index.md');

    let templateText = fs.readFileSync(`${TMPL_DIR}/docs.tmpl.html`, 'utf-8');
    let compiled = template(templateText);

    interface TocEntry {
        level: number;
        id: string;
        title: string;
        children: TocEntry[];
    }

    for (let file of markdownFiles) {
        let html = convertMarkdownFile(file, false);
        let menu = convertMarkdownFile('_menu.md', false);
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
        fs.writeFileSync(`${WEB_DIR}/${file.replace('.md', '')}.html`, html);
    }
}
