
import cre from './con-reg-exp';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as acorn from 'acorn';

const ws = cre`
    at-least-1 [ \t]; // whitespace
`;

const ows = cre`
    repeat [ \t]; // optional whitespace
`;

const crePattern = cre`
    ${ows};
    "cre";
    lookahead not {
        ${ows};
        ".";
        ${ows};
        "import";
        ${ws};
    }
    Flags: repeat {
        ${ows};
        ".";
        ${ows};
        at-least-1 [a-zA-Z];
    }
    ${ows};
    "\`";
    Text: lazy-repeat any;
    optional "\`";
    ${ows};
`;

const expressionPattern = cre.global.indices`
    prefix<sl> {
        "//";
        ${crePattern};
        end-of-line;
    } or prefix<ml> {
        "/*";
        ${crePattern};
        "*/";
    }
    space: repeat {
        [\r\n\t ]
        or {
            "/*";
            lazy-repeat any;
            "*/";
        } or {
            "//";
            lazy-repeat any;
            optional \r;
            \n;
        }
    }
    code: lazy-repeat any;
    end-of-line;
`;

interface ExpressionGroups {
    slFlags?: string;
    slText?: string;
    mlFlags?: string;
    mlText?: string;
    space: string;
    code: string;
}

type ExpressionIndices = { [key in keyof ExpressionGroups]: [number, number] | undefined };

const definitionPatternInner = cre`
    ${ows};
    Identifier: at-least-1 [a-zA-Z0-9_$.];
    ${ows};
    "=";
    ${crePattern};
`;

const definitionPattern = cre.global.indices`
    prefix<sl> {
        "//";
        ${definitionPatternInner};
        end-of-line;
    } or prefix<ml> {
        "/*";
        ${definitionPatternInner};
        "*/";
    }
`;

interface DefinitionGroups {
    slIdentifier?: string;
    slFlags?: string;
    slText?: string;
    mlIdentifier?: string;
    mlFlags?: string;
    mlText?: string;
}

type DefinitionIndices = { [key in keyof DefinitionGroups]: [number, number] | undefined };

const importPatternInner = cre`
    ${ows};
    "cre";
    ${ows};
    ".";
    Code: {
        ${ows};
        "import";
        ${ws};
        lazy-repeat any;
    }
`;

const importPattern = cre.global.indices`
    prefix<sl> {
        "//";
        ${importPatternInner};
        end-of-line;
    } or prefix<ml> {
        "/*";
        ${importPatternInner};
        "*/";
    }
`;

interface ImportGroups {
    slCode?: string;
    mlCode?: string;
}

type ImportIndices = { [key in keyof ImportGroups]: [number, number] | undefined };

interface Definition {
    identifier: string;
    flags: string[];
    expression: string;
    start: number;
    end: number;
    expressionStart: number;
}

interface Expression {
    before: string;
    flags: string[];
    expression: string;
    space: string;
    after: string;
    start: number;
    end: number;
    expressionStart: number;
}

interface Import {
    code: string;
    start: number;
    end: number;
}

interface ParsedFile {
    definitions: Definition[];
    expressions: Expression[];
    imports: Import[];
}


function error(...args: any[]): void {
    console.error(...args);
}

function parseExpressions(text: string): Expression[] {
    let expressions: Expression[] = [];
    for (let m of text.matchAll(expressionPattern)) {
        let groups = m.groups as unknown as ExpressionGroups;
        let indices = (m as any).indices.groups as unknown as ExpressionIndices;
        let start: number = (m as any).indices[0][0];
        let end: number = (m as any).indices[0][1];
        if (expressions.length > 0) {
            expressions.at(-1)!.after += text.substring(expressions.at(-1)!.end, start);
        }
        let from = groups.code.indexOf('/');
        let to = groups.code.lastIndexOf('/');
        if (from === to) {
            error(indices.code![0], 'Cannot recognize beginning or ending of the target regular expression.');
            continue;
        }
        let codeBefore = groups.code.substring(0, from);
        let codeAfter = groups.code.substring(to + 1);
        let codeFlags: string = (codeAfter.match(/^[dgimsuvy]*/) as any)[0];
        codeAfter = codeAfter.substring(codeFlags.length);
        expressions.push({
            flags: (groups.mlFlags || groups.slFlags)!.split('.').map(x => x.trim()).filter(x => x),
            before: text.substring((expressions.length == 0) ? 0 : start, indices.code![0]) + codeBefore,
            expression: (groups.mlText || groups.slText) as string,
            space: groups.space,
            after: codeAfter,
            start,
            end,
            expressionStart: (indices.mlText || indices.slText)![0],
        });
    }
    if (expressions.length > 0) {
        expressions.at(-1)!.after += text.substring(expressions.at(-1)!.end);
    }
    return expressions;
}

function parseDefinitions(text: string): Definition[] {
    let definitions: Definition[] = [];
    for (let m of text.matchAll(definitionPattern)) {
        let groups = m.groups as unknown as DefinitionGroups;
        let indices = (m as any).indices.groups as unknown as DefinitionIndices;
        let start: number = (m as any).indices[0][0];
        let end: number = (m as any).indices[0][1];
        definitions.push({
            identifier: (groups.mlIdentifier || groups.slIdentifier) as string,
            flags: (groups.mlFlags || groups.slFlags)!.split('.').map(x => x.trim()).filter(x => x),
            expression: (groups.mlText || groups.slText) as string,
            start,
            end,
            expressionStart: (indices.mlText || indices.slText)![0],
        });
    }
    return definitions;
}

function parseImports(text: string): Import[] {
    let imports: Import[] = [];
    for (let m of text.matchAll(importPattern)) {
        let groups = m.groups as unknown as ImportGroups;
        let start: number = (m as any).indices[0][0];
        let end: number = (m as any).indices[0][1];
        imports.push({
            code: (groups.mlCode || groups.slCode) as string,
            start,
            end,
        });
    }
    return imports;
}

type Dict<T> = { [key: string]: T };

const allowedFlags: Dict<true> = {
    indices: true,
    global: true,
    ignoreCase: true,
    legacy: true,
    unicode: true,
    sticky: true,
};


interface GeneratedTemplateStringsArray extends Array<string> {
    raw: string[];
}

function memberExpressionToString(expression: acorn.MemberExpression): string {
    if (expression.computed || expression.property.type !== 'Identifier') {
        throw new Error('Invalid interpolated value.');
    }
    if (expression.object.type === 'MemberExpression') {
        return memberExpressionToString(expression.object) + '.' + expression.property.name;
    } else if (expression.object.type === 'Identifier') {
        return expression.object.name + '.' + expression.property.name;
    } else {
        throw new Error('Invalid interpolated value.');
    }
}

function compileExpression(namespace: Dict<RegExp>, expression: string, flags: string[], location: number): RegExp {
    let code = '`' + expression + '`';
    let root = acorn.parse(code, {
        ecmaVersion: 2015,
        sourceType: 'module',
    });
    if (root.type !== 'Program' || root.body.length !== 1 || root.body[0].type !== 'ExpressionStatement') {
        throw new Error('Invalid expression.');
    }
    let stmt = root.body[0] as acorn.ExpressionStatement;
    if (stmt.expression.type !== 'TemplateLiteral') {
        throw new Error('Invalid expression.');
    }
    let str = [] as unknown as GeneratedTemplateStringsArray;
    str.raw = [];
    for (let element of stmt.expression.quasis) {
        if (element.type !== 'TemplateElement') {
            throw new Error('Invalid expression.');
        }
        str.push(element.value.cooked as string);
        str.raw.push(element.value.raw);
    }
    let values: RegExp[] = [];
    for (let element of stmt.expression.expressions) {
        let id;
        if (element.type === 'MemberExpression') {
            id = memberExpressionToString(element);
        } else if (element.type === 'Identifier') {
            id = element.name;
        } else {
            throw new Error('Invalid interpolated value.');
        }
        if (!namespace[id]) {
            throw new Error(`Undefined name "${id}".`);
        }
        values.push(namespace[id]);
    }
    let creFunction = cre;
    for (let flag of flags) {
        if (!allowedFlags[flag]) {
            throw new Error(`Invalid flag "${flag}".`);
        }
        creFunction = (creFunction as any)[flag];
    }
    return creFunction(str, ...values);
}

function importToNamespace(importEntry: Import, namespace: Dict<RegExp>, baseFile: string) {
    let root = acorn.parse(importEntry.code, {
        ecmaVersion: 2015,
        sourceType: 'module',
    });
    if (root.type !== 'Program' || root.body.length !== 1 || root.body[0].type !== 'ImportDeclaration') {
        throw new Error('Invalid import statement.');
    }
    let decl = root.body[0] as acorn.ImportDeclaration;
    if (decl.source.type !== 'Literal' || typeof decl.source.value !== 'string') {
        throw new Error('Invalid import statement.');
    }
    let filePathUnresolved = decl.source.value as string;
    let baseDir = path.dirname(baseFile);
    let filePath = path.join(baseDir, filePathUnresolved);
    let module = importFile(filePath);
    for (let spec of decl.specifiers) {
        if (spec.local.type !== 'Identifier') {
            throw new Error('Invalid import statement.');
        }
        let localName = spec.local.name;
        if (spec.type === 'ImportSpecifier') {
            if (spec.imported.type !== 'Identifier') {
                throw new Error('Invalid import statement.');
            }
            let remoteName = spec.imported.name;
            let failed = true;
            if (module[remoteName]) {
                namespace[localName] = module[remoteName];
                failed = false;
            }
            for (let [key, value] of Object.entries(module)) {
                if (key.startsWith(remoteName + '.')) {
                    namespace[localName + key.substring(remoteName.length)] = value;
                    failed = false;
                }
            }
            if (failed) {
                console.log(module);
                throw new Error(`Cannot import ${remoteName}.`);
            }
        } else if (spec.type === 'ImportNamespaceSpecifier') {
            for (let [key, value] of Object.entries(module)) {
                namespace[localName + '.' + key] = value;
            }
        } else if (spec.type === 'ImportDefaultSpecifier') {
            throw new Error('Cannot use default import.');
        } else {
            throw new Error('Invalid import statement.');
        }
    }
}

let importedSet = new Set<string>();

function importFile(fileName: string, text?: string): Dict<RegExp> {
    let realPath = fs.realpathSync(fileName);
    if (importedSet.has(realPath)) {
        error(0, `Circular imports detected on "${fileName}".`);
    }
    importedSet.add(realPath);
    if (text === undefined) {
        text = fs.readFileSync(fileName, 'utf-8');
    }
    let definitions = parseDefinitions(text);
    let imports = parseImports(text);
    let namespace: Dict<RegExp> = Object.create(null);
    for (let importEntry of imports) {
        importToNamespace(importEntry, namespace, fileName);
    }
    for (let def of definitions) {
        if (namespace[def.identifier]) {
            error(def.start, 'Already defined.');
        }
        let re = compileExpression(namespace, def.expression, def.flags, def.expressionStart);
        namespace[def.identifier] = re;
    }
    console.log(fileName, namespace);
    return namespace;
}

function compileFile(fileName: string): string {
    let text = fs.readFileSync(fileName, 'utf-8');
    let namespace = importFile(fileName, text);
    let expressions = parseExpressions(text);
    let output: string[] = [];
    for (let exp of expressions) {
        output.push(exp.before);
        let re = compileExpression(namespace, exp.expression, exp.flags, exp.expressionStart);
        output.push(`${re}`);
        output.push(exp.after);
    }
    return output.join('');
}

let out = compileFile('a.ts');
fs.writeFileSync('a.ts', out);
