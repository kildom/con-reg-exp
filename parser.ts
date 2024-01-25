import { TextToken, Token, TokenType, randPrefixForText, tokenize } from "./tokenizer";

interface Flags {
    multiline: boolean;
    indices: boolean;
    global: boolean;
    ignoreCase: boolean;
    unicode: boolean;
    sticky: boolean;
}

const flagsDefaults: Flags = {
    multiline: true,
    indices: false,
    global: true,
    ignoreCase: false,
    unicode: false,
    sticky: false,
};

const verboseRegExpTokens = Symbol('verboseRegExpTokens');

function escapeRegExp(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeCharacterClass(text: string) {
    return text.replace(/[\\\]^-]/g, '\\$&');
}

class Context {
    private index: number;
    public flags: Flags = { ...flagsDefaults };

    public constructor(
        private tokens: Token[]
    ) {
        this.index = 0;
    }

    public read(): Token | undefined {
        return this.tokens[this.index++];
    }

    public peek(): Token | undefined {
        return this.tokens[this.index];
    }
}

abstract class Expression {
    public constructor(
        public position: number[]
    ) { }
    public generateAtom(): string {
        return `(?:${this.generate()})`;
    }
    public generate(): string {
        return this.generateAtom();
    }
}

class List extends Expression {
    public items: Expression[];

    public constructor(items: number[] | Expression[]) {
        super(items[0] instanceof Expression ? items[0].position : items as number[]);
        this.items = items[0] instanceof Expression ? items as Expression[] : [];
        if (this.items.length === 1) {
            throw new Error(`Internal error at: ${this.position}`);
        }
    }

    public generate(): string {
        return this.items.map(item => {
            if (item instanceof OrExpression) {
                return item.generateAtom();
            } else {
                return item.generate();
            }
        }).join('');
    }
}

class OrExpression extends Expression {
    public constructor(
        public items: Expression[]
    ) {
        super(items[0].position);
        if (this.items.length <= 1) {
            throw new Error(`Internal error at: ${this.position}`);
        }
    }
    public generate(): string {
        return this.items.map(item => item.generate()).join('|');
    }
}

class InvertibleExpression extends Expression {
    public constructor(position: number[], public negative: boolean) {
        super(position);
    }
}

class CharacterClassEscape extends InvertibleExpression {
    public escapedText!: string;
    static complementaryValue: { [key: string]: string } = {
        '\\d': '\\D',
        '\\D': '\\d',
        '\\s': '\\S',
        '\\S': '\\s',
        '\\w': '\\W',
        '\\W': '\\w',
    };
    static keywords: { [keyword: string]: string } = {
        'digit': '\\d',
        'white-space': '\\s',
        'whitespace': '\\s',
        'word-character': '\\w',
        'word-char': '\\w',
    };
    static create(token: Token) {
        let obj: CharacterClassEscape | undefined = undefined;
        if (token.type === TokenType.CharacterClass && this.complementaryValue[token.text]) {
            obj = new CharacterClassEscape(token.position, token.complement);
            obj.escapedText = token.text;
        } else if (token.type === TokenType.Keyword && this.keywords[token.text]) {
            obj = new CharacterClassEscape(token.position, false);
            obj.escapedText = this.keywords[token.text];
        }
        return obj;
    }
    public generateAtom(): string {
        if (this.negative) {
            return CharacterClassEscape.complementaryValue[this.escapedText];
        } else {
            return this.escapedText;
        }
    }
};

class CharacterClassSingle extends InvertibleExpression {
    public unescapedText!: string;
    static keywords: { [keyword: string]: string } = {
        '\\n': '\n', 'nl': '\n', 'new-line': '\n', 'lf': '\n', 'line-feed': '\n',
        '\\r': '\r', 'cr': '\r', 'carriage-return': '\r',
        '\\t': '\t', 'tab': '\t', 'tabulation': '\t',
        '\\0': '\0', 'null': '\0', 'nul': '\0',
        'sp': ' ', 'space': ' ',
        'nbsp': '\xA0',
    };
    static create(token: Token) {
        let obj: CharacterClassSingle | undefined = undefined;
        if (token.type === TokenType.Literal && token.text.length === 1) { // TODO: Support unicode surrogate pairs
            obj = new CharacterClassSingle(token.position, false);
            obj.unescapedText = token.text;
        } else if (token.type === TokenType.Keyword && this.keywords[token.text]) {
            obj = new CharacterClassSingle(token.position, false);
            obj.unescapedText = this.keywords[token.text];
        } else if (token.type === TokenType.CharacterClass && token.text.length === 1) {
            obj = new CharacterClassSingle(token.position, token.complement);
            obj.unescapedText = token.text;
        }
        return obj;
    }
    public generateAtom(): string {
        if (this.negative) {
            return `[^${escapeCharacterClass(this.unescapedText)}]`;
        } else {
            return escapeRegExp(this.unescapedText);
        }
    }
};

class CharacterClassAny extends Expression {
    static create(token: Token) {
        let obj: CharacterClassAny | undefined = undefined;
        if (token.type === TokenType.Keyword && token.text === 'any') {
            obj = new CharacterClassAny(token.position);
        }
        return obj;
    }
    public generateAtom(): string {
        return '.';
    }
};

class CharacterClassRange extends InvertibleExpression {
    public escapedText!: string;
    static keywords: { [keyword: string]: string } = {
        'line-terminator': '\\r\\n\\u2028\\u2029', 'line-term': '\\r\\n\\u2028\\u2029',
        'terminator': '\\r\\n\\u2028\\u2029', 'term': '\\r\\n\\u2028\\u2029',
    };
    static create(token: Token) {
        let obj: CharacterClassRange | undefined = undefined;
        if (token.type === TokenType.CharacterClass) {
            obj = new CharacterClassRange(token.position, token.complement);
            obj.escapedText = token.text;
        } else if (token.type === TokenType.Keyword && this.keywords[token.text]) {
            obj = new CharacterClassRange(token.position, false);
            obj.escapedText = this.keywords[token.text];
        }
        return obj;
    }
    public generateAtom(): string {
        return `[${this.negative ? '^' : ''}${this.escapedText}]`;
    }
};

class Literal extends Expression {
    public unescapedText!: string;
    static create(token: Token) {
        let obj: Literal | undefined = undefined;
        if (token.type === TokenType.Literal) {
            obj = new Literal(token.position);
            obj.unescapedText = token.text;
        }
        return obj;
    }
    public generate(): string {
        return escapeRegExp(this.unescapedText);
    }
};

class Backreference extends Expression {
    public text!: string;
    static create(token: Token, ctx: Context) {
        let obj: Backreference | undefined = undefined;
        if (token.type === TokenType.Keyword && token.text === 'match') {
            obj = new Backreference(token.position);
            let id = ctx.read();
            if (id?.type !== TokenType.Identifier) {
                throw new Error('Expecting identifier after "match" at: ' + token.position);
            }
            if (id.text.trim().match(/[1-9][0-9]*/)) {
                obj.text = `\\${id.text.trim()}`;
            } else {
                obj.text = `\\k<${id.text}>`;
            }
        }
        return obj;
    }
    public generateAtom(): string {
        return this.text;
    }
};

class WordBoundary extends InvertibleExpression {
    static create(token: Token) {
        let obj: WordBoundary | undefined = undefined;
        if (token.type === TokenType.Keyword && (token.text === 'word-boundary' || token.text === 'word-bound')) {
            obj = new WordBoundary(token.position, false);
        }
        return obj;
    }
    public generateAtom(): string {
        return this.negative ? '\\B' : '\\b';
    }
};

class LineBoundary extends InvertibleExpression {
    public start!: boolean;
    public flags!: Flags;
    static create(token: Token, ctx: Context) {
        let obj: LineBoundary | undefined = undefined;
        if (token.type === TokenType.Keyword && (token.text === 'begin-of-line'
            || token.text === 'start-of-line' || token.text === 'end-of-line')
        ) {
            obj = new LineBoundary(token.position, false);
            obj.start = (token.text !== 'end-of-line');
            obj.flags = ctx.flags;
        }
        return obj;
    }
    public generateAtom(): string {
        if (this.flags.multiline) {
            return this.start
                ? (this.negative ? '(?<!^)' : '^')
                : (this.negative ? '(?!$)' : '$');
        } else {
            return this.start
                ? (this.negative ? '(?<![\\r\\n\\u2028\\u2029]|^)' : '(?<=[\\r\\n\\u2028\\u2029]|^)')
                : (this.negative ? '(?![\\r\\n\\u2028\\u2029]|$)' : '(?=[\\r\\n\\u2028\\u2029]|$)');
        }
    }
};

class TextBoundary extends InvertibleExpression {
    public start!: boolean;
    public negative!: boolean;
    static create(token: Token, ctx: Context) {
        let obj: TextBoundary | undefined = undefined;
        if (token.type === TokenType.Keyword && (token.text === 'begin-of-text'
            || token.text === 'start-of-text' || token.text === 'end-of-text')
        ) {
            obj = new TextBoundary(token.position, false);
            obj.start = (token.text !== 'end-of-text');
            ctx.flags.multiline = false;
        }
        return obj;
    }
    public generateAtom(): string {
        return this.start
            ? (this.negative ? '(?<!^)' : '^')
            : (this.negative ? '(?!$)' : '$');
    }
};

class Group extends Expression {
    public id!: string | undefined;
    public child!: Expression;
    static create(token: Token, ctx: Context) {
        let obj: Group | undefined = undefined;
        if (token.type === TokenType.Keyword && token.text === 'group') {
            obj = new Group(token.position);
            let idToken = ctx.peek() as TextToken | undefined;
            if (idToken?.type !== TokenType.Identifier) {
                obj.id = undefined;
            } else {
                obj.id = idToken.text;
                ctx.read();
            }
            obj.child = parseLeaf(ctx);
        }
        return obj;
    }
    public generateAtom(): string {
        if (!this.id) {
            return `(${this.child.generate()})`;
        } else {
            return `(?<${this.id}>${this.child.generate()})`;
        }
    }
};

class LookGroup extends Expression {
    public ahead!: boolean;
    public negative!: boolean;
    public child!: Expression;
    static create(token: Token, ctx: Context) {
        let obj: LookGroup | undefined = undefined;
        let m: RegExpMatchArray | null;
        if (token.type === TokenType.Keyword && (m = token.text.match(/^look-?(ahead|behind)$/))) {
            obj = new LookGroup(token.position);
            obj.ahead = m[1] === 'ahead';
            obj.negative = false;
            let notToken = ctx.peek();
            if (notToken?.type === TokenType.Keyword && notToken.text === 'not') {
                ctx.read();
                obj.negative = true;
            }
            obj.child = parseLeaf(ctx);
        }
        return obj;
    }
    public generateAtom(): string {
        return `(?${this.ahead ? '' : '<'}${this.negative ? '!' : '='}${this.child.generate()})`;
    }
};

class Quantifier extends Expression {
    public static match = /^(?:(?<lazy>lazy-)?(?:(?:at-)?(?<type>most|least)|repeat)(?:-(?<from>[0-9]+))?(?:-(?<to>[0-9]+))?|(?<optional>optional))/;
    public min: number = 0;
    public max: number = Infinity;
    public lazy: boolean = false;
    public child!: Expression;
    static create(token: Token, ctx: Context) {
        let obj: Quantifier | undefined = undefined;
        let m: RegExpMatchArray | null;
        if (token.type === TokenType.Keyword && (m = token.text.match(Quantifier.match))) {
            obj = new Quantifier(token.position);
            obj.lazy = !!m.groups?.lazy;
            if (m.groups?.optional) {
                obj.min = 0;
                obj.max = 1;
            } else if (!m.groups?.type) {
                if (m.groups?.from === undefined) {
                    // 0 - Inf
                } else if (m.groups?.to === undefined) {
                    obj.min = parseInt(m.groups?.from);
                    obj.max = parseInt(m.groups?.from);
                } else {
                    obj.min = parseInt(m.groups?.from);
                    obj.max = parseInt(m.groups?.to);
                }
            } else {
                if (m.groups?.from === undefined || m.groups?.to !== undefined) {
                    throw Error(`Exactly one number allowed at: ${token.position}`);
                }
                if (m.groups?.type === 'most') {
                    obj.max = parseInt(m.groups?.from);
                } else {
                    obj.min = parseInt(m.groups?.from);
                }
            }
            obj.child = parseLeaf(ctx);
        }
        return obj;
    }
    public generate(): string {
        let result = this.child.generateAtom();
        if (this.max === Infinity) {
            if (this.min === 0) {
                result += '*';
            } else if (this.min === 1) {
                result += '+';
            } else {
                result += `{${this.min},}`;
            }
        } else if (this.min === this.max) {
            result += `{${this.min}}`;
        } else if (this.min === 0 && this.max === 1) {
            result += '?';
        } else {
            result += `{${this.min},${this.max}}`;
        }
        if (this.lazy) {
            result += '?';
        }
        return result;
    }
}

function parseOr(ctx: Context): Expression {
    let a = parseList(ctx);
    let next = ctx.peek();
    if (next?.type !== TokenType.Keyword || next.text.toLowerCase() !== 'or') {
        return a;
    }
    ctx.read();
    let b = parseOr(ctx);
    if (a instanceof OrExpression) {
        if (b instanceof OrExpression) {
            a.items.push(...b.items);
        } else {
            a.items.push(b);
        }
        return a;
    } else if (b instanceof OrExpression) {
        b.items.unshift(a);
        return b;
    } else {
        return new OrExpression([a, b]);
    }
}

function parseList(ctx: Context): Expression {
    let items: Expression[] = [];
    do {
        let next = ctx.peek();
        if (next && next.type !== TokenType.End && (next?.type !== TokenType.Keyword || next.text.toLowerCase() !== 'or')) {
            items.push(parseLeaf(ctx));
        } else {
            break;
        }
    } while (true);
    if (items.length === 0) {
        return new List(ctx.peek()?.position || [0]);
    } else if (items.length === 1) {
        return items[0];
    } else {
        return new List(items);
    }
}

function parseLeaf(ctx: Context): Expression {
    let token = ctx.read();
    switch (token?.type) {
        case TokenType.Begin: {
            let a = parseOr(ctx);
            let end = ctx.read();
            if (end?.type !== TokenType.End) {
                throw new Error('Unterminated bracket at: ' + token.position);
            }
            return a;
        }
        case undefined:
            throw new Error('Unexpected end of string.');
        case TokenType.End:
        case TokenType.Identifier:
            throw new Error('Unexpected token at: ' + (token?.position || 0));
        case TokenType.CharacterClass:
        case TokenType.Keyword:
        case TokenType.Literal:
            break;
    }

    let exp: Expression | undefined;

    if (token.type === TokenType.Keyword && token.text === 'not') {
        exp = parseLeaf(ctx);
        if (exp instanceof InvertibleExpression) {
            exp.negative = !exp.negative;
        } else {
            throw new Error(`The "not" keyword is not allowed before this expression at: ${token.position}`);
        }
    } else if (token.type === TokenType.Keyword && token.text === '__sub__') {
        let subFlags = getFlags(ctx);
        if (ctx.flags.ignoreCase !== subFlags.ignoreCase) {
            throw new Error('Mismatching "ignore-case" flag in sub-expression.');
        } else if (ctx.flags.unicode !== subFlags.unicode) {
            throw new Error('Mismatching "unicode" flag in sub-expression.');
        }
        exp = parseLeaf(ctx);
    } else {
        exp = CharacterClassEscape.create(token)
            || CharacterClassSingle.create(token)
            || CharacterClassAny.create(token)
            || CharacterClassRange.create(token)
            || Literal.create(token)
            || Backreference.create(token, ctx)
            || WordBoundary.create(token)
            || LineBoundary.create(token, ctx)
            || TextBoundary.create(token, ctx)
            || Group.create(token, ctx)
            || LookGroup.create(token, ctx)
            || Quantifier.create(token, ctx)
            ;
    }

    if (!exp) {
        throw new Error(`Unknown keyword "${token.text}" at: ${token.position}`);
    }
    return exp;
}

function getFlags(ctx: Context) {
    let flags = { ...flagsDefaults };
    while (ctx.peek()?.type === TokenType.Identifier) {
        let flagToken = ctx.read() as TextToken;
        let flagItems = flagToken.text.split(/[\s,;]+/);
        for (let flag of flagItems) {
            switch (flag.toLowerCase()) {
                case '':
                    // ignore
                    break;
                case 'indices':
                    flags.indices = true;
                    break;
                case 'first':
                    flags.global = false;
                    break;
                case 'ignore-case':
                case 'case-insensitive':
                    flags.ignoreCase = true;
                    break;
                case 'unicode':
                    flags.unicode = true;
                    break;
                case 'sticky':
                    flags.sticky = true;
                    break;
                default:
                    throw new Error(`Unknown flag "${flag}" at: ${flagToken.position}`);
            }
        }
    }
    return flags;
}

export function parse(text: string, prefix: string, values: (string | Token[])[]): RegExp {

    let tokens = tokenize(text, prefix, values);
    //console.log(tokens); return new RegExp('');
    let ctx = new Context(tokens);
    ctx.flags = getFlags(ctx);

    let expr = parseOr(ctx);
    let pattern = expr.generate();
    let flags = 's';
    if (ctx.flags.indices) flags += 'd';
    if (ctx.flags.global) flags += 'g';
    if (ctx.flags.ignoreCase) flags += 'i';
    if (ctx.flags.multiline) flags += 'm';
    if (ctx.flags.unicode) flags += 'u';
    // TODO: implement v flag: if (ctx.flags.unicodeSets) flags += 'v';
    if (ctx.flags.sticky) flags += 'y';

    let result = new RegExp(pattern, flags);
    Object.defineProperty(result, verboseRegExpTokens, {
        configurable: false,
        enumerable: false,
        value: tokens,
        writable: false,
    });
    return result;
}

//const inputString = Symbol('verboseRegExpInputString');

export function verboseRegExp(str: TemplateStringsArray, ...values: any[]) {
    let raw = str.raw;
    let prefix = randPrefixForText(raw);
    let input = raw[0];
    let valuesProcessed: (string | Token[])[] = [];
    for (let i = 0; i < values.length; i++) {
        let value = values[i];
        input += prefix + i + '}' + raw[i + 1];
        if (value instanceof RegExp && value[verboseRegExpTokens]) {
            valuesProcessed.push(value[verboseRegExpTokens] as Token[]);
        } else {
            valuesProcessed.push(`${values[i]}`);
        }
    }
    return parse(input, prefix, valuesProcessed);
}

export function vre(str: TemplateStringsArray, ...values: any[]) {
    return verboseRegExp(str, ...values);
}

let a = "Thi\"\\`\`s$ is [test]";
let b = "not [x-y]";

/*console.log(verboseRegExp`
<FIRST, IGNORE-CASE, STICKY>

repeat whitespace // ignore leading whitespace

{
    // Opening bracket
    group<begin> [{(]
or
    // Closing bracket
    group<end> [)}]
or
    // Keyword
    group<keyword> at-least-1 [a-z0-9\\-]
or
    // Literal string 
    group<literal> {
        ["]
        lazy-repeat ("\\" any or any)
        ["]
    } 
or
    // Identifier (group name, flags)
    {
        "<"
        group<identifier>(lazy-repeat(any))
        ">"
    }
or
    // Character class
    {
        "["
        optional group<complement> "^"
        group<characterClass> lazy-repeat ("\\" any or any)
        "]"
    }
or
    // Magic string for filling it with content
    {
        group<prefix> ("\`" at-least-1([A-Z]))
        group<index> at-least-1([0-9])
        "}"
    }
or
    // Multiline comment
    group<comment1> {
        "/*" lazy-repeat any "* /"
    }
or
    // Singleline comment
    group<comment2> {
        "//" lazy-repeat(any) end-of-line
    }
}

repeat whitespace // ignore trailing whitespace
`);*/

let ic = '<IGNORE-CASE> any';

let sub = vre`<IGNORE-CASE> "a" "b" "c" ${ic}`;

console.log(vre`<IGNORE-CASE> "x" "y" ${sub} "z" "w"`);
