
import fs from 'fs';

let data = JSON.parse(fs.readFileSync('package.json', 'utf8'));

process.stdout.write(data.version);
