
// #region Utilities


function randPrefix(length: number): string {
    let result = '`';
    for (let i = 0; i < length; i++) {
        result += String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
    return result;
}


function randPrefixForText(text: readonly string[]): string {
    let prefix = randPrefix(3);
    while (text.some(x => x.indexOf(prefix) >= 0)) {
        prefix = randPrefix(prefix.length + 1);
    }
    return prefix;
}


function escapeRegExp(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


function escapeCharacterClass(text: string) {
    return text.replace(/[\\\]^-]/g, '\\$&');
}


// #endregion


// #region Exceptions


export class VREError extends Error { };


class TokenizerError extends Error {
    constructor(public position: number, message: string) {
        super(message);
    }
}


// #endregion


// #region Tokenizer


interface ExpressionSource {
    sourceCode: string;
    interpolationPrefix: string;
}

interface ExpressionTokenized extends ExpressionSource {
    tokens: Token[];
}

enum TokenType {
    Literal,
    Identifier,
    Keyword,
    CharacterClass,
    Begin,
    End,
    InterpolationBegin,
    InterpolationEnd,
}

interface TextToken {
    type: TokenType.Literal | TokenType.Identifier | TokenType.Keyword;
    position: number;
    text: string;
}

interface CharacterClassToken {
    type: TokenType.CharacterClass;
    position: number;
    text: string;
    complement: boolean;
}

interface EmptyToken {
    type: TokenType.Begin | TokenType.End | TokenType.InterpolationEnd;
    position: number;
}

interface InterpolationBeginToken {
    type: TokenType.InterpolationBegin;
    position: number;
    source: ExpressionSource;
}

type Token = TextToken | CharacterClassToken | EmptyToken | InterpolationBeginToken;

interface TokenRegexGroups {
    begin?: string;
    end?: string;
    keyword?: string;
    literal?: string;
    identifier?: string;
    characterClass?: string;
    complement?: string;
    prefix?: string;
    index?: string;
    comment1?: string;
    comment2?: string;
}


const tokenRegexBase = /\s*(?:(?<begin>[{(])|(?<end>[})])|(?<keyword>[a-z0-9\\-]+)|(?<literal>"(?:\\[\s\S]|[\s\S])*?")|(?:<(?<identifier>[\s\S]*?)>)|(?:\[(?<complement>\^)?(?<characterClass>(?:\\[\s\S]|[\s\S])*?)\])|(?:(?<prefix>`[A-Z]+)(?<index>[0-9]+)\})|(?<comment1>\/\*.*?\*\/)|(?<comment2>\/\/.*?(?:\n|$)))\s*/isy;


function tokenize(text: string, interpolationPrefix: string, values: (string | ExpressionTokenized)[]): Token[] {
    let result: Token[] = [];
    let tokenRegex = new RegExp(tokenRegexBase);
    let groups: TokenRegexGroups | undefined;
    let position = 0;
    let prefixReplace: RegExp | undefined = undefined;
    while ((groups = tokenRegex.exec(text)?.groups)) {
        if (groups.begin !== undefined) {
            result.push({ position, type: TokenType.Begin });
        } else if (groups.end !== undefined) {
            result.push({ position, type: TokenType.End });
        } else if (groups.keyword !== undefined) {
            result.push({ position, type: TokenType.Keyword, text: groups.keyword.toLowerCase() });
        } else if (groups.literal !== undefined) {
            let content = groups.literal;
            if (content.indexOf(interpolationPrefix) >= 0) {
                if (prefixReplace === undefined) {
                    prefixReplace = new RegExp(interpolationPrefix + '([0-9]+)\\}', 'g');
                }
                content = content.replace(prefixReplace, (_, index) => {
                    let value = values[parseInt(index)];
                    if (typeof value !== 'string') {
                        throw new TokenizerError(position, 'Cannot interpolate expression to a string literal.');
                    }
                    let result = JSON.stringify(value);
                    result = result.substring(1, result.length - 1);
                    return result;
                });
            }
            try {
                result.push({ position, type: TokenType.Literal, text: (new Function(`return ${content};`))() });
            } catch (ex) {
                throw new TokenizerError(position, 'Error parsing string literal.');
            }
        } else if (groups.identifier !== undefined) {
            result.push({ position, type: TokenType.Identifier, text: groups.identifier });
        } else if (groups.characterClass !== undefined) {
            let content = groups.characterClass;
            if (content.indexOf(interpolationPrefix) >= 0) {
                if (prefixReplace === undefined) {
                    prefixReplace = new RegExp(interpolationPrefix + '([0-9]+)\\}', 'g');
                }
                content = content.replace(prefixReplace, (_, index) => {
                    let value = values[parseInt(index)];
                    if (typeof value !== 'string') {
                        throw new TokenizerError(position, 'Cannot interpolate expression to a character class.');
                    }
                    return escapeCharacterClass(value);
                });
            }
            result.push({ position, type: TokenType.CharacterClass, text: content, complement: !!groups.complement });
        } else if (groups.prefix === interpolationPrefix) {
            let value = values[parseInt(groups.index as string)];
            if (typeof value === 'string') {
                let innerPrefix = randPrefixForText([value]);
                result.push({
                    position,
                    type: TokenType.InterpolationBegin,
                    source: { sourceCode: value, interpolationPrefix: innerPrefix },
                });
                result = result.concat(tokenize(value, innerPrefix, []));
                result.push({ position, type: TokenType.InterpolationEnd });
            } else {
                result.push({ position, type: TokenType.Begin });
                result.push({ position, type: TokenType.InterpolationBegin, source: value });
                result = result.concat(value.tokens);
                result.push({ position, type: TokenType.InterpolationEnd });
                result.push({ position, type: TokenType.End });
            }
        } else if (groups.comment1 !== undefined || groups.comment2 !== undefined) {
            // skip comments
        } else {
            break;
        }
        position = tokenRegex.lastIndex;
    }
    if (position < text.length) {
        throw new TokenizerError(position, 'Syntax error.');
    }
    return result;
}

// #endregion


// #region Parser Context


interface Flags {
    multiline: boolean;
    indices: boolean;
    global: boolean;
    ignoreCase: boolean;
    unicode: boolean;
    sticky: boolean;
}


class Context {

    public flags: Flags;

    private index: number;
    private interpolationStack: InterpolationBeginToken[] = [];

    public constructor(
        public info: ExpressionTokenized,
    ) {
        this.index = 0;
        this.flags = this.getFlags();
        this.processInterpolation();
    }

    public read(): Token | undefined {
        let result = this.info.tokens[this.index++];
        this.processInterpolation();
        return result;
    }

    public peek(): Token | undefined {
        return this.info.tokens[this.index];
    }

    public error(token: Token | undefined, message: string): Error {
        let stack: InterpolationBeginToken[] = [{
            type: TokenType.InterpolationBegin,
            position: 0,
            source: this.info,
        }];
        for (let iterToken of this.info.tokens) {
            if (iterToken.type === TokenType.InterpolationEnd) {
                stack.pop();
            }
            if (token === iterToken) {
                break;
            }
            if (iterToken.type === TokenType.InterpolationBegin) {
                stack.push(iterToken);
            }
        }
        if (stack.length === 0) {
            return new VREError(message);
        }
        let position = token?.position;
        if (position === undefined) {
            position = this.info.sourceCode.length;
            stack.splice(1);
        }
        let longMessage = '';
        while (stack.length > 0) {
            let beginToken = stack.pop() as InterpolationBeginToken;
            longMessage += this.formatError(beginToken.source, position, message);
            position = beginToken.position;
            message = 'Interpolated from:';
        }
        return new VREError(longMessage.trimEnd());
    }

    private formatError(info: ExpressionSource, position: number, message: string) {
        let linesBefore = info.sourceCode.substring(0, position).split('\n');
        let lineBefore = linesBefore.at(-1) as string;
        let lineAfter = info.sourceCode.substring(position).match(/^.*/)?.[0] || '';
        let lineNumber = linesBefore.length;
        let columnNumber = lineBefore.length + 1;
        lineBefore = this.prettifySource(lineBefore, info);
        lineAfter = this.prettifySource(lineAfter, info);
        if (lineBefore.length > 50) {
            lineBefore = lineBefore.substring(lineBefore.length - 50);
        }
        if (lineAfter.length > 74) {
            lineAfter = lineBefore.substring(0, 74);
        }
        while (lineBefore.length + lineAfter.length > 74) {
            if (lineBefore.length > lineAfter.length) {
                lineBefore = lineBefore.substring(1);
            } else {
                lineAfter = lineBefore.substring(0, lineAfter.length - 1);
            }
        }
        lineBefore = lineBefore.trimStart();
        lineAfter = lineAfter.trimEnd();
        message += `\n    ${lineBefore}${lineAfter}\n`;
        message += `    ${' '.repeat(lineBefore.length)}^- line ${lineNumber}, column ${columnNumber}\n`;
        return message;
    }

    private prettifySource(text: string, info: ExpressionSource): string {
        let regexp = new RegExp(`${info.interpolationPrefix}[0-9]+}`, 'g');
        return text
            .replace(regexp, m => `\${${'.'.repeat(m.length - 3)}}`)
            .replace(/[\0- ]/, ' ');
    }

    private processInterpolation() {
        do {
            let token: Token | undefined = this.info.tokens[this.index];
            if (token?.type === TokenType.InterpolationBegin) {
                this.index++;
                this.interpolationStack.push(token);
                let innerFlags = this.getFlags();
                if (this.flags.ignoreCase !== innerFlags.ignoreCase) {
                    throw this.error(token, `Mismatching "ignore-case" flag in interpolated expression. ` +
                        `Outer expression: "${this.flags.ignoreCase ? 'set' : 'unset'}", ` +
                        `interpolated expression: "${innerFlags.ignoreCase ? 'set' : 'unset'}".`);
                } else if (this.flags.unicode !== innerFlags.unicode) {
                    throw this.error(token, `Mismatching "unicode" flag in interpolated expression. ` +
                        `Outer expression: "${this.flags.unicode ? 'set' : 'unset'}", ` +
                        `interpolated expression: "${innerFlags.unicode ? 'set' : 'unset'}".`);
                }
            } else if (token?.type === TokenType.InterpolationEnd) {
                this.index++;
                this.interpolationStack.pop();
            } else {
                break;
            }
        } while (true);
    }

    private getFlags() {
        let flags = {
            multiline: true,
            indices: false,
            global: true,
            ignoreCase: false,
            unicode: false,
            sticky: false,
        };
        while (this.info.tokens[this.index]?.type === TokenType.Identifier) {
            let flagToken = this.info.tokens[this.index++] as TextToken;
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
                        throw this.error(flagToken, `Unknown flag "${flag}".`);
                }
            }
        }
        return flags;
    }
}


// #endregion


// #region Syntax Tree Nodes


abstract class Node {

    public generateAtom(): string {
        return `(?:${this.generate()})`;
    }

    public generate(): string {
        return this.generateAtom();
    }
}


class List extends Node {

    public items: Node[];

    public constructor(items?: Node[]) {
        super();
        this.items = items || [];
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


class OrExpression extends Node {

    public constructor(
        public items: Node[]
    ) {
        super();
    }

    public generate(): string {
        return this.items.map(item => item.generate()).join('|');
    }
}


class InvertibleNode extends Node {

    public constructor(public negative: boolean) {
        super();
    }
}


class CharacterClassEscape extends InvertibleNode {

    private escapedText!: string;

    private static complementaryValue: { [key: string]: string } = {
        '\\d': '\\D',
        '\\D': '\\d',
        '\\s': '\\S',
        '\\S': '\\s',
        '\\w': '\\W',
        '\\W': '\\w',
    };

    private static keywords: { [keyword: string]: string } = {
        'digit': '\\d',
        'white-space': '\\s',
        'whitespace': '\\s',
        'word-character': '\\w',
        'word-char': '\\w',
    };

    public static create(token: Token) {
        let obj: CharacterClassEscape | undefined = undefined;
        if (token.type === TokenType.CharacterClass && this.complementaryValue[token.text]) {
            obj = new CharacterClassEscape(token.complement);
            obj.escapedText = token.text;
        } else if (token.type === TokenType.Keyword && this.keywords[token.text]) {
            obj = new CharacterClassEscape(false);
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
}


class CharacterClassSingle extends InvertibleNode {

    private unescapedText!: string;

    private static keywords: { [keyword: string]: string } = {
        '\\n': '\n', 'nl': '\n', 'new-line': '\n', 'lf': '\n', 'line-feed': '\n',
        '\\r': '\r', 'cr': '\r', 'carriage-return': '\r',
        '\\t': '\t', 'tab': '\t', 'tabulation': '\t',
        '\\0': '\0', 'null': '\0', 'nul': '\0',
        'sp': ' ', 'space': ' ',
        'nbsp': '\xA0',
    };

    public static create(token: Token) {
        let obj: CharacterClassSingle | undefined = undefined;
        if (token.type === TokenType.Literal && token.text.length === 1) { // TODO: Support unicode surrogate pairs
            obj = new CharacterClassSingle(false);
            obj.unescapedText = token.text;
        } else if (token.type === TokenType.Keyword && this.keywords[token.text]) {
            obj = new CharacterClassSingle(false);
            obj.unescapedText = this.keywords[token.text];
        } else if (token.type === TokenType.CharacterClass && token.text.length === 1) {
            obj = new CharacterClassSingle(token.complement);
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
}


class CharacterClassAny extends InvertibleNode {

    public static create(token: Token) {
        let obj: CharacterClassAny | undefined = undefined;
        if (token.type === TokenType.Keyword && token.text === 'any') {
            obj = new CharacterClassAny(false);
        }
        return obj;
    }

    public generateAtom(): string {
        return this.negative ? '[]' : '.';
    }
}


class CharacterClassRange extends InvertibleNode {

    private escapedText!: string;

    private static keywords: { [keyword: string]: string } = {
        'line-terminator': '\\r\\n\\u2028\\u2029', 'line-term': '\\r\\n\\u2028\\u2029',
        'terminator': '\\r\\n\\u2028\\u2029', 'term': '\\r\\n\\u2028\\u2029',
    };

    public static create(token: Token) {
        let obj: CharacterClassRange | undefined = undefined;
        if (token.type === TokenType.CharacterClass) {
            obj = new CharacterClassRange(token.complement);
            obj.escapedText = token.text;
        } else if (token.type === TokenType.Keyword && this.keywords[token.text]) {
            obj = new CharacterClassRange(false);
            obj.escapedText = this.keywords[token.text];
        }
        return obj;
    }

    public generateAtom(): string {
        return `[${this.negative ? '^' : ''}${this.escapedText}]`;
    }
}


class CharacterClassProperty extends InvertibleNode {

    private property!: string;

    public static create(token: Token, ctx: Context) {
        let obj: CharacterClassProperty | undefined = undefined;
        if (token.type === TokenType.Keyword && (token.text === 'prop' || token.text === 'property')) {
            obj = new CharacterClassProperty(false);
            let id = ctx.read();
            if (id?.type !== TokenType.Identifier) {
                throw ctx.error(id || token, 'Expecting identifier after "property".');
            }
            obj.property = id.text;
        }
        return obj;
    }

    public generateAtom(): string {
        return `\\${this.negative ? 'P' : 'p'}{${this.property}}`;
    }
}


class Literal extends Node {

    private unescapedText!: string;

    public static create(token: Token) {
        let obj: Literal | undefined = undefined;
        if (token.type === TokenType.Literal) {
            obj = new Literal();
            obj.unescapedText = token.text;
        }
        return obj;
    }

    public generate(): string {
        return escapeRegExp(this.unescapedText);
    }
}


class Backreference extends Node {

    private text!: string;

    public static create(token: Token, ctx: Context) {
        let obj: Backreference | undefined = undefined;
        if (token.type === TokenType.Keyword && token.text === 'match') {
            obj = new Backreference();
            let id = ctx.read();
            if (id?.type !== TokenType.Identifier) {
                throw ctx.error(id || token, 'Expecting identifier after "match".');
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
}


class WordBoundary extends InvertibleNode {

    public static create(token: Token) {
        let obj: WordBoundary | undefined = undefined;
        if (token.type === TokenType.Keyword && (token.text === 'word-boundary' || token.text === 'word-bound')) {
            obj = new WordBoundary(false);
        }
        return obj;
    }

    public generateAtom(): string {
        return this.negative ? '\\B' : '\\b';
    }
}


class LineBoundary extends InvertibleNode {

    private start!: boolean;
    private flags!: Flags;

    public static create(token: Token, ctx: Context) {
        let obj: LineBoundary | undefined = undefined;
        if (token.type === TokenType.Keyword && (token.text === 'begin-of-line'
            || token.text === 'start-of-line' || token.text === 'end-of-line')
        ) {
            obj = new LineBoundary(false);
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
}


class TextBoundary extends InvertibleNode {

    private start!: boolean;

    public static create(token: Token, ctx: Context) {
        let obj: TextBoundary | undefined = undefined;
        if (token.type === TokenType.Keyword && (token.text === 'begin-of-text'
            || token.text === 'start-of-text' || token.text === 'end-of-text')
        ) {
            obj = new TextBoundary(false);
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
}


class Group extends Node {

    private id!: string | undefined;
    private child!: Node;

    public static create(token: Token, ctx: Context) {
        let obj: Group | undefined = undefined;
        if (token.type === TokenType.Keyword && token.text === 'group') {
            obj = new Group();
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
}


class LookGroup extends InvertibleNode {

    private ahead!: boolean;
    private child!: Node;

    public static create(token: Token, ctx: Context) {
        let obj: LookGroup | undefined = undefined;
        let m: RegExpMatchArray | null;
        if (token.type === TokenType.Keyword && (m = token.text.match(/^look-?(ahead|behind)$/))) {
            obj = new LookGroup(false);
            obj.ahead = m[1] === 'ahead';
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
}


class Quantifier extends Node {

    private min: number = 0;
    private max: number = Infinity;
    private lazy: boolean = false;
    private child!: Node;

    private static match = /^(?:(?<lazy>lazy-)?(?:(?:at-)?(?<type>most|least)|repeat)(?:-(?<from>[0-9]+))?(?:-(?<to>[0-9]+))?|(?<optional>optional))/;

    public static create(token: Token, ctx: Context) {
        let obj: Quantifier | undefined = undefined;
        let m: RegExpMatchArray | null;
        if (token.type === TokenType.Keyword && (m = token.text.match(Quantifier.match))) {
            obj = new Quantifier();
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
                    throw ctx.error(token, 'Exactly one number expected.');
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


// #endregion


// #region Parser


const verboseRegExpInfo = Symbol('verboseRegExpInfo');


function parseOr(ctx: Context): Node {
    let left = parseList(ctx);
    let next = ctx.peek();
    if (next?.type !== TokenType.Keyword || next.text.toLowerCase() !== 'or') {
        return left;
    }
    ctx.read();
    let right = parseOr(ctx);
    if (left instanceof OrExpression) {
        if (right instanceof OrExpression) {
            left.items.push(...right.items);
        } else {
            left.items.push(right);
        }
        return left;
    } else if (right instanceof OrExpression) {
        right.items.unshift(left);
        return right;
    } else {
        return new OrExpression([left, right]);
    }
}


function parseList(ctx: Context): Node {
    let items: Node[] = [];
    let next = ctx.peek();
    while (next && next.type !== TokenType.End
        && !(next?.type === TokenType.Keyword && next.text.toLowerCase() === 'or')
    ) {
        items.push(parseLeaf(ctx));
        next = ctx.peek();
    }
    if (items.length === 0) {
        return new List();
    } else if (items.length === 1) {
        return items[0];
    } else {
        return new List(items);
    }
}


function parseLeaf(ctx: Context): Node {

    let token = ctx.read();

    switch (token?.type) {
        case TokenType.Begin: {
            let a = parseOr(ctx);
            let end = ctx.read();
            if (end?.type !== TokenType.End) {
                throw ctx.error(token, 'Unterminated bracket.');
            }
            return a;
        }
        case undefined:
            throw ctx.error(undefined, 'Unexpected end of expression.');
        case TokenType.End:
            throw ctx.error(token, 'Unexpected closing bracket.');
        case TokenType.Identifier:
            throw ctx.error(token, `Unexpected identifier "<${token.text}>".`);
        case TokenType.InterpolationBegin:
        case TokenType.InterpolationEnd:
            throw ctx.error(token, 'Unexpected token.');
        case TokenType.CharacterClass:
        case TokenType.Keyword:
        case TokenType.Literal:
            break;
    }

    let node: Node | undefined;

    if (token.type === TokenType.Keyword && token.text === 'not') {
        node = parseLeaf(ctx);
        if (node instanceof InvertibleNode) {
            node.negative = !node.negative;
        } else {
            throw ctx.error(token, 'The "not" keyword is not allowed before this expression.');
        }
    } else {
        node = CharacterClassEscape.create(token)
            || CharacterClassSingle.create(token)
            || CharacterClassAny.create(token)
            || CharacterClassRange.create(token)
            || CharacterClassProperty.create(token, ctx)
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

    if (!node) {
        throw ctx.error(token, `Unknown keyword "${token.text}".`);
    }

    return node;
}


function parse(text: string, interpolationPrefix: string, values: (string | ExpressionTokenized)[]): RegExp {

    let ctx: Context;
    let expressionInfo: ExpressionTokenized = {
        interpolationPrefix: interpolationPrefix,
        sourceCode: text,
        tokens: [],
    };
    try {
        expressionInfo.tokens = tokenize(text, interpolationPrefix, values);
        ctx = new Context(expressionInfo);
    } catch (err) {
        if (err instanceof TokenizerError) {
            ctx = new Context(expressionInfo);
            throw ctx.error({ position: err.position, type: TokenType.Begin }, err.message);
        }
        throw err;
    }

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
    Object.defineProperty(result, verboseRegExpInfo, {
        configurable: false,
        enumerable: false,
        value: expressionInfo,
        writable: false,
    });
    return result;
}


// #endregion


// #region Interface


export default function vre(str: TemplateStringsArray, ...values: any[]) {
    try {
        let raw = str.raw;
        let prefix = randPrefixForText(raw);
        let input = raw[0];
        let valuesProcessed: (string | ExpressionTokenized)[] = [];
        for (let i = 0; i < values.length; i++) {
            let value = values[i];
            input += prefix + i + '}' + raw[i + 1];
            if (value instanceof RegExp && (value as any)[verboseRegExpInfo]) {
                valuesProcessed.push((value as any)[verboseRegExpInfo] as ExpressionTokenized);
            } else {
                valuesProcessed.push(`${values[i]}`);
            }
        }
        return parse(input, prefix, valuesProcessed);
    } catch (err) {
        // Rethrow the error to remove internal stacktrace.
        if (err instanceof VREError) {
            throw new VREError(err.message);
        }
        throw err;
    }
}


// #endregion
