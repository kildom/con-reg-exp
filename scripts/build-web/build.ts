
import * as fs from 'node:fs';
import { buildDocs } from "./build-docs";
import { COPY_FILES, WEB_DIR } from "./config";
import { registerExtensions } from "./markdown";
import { buildIndex } from './build-index';


async function main() {
    fs.mkdirSync(WEB_DIR, { recursive: true });
    for (let [from, to] of Object.entries(COPY_FILES)) {
        fs.copyFileSync(from, to);
    }
    registerExtensions();
    buildDocs();
    buildIndex();
}

main();
