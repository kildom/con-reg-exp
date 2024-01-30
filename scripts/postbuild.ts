
import fs from 'node:fs';
import path from 'node:path';

const CJS_FILE = './dist/cjs/con-reg-exp.cjs';
const MJS_FILE = './dist/esm/con-reg-exp.mjs';
const FR = 'exports.default = cre';
const TO = 'module.exports  = cre';

for (let dest of [CJS_FILE, MJS_FILE]) {
    let src = dest.replace(path.extname(dest), '.js');
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        fs.rmSync(src);
    }
}

let text = fs.readFileSync(CJS_FILE, 'utf8');
let text2 = text.replace(FR, TO);
if (text2 === text) {
    if (text.indexOf(TO) < 0) throw new Error('Missing "exports.default"');
} else {
    fs.writeFileSync(CJS_FILE, text2);
}
