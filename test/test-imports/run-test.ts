
import * as fs from 'node:fs';
import { spawnSync, SpawnSyncOptions } from 'node:child_process';


function run(command: string, ...args: string[]): void;
function run(command: string, ...args: (SpawnSyncOptions | string)[]): void;
function run(command: string, ...args: (SpawnSyncOptions | string)[]): void {
    let options: SpawnSyncOptions = {};
    if (args.length && typeof args.at(-1) === 'object') {
        options = args.pop() as SpawnSyncOptions;
    }
    let res = args.length
        ? spawnSync(command, args as string[], { stdio: 'inherit', shell: true, ...options })
        : spawnSync(command, { stdio: 'inherit', shell: true, ...options });
    if (res.status != 0) {
        console.error(`Error executing command! Code: ${res.status}`);
        process.exit(res.status || 1);
    }
}

run('npm run build');
run('npm pack');

fs.rmSync('./temp/test-import', { recursive: true, force: true });
fs.mkdirSync('./temp/test-import', { recursive: true });
for (let file of fs.readdirSync('./test/test-imports')) {
    if (file.startsWith('test-')) {
        fs.copyFileSync(`./test/test-imports/${file}`, `./temp/test-import/${file.substring(5)}`);
    }
}
let newestPackage = fs.readdirSync('.')
    .filter(file => file.endsWith('.tgz'))
    .map(file => (file
        .split(/[.-]/)
        .filter(p => parseInt(p).toString() === p)
        .reduce((acc, p) => acc * 1000 + parseInt(p), 0) + 1000000000) + file
    )
    .sort()
    .reverse()
    .slice(0, 1)
    .map(file => file.substring(10))
[0];

fs.cpSync('./node_modules', './temp/test-import/node_modules', { recursive: true });

run('npm', 'install', `../../${newestPackage}`, { cwd: './temp/test-import' });

let scripts = JSON.parse(fs.readFileSync('./temp/test-import/package.json', 'utf8')).scripts;
for (let name of Object.keys(scripts).filter(name => name.startsWith('test'))) {
    run('npm', 'run', name, { cwd: './temp/test-import' });
}
