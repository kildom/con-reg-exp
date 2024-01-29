/*
 * Copyright 2024 Dominik Kilian
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the “Software”), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions
 * of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
*/


// #region Utilities


/**
 * A string containing characters used for generating unique prefixes.
 */
let prefixGenChars = 'QVRZJQXVKRLADFFXZCQEIKOKJPIXJXKOMJXMYCAHDJZUFTGFMIVPCPLPNNVNCTPVXUXXNTLGVPPQOOHVFMJDZFWQYECCNYFL';


/**
 * Generates a prefix (started with the "`" character) of the specified length.
 */
function generatePrefix(length: number): string {
    while (2 * length > prefixGenChars.length) {
        prefixGenChars = prefixGenChars.repeat(2);
    }
    return '`' + prefixGenChars.substring(length, 2 * length);
}


/**
 * Generates a unique prefix (started with the "`" character) that does not appear in the provided array.
 * The prefix starts with a length of 3 and increases if necessary to ensure uniqueness.
 */
function generatePrefixForText(text: readonly string[]): string {
    let prefix = generatePrefix(3);
    while (text.some(x => x.indexOf(prefix) >= 0)) {
        prefix = generatePrefix(prefix.length + 1);
    }
    return prefix;
}

/**
 * Escapes special characters in a string to be used within a regular expression.
 */
function escapeRegExp(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


/**
 * Escapes special characters in a string to be used within a character class of a regular expression.
 * A "vmode" flag indicates the escape mode for "v" flag enabled.
 */
function escapeCharacterClass(text: string, vmode: boolean) {
    return vmode
        ? text.replace(/(?:[[\\\](){}/|^-]|&&|!!|##|\$\$|%%|\*\*|\+\+|,,|\.\.|::|;;|<<|==|>>|\?\?|@@|\^\^|``|~~)/g, '\\$&')
        : text.replace(/[\\\]^-]/g, '\\$&');
}


// #endregion


// #region Exceptions


/**
 * The class extends the native JavaScript `Error` class to provide
 * error handling specifically for syntax and logic errors in the Verbose Regular Expressions.
 */
export class VREError extends Error { };


class TokenizerError extends Error {
    constructor(public position: number, message: string) {
        super(message);
    }
}


// #endregion


// #region Generated Regular Expressions


const tokenRegExpBase = /\s*(?:(?<begin>[{(])|(?<end>[)}])|(?<label>[a-zA-Z_][a-zA-Z0-9_]*):|(?<keyword>[a-zA-Z0-9\u2011\\-]+)|(?<literal>"(?:\\.|.)*?")|<(?<identifier>.*?)>|\[(?<complement>\^)?(?<characterClass>(?:\\.|.)*?)\]|(?<prefix>`[A-Z]{3,})(?<index>[0-9]+)\}|(?<comment1>\/\*.*?\*\/)|(?<comment2>\/\/.*?)(?=[\r\n\u2028\u2029]|$))\s*/sy;

const tokenRegExpVMode = /\s*(?:(?<begin>[{(])|(?<end>[)}])|(?<label>[a-zA-Z_][a-zA-Z0-9_]*):|(?<keyword>[a-zA-Z0-9\u2011\\-]+)|(?<literal>"(?:\\.|.)*?")|<(?<identifier>.*?)>|(?<characterClassVMode>\[)(?<complement>\^)?|(?<prefix>`[A-Z]{3,})(?<index>[0-9]+)\}|(?<comment1>\/\*.*?\*\/)|(?<comment2>\/\/.*?)(?=[\r\n\u2028\u2029]|$))\s*/sy;

const quantifierRegExp = /^(?<lazy>lazy-|non-greeny-)?(?:(?<optional>optional)|(?<repeat>repeat)|(?:repeat-)?(?:(?:at-)?(?:(?<least>least-)|(?<most>most-))(?<count>\d+)|(?<min>\d+)(?:-to-(?<max>\d+))?)(?:-times?)?)$/su;


// #endregion


// #region Tokenizer


/**
 * Regular expression flags. Meaning the same as in RegExp class with additional `cache` field that controls
 * Verbose Regular Expression cache.
 */
interface Flags {
    multiline: boolean;
    indices: boolean;
    global: boolean;
    ignoreCase: boolean;
    unicode: boolean;
    unicodeSets: boolean;
    sticky: boolean;
    cache: boolean;
}

/**
 * Interface providing original source information. Used to provide detailed error messages with exact locations and
 * malformed source.
 */
interface ExpressionSource {
    sourceCode: string;
    interpolationPrefix: string;
    flags: Flags;
}

/**
 * Interface embedded to the RegExp object created from the Verbose Regular Expression that provides information
 * needed to reuse the expression in a different one.
 */
interface ExpressionTokenized extends ExpressionSource {
    tokens: Token[];
}

/**
 * Type of tokens
 */
enum TokenType {
    /** String literal, e.g. `"abc"` */
    Literal,
    /** Identifier, e.g. `<name>` */
    Identifier,
    /** Label: e.g. `name:` */
    Label,
    /** Keyword: e.g. `at-least-1` */
    Keyword,
    /** Character class: e.g. `[^abc]` */
    CharacterClass,
    /** Parentheses or braces begin: `(` or `{` */
    Begin,
    /** Parentheses or braces end: `)` or `}` */
    End,
    /** Internal token used to indicate beginning of the interpolation. */
    InterpolationBegin,
    /** Internal token used to indicate end of the interpolation. */
    InterpolationEnd,
}

/**
 * Token containing textual data.
 */
interface TextToken {
    type: TokenType.Literal | TokenType.Identifier | TokenType.Label | TokenType.Keyword;
    position: number;
    text: string;
}

/**
 * Character class token.
 */
interface CharacterClassToken {
    type: TokenType.CharacterClass;
    position: number;
    text: string;
    complement: boolean;
}

/**
 * Interpolation begin token. Provides information about the source of the interpolation.
 */
interface InterpolationBeginToken {
    type: TokenType.InterpolationBegin;
    position: number;
    source: ExpressionSource;
}

/**
 * Token that does not provide additional data.
 */
interface EmptyToken {
    type: TokenType.Begin | TokenType.End | TokenType.InterpolationEnd;
    position: number;
}

/**
 * Any token type.
 */
type Token = TextToken | CharacterClassToken | EmptyToken | InterpolationBeginToken;

/**
 * Groups defined in the `tokenRegExpBase` and `tokenRegExpVMode`.
 */
interface TokenRegExpGroups {
    begin?: string;
    end?: string;
    label?: string;
    keyword?: string;
    literal?: string;
    identifier?: string;
    characterClass?: string;
    characterClassVMode?: string;
    complement?: string;
    prefix?: string;
    index?: string;
    comment1?: string;
    comment2?: string;
}


/**
 * Returns index in the text where the character class ends in v-mode (with 'v' flag set).
 */
function matchVModeCharacterClass(text: string, index: number) {
    let nested = 0;
    let startIndex = index;
    while (index < text.length) {
        let ch = text[index];
        if (ch === '[') {
            nested++;
        } else if (ch === ']') {
            if (nested == 0) {
                return index;
            }
            nested--;
        } else if (ch === '\\') {
            index++;
            if (index === text.length) {
                break;
            }
        }
        index++;
    }
    throw new TokenizerError(startIndex, 'Unterminated character class.');
}


/**
 * Do text tokenization and values interpolation.
 *
 * @param text The text to tokenize. It contains interpolation placeholders that are concatenation of:
 *             prefix, interpolated value index, the `}` character.
 * @param interpolationPrefix A prefix for interpolation placeholders.
 * @param values Interpolation values.
 * @param flags Regular expression flags.
 * @returns Array of tokens.
 */
function tokenize(text: string, interpolationPrefix: string, values: (string | ExpressionTokenized)[],
    flags: Flags): Token[] {

    let result: Token[] = [];
    let tokenRegex = new RegExp(flags.unicodeSets ? tokenRegExpVMode : tokenRegExpBase);
    let groups: TokenRegExpGroups | undefined;
    let position = 0;
    let prefixReplace: RegExp = new RegExp(interpolationPrefix + '([0-9]+)\\}', 'g');

    while ((groups = tokenRegex.exec(text)?.groups)) {
        if (groups.begin !== undefined) {
            // Parentheses or braces begin.
            result.push({ position, type: TokenType.Begin });
        } else if (groups.end !== undefined) {
            // Parentheses or braces end.
            result.push({ position, type: TokenType.End });
        } else if (groups.label !== undefined) {
            // Label (capturing group begin).
            result.push({ position, type: TokenType.Label, text: groups.label });
        } else if (groups.keyword !== undefined) {
            // Keyword.
            result.push({
                position,
                type: TokenType.Keyword,
                text: groups.keyword.toLowerCase().replace(/\u2011/g, '-'),
            });
        } else if (groups.literal !== undefined) {
            // Literal string (can contains interpolation).
            let content = groups.literal;
            // Replace interpolation placeholders.
            if (content.indexOf(interpolationPrefix) >= 0) {
                content = content.replace(prefixReplace, (_, index) => {
                    // Fetch interpolation value that can only be string.
                    let value = values[parseInt(index)];
                    if (typeof value !== 'string') {
                        throw new TokenizerError(position, 'Cannot interpolate expression to a string literal.');
                    }
                    // Replace with escaped string (using JSON).
                    let result = JSON.stringify(value);
                    return result.substring(1, result.length - 1);
                });
            }
            // Evaluate string literal as JavaScript expression.
            try {
                result.push({ position, type: TokenType.Literal, text: (new Function(`return ${content};`))() });
            } catch (ex) {
                throw new TokenizerError(position, 'Error parsing string literal.');
            }
        } else if (groups.identifier !== undefined) {
            // Identifier.
            result.push({ position, type: TokenType.Identifier, text: groups.identifier });
        } else if (groups.characterClass !== undefined || groups.characterClassVMode !== undefined) {
            // Character class.
            let content: string;
            if (groups.characterClass !== undefined) {
                // Simple character class.
                content = groups.characterClass;
            } else {
                // V-mode class cannot be parsed by regular expression at once, so step by step method is needed.
                let matchingEnd = matchVModeCharacterClass(text, tokenRegex.lastIndex);
                content = text.substring(tokenRegex.lastIndex, matchingEnd);
                tokenRegex.lastIndex = matchingEnd + 1;
            }
            // Replace interpolation placeholders.
            if (content.indexOf(interpolationPrefix) >= 0) {
                content = content.replace(prefixReplace, (_, index) => {
                    // Fetch interpolation value that can only be string.
                    let value = values[parseInt(index)];
                    if (typeof value !== 'string') {
                        throw new TokenizerError(position, 'Cannot interpolate expression to a character class.');
                    }
                    // Replace with escaped string.
                    return escapeCharacterClass(value, flags.unicodeSets);
                });
            }
            result.push({ position, type: TokenType.CharacterClass, text: content, complement: !!groups.complement });
        } else if (groups.prefix === interpolationPrefix) {
            // Placeholder - another expression interpolated directly here.
            let value = values[parseInt(groups.index as string)];
            if (typeof value === 'string') {
                // String expression - tokenize it and put into current result.
                let innerPrefix = generatePrefixForText([value]);
                result.push({
                    position,
                    type: TokenType.InterpolationBegin,
                    source: { sourceCode: value, interpolationPrefix: innerPrefix, flags },
                });
                result = result.concat(tokenize(value, innerPrefix, [], flags));
                result.push({ position, type: TokenType.InterpolationEnd });
            } else {
                // Verbose Regular Expression, first check if significant flags are the same.
                if (flags.ignoreCase !== value.flags.ignoreCase) {
                    throw new TokenizerError(position, `Mismatching "ignoreCase" flag in interpolated expression. ` +
                        `Outer expression: "${flags.ignoreCase ? 'set' : 'unset'}", ` +
                        `interpolated expression: "${value.flags.ignoreCase ? 'set' : 'unset'}".`);
                } else if (flags.unicode !== value.flags.unicode) {
                    throw new TokenizerError(position, `Mismatching "legacy" flag in interpolated expression. ` +
                        `Outer expression: "${flags.unicode ? 'unset' : 'set'}", ` +
                        `interpolated expression: "${value.flags.unicode ? 'unset' : 'set'}".`);
                } else if (flags.unicodeSets !== value.flags.unicodeSets) {
                    throw new TokenizerError(position, `Mismatching "unicode" flag in interpolated expression. ` +
                        `Outer expression: "${flags.unicodeSets ? 'set' : 'unset'}", ` +
                        `interpolated expression: "${value.flags.unicodeSets ? 'set' : 'unset'}".`);
                }
                // Place tokens from the source expression and enclose in parentheses.
                result.push({ position, type: TokenType.Begin });
                result.push({ position, type: TokenType.InterpolationBegin, source: value });
                result = result.concat(value.tokens);
                result.push({ position, type: TokenType.InterpolationEnd });
                result.push({ position, type: TokenType.End });
            }
        } else if (groups.comment1 !== undefined || groups.comment2 !== undefined) {
            // Comments - skip them.
        } else {
            // Any other case is an error.
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


class Context {

    private index: number;
    private interpolationStack: InterpolationBeginToken[] = [];

    public constructor(
        public info: ExpressionTokenized,
    ) {
        this.index = 0;
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
            } else if (token?.type === TokenType.InterpolationEnd) {
                this.index++;
                this.interpolationStack.pop();
            } else {
                break;
            }
        } while (true);
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
            if (item instanceof OrOperator) {
                return item.generateAtom();
            } else {
                return item.generate();
            }
        }).join('');
    }
}


class OrOperator extends Node {

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
    private vmode!: boolean;

    private static keywords: { [keyword: string]: string } = {
        '\\n': '\n', 'nl': '\n', 'new-line': '\n', 'lf': '\n', 'line-feed': '\n',
        '\\r': '\r', 'cr': '\r', 'carriage-return': '\r',
        '\\t': '\t', 'tab': '\t', 'tabulation': '\t',
        '\\0': '\0', 'null': '\0', 'nul': '\0',
        'sp': ' ', 'space': ' ',
        'nbsp': '\xA0',
    };

    public static create(token: Token, ctx: Context) {
        let obj: CharacterClassSingle | undefined = undefined;
        if (token.type === TokenType.Literal && (token.text.length === 1
            || (ctx.info.flags.unicode && token.text.length === 2 && /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(token.text)))) {
            obj = new CharacterClassSingle(false);
            obj.unescapedText = token.text;
            obj.vmode = ctx.info.flags.unicodeSets;
        } else if (token.type === TokenType.Keyword && this.keywords[token.text]) {
            obj = new CharacterClassSingle(false);
            obj.unescapedText = this.keywords[token.text];
            obj.vmode = ctx.info.flags.unicodeSets;
        } else if (token.type === TokenType.CharacterClass && token.text.length === 1) {
            obj = new CharacterClassSingle(token.complement);
            obj.unescapedText = token.text;
            obj.vmode = ctx.info.flags.unicodeSets;
        }
        return obj;
    }

    public generateAtom(): string {
        if (this.negative) {
            return `[^${escapeCharacterClass(this.unescapedText, this.vmode)}]`;
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
            if (!ctx.info.flags.unicode) {
                throw new VREError('Property requires <UNICODE> flag.');
            }
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
            obj.flags = ctx.info.flags;
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
            ctx.info.flags.multiline = false;
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
            obj.id = undefined;
            obj.child = parseLeaf(ctx);
        } else if (token.type === TokenType.Label) {
            obj = new Group();
            obj.id = token.text;
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


interface QuantifierRegExpGroups {
    lazy?: string;
    optional?: string;
    repeat?: string;
    least?: string;
    most?: string;
    count?: string;
    min?: string;
    max?: string;
}


class Quantifier extends Node {

    private min!: number;
    private max!: number;
    private lazy!: boolean;
    private child!: Node;

    public static create(token: Token, ctx: Context) {
        let obj: Quantifier | undefined = undefined;
        let m2: RegExpMatchArray | null;
        if (token.type === TokenType.Keyword && (m2 = token.text.match(quantifierRegExp))) {
            let groups = m2.groups as QuantifierRegExpGroups;
            obj = new Quantifier();
            obj.lazy = !!groups.lazy;
            if (groups.optional) {
                obj.min = 0;
                obj.max = 1;
            } else if (groups.repeat) {
                obj.min = 0;
                obj.max = Infinity;
            } else if (groups.least) {
                obj.min = parseInt(groups.count as string);
                obj.max = Infinity;
            } else if (groups.most) {
                obj.min = 0;
                obj.max = parseInt(groups.count as string);
            } else if (groups.max !== undefined) {
                obj.min = parseInt(groups.min as string);
                obj.max = parseInt(groups.max as string);
            } else {
                obj.min = parseInt(groups.min as string);
                obj.max = parseInt(groups.min as string);
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
    if (left instanceof OrOperator) {
        if (right instanceof OrOperator) {
            left.items.push(...right.items);
        } else {
            left.items.push(right);
        }
        return left;
    } else if (right instanceof OrOperator) {
        right.items.unshift(left);
        return right;
    } else {
        return new OrOperator([left, right]);
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
        case TokenType.Label:
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
            || CharacterClassSingle.create(token, ctx)
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


function parse(text: string, interpolationPrefix: string, values: (string | ExpressionTokenized)[],
    flags: Partial<Flags>): RegExp {

    let ctx: Context;
    let expressionInfo: ExpressionTokenized = {
        interpolationPrefix: interpolationPrefix,
        sourceCode: text,
        tokens: [],
        flags: {
            multiline: true,
            indices: false,
            global: true,
            ignoreCase: false,
            unicode: true,
            unicodeSets: false,
            sticky: false,
            cache: false,
            ...flags,
        }
    };
    try {
        expressionInfo.tokens = tokenize(text, interpolationPrefix, values, expressionInfo.flags);
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
    let regexpFlags = 's';
    if (ctx.info.flags.indices) regexpFlags += 'd';
    if (ctx.info.flags.global) regexpFlags += 'g';
    if (ctx.info.flags.ignoreCase) regexpFlags += 'i';
    if (ctx.info.flags.multiline) regexpFlags += 'm';
    if (ctx.info.flags.sticky) regexpFlags += 'y';
    if (ctx.info.flags.unicodeSets) {
        if (ctx.info.flags.unicode) {
            regexpFlags += 'v';
        } else {
            throw ctx.error(undefined, 'You cannot mix "legacy" and "unicode" flags.');
        }
    } else {
        if (ctx.info.flags.unicode) {
            regexpFlags += 'u';
        }
    }

    let result = new RegExp(pattern, regexpFlags);
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


type CacheNode = Map<string | number, CacheNode | RegExp>;

const cache = new Map<string, CacheNode | RegExp>();
const cacheExpId = new WeakMap<RegExp, number>();
let cacheExpIdLast = 1;
const proxyCache: { [key: string]: typeof vre } = {};


function vreImpl(flags: Partial<Flags>, str: TemplateStringsArray, ...values: any[]): RegExp {
    try {
        let raw = str.raw;
        let prefix = generatePrefixForText(raw);
        let input = raw[0];
        let valuesProcessed: (string | ExpressionTokenized)[] = [];
        let cacheKeys: (string | number)[] | undefined = flags.cache ? [] : undefined;

        for (let i = 0; i < values.length; i++) {
            let value = values[i];
            input += prefix + i + '}' + raw[i + 1];
            if (value instanceof RegExp && (value as any)[verboseRegExpInfo]) {
                valuesProcessed.push((value as any)[verboseRegExpInfo] as ExpressionTokenized);
                let id = cacheExpId.get(value);
                if (id === undefined) {
                    id = cacheExpIdLast++;
                    cacheExpId.set(value, id);
                }
                cacheKeys?.push?.(id);
            } else {
                if (typeof value !== 'string') {
                    value = `${value}`;
                }
                valuesProcessed.push(value);
                cacheKeys?.push?.(value);
            }
        }

        if (cacheKeys) {
            let cached: CacheNode | RegExp | undefined = cache.get(input);
            for (let i = 0; i < cacheKeys.length && cached; i++) {
                if (cached instanceof Map) {
                    cached = cached.get(cacheKeys[i]);
                }
            }
            if (cached instanceof RegExp) {
                return new RegExp(cached);
            }
        }

        let result = parse(input, prefix, valuesProcessed, flags);

        if (cacheKeys) {
            let cacheMap: CacheNode = cache;
            let key: string | number = input;
            for (let i = 0; i < cacheKeys.length; i++) {
                let nextMap = cacheMap.get(key);
                if (!(nextMap instanceof Map)) {
                    nextMap = new Map();
                    cacheMap.set(key, nextMap);
                }
                cacheMap = nextMap
                key = cacheKeys[i];
            }
            cacheMap.set(key, result);
        }

        return result;
    } catch (err) {
        // Rethrow the error to remove internal stacktrace.
        if (err instanceof VREError) {
            throw new VREError(err.message);
        }
        throw err;
    }
}


const proxyHandler = {
    apply(target: object, thisArg: any, argumentsList: any[]) {
        let obj = (target as any)();
        return vreImpl(obj, ...(argumentsList as [TemplateStringsArray, string]));
    },
    get(target: object, prop: string) {
        let obj = (target as any)();
        let id = obj._id + prop;
        if (id in proxyCache) return proxyCache[id];
        let update: any;
        switch (prop) {
            case 'indices': update = { indices: true }; break;
            case 'first': update = { global: false }; break;
            case 'ignoreCase': update = { ignoreCase: true }; break;
            case 'legacy': update = { unicode: false }; break;
            case 'unicode': update = { unicodeSets: true }; break;
            case 'sticky': update = { sticky: true }; break;
            case 'cache': update = { cache: true }; break;
        };
        let newObj = { ...obj, ...update, _id: id };
        proxyCache[id] = (new Proxy(() => newObj, proxyHandler) as any);
        return proxyCache[id];
    }
};


/**
 * The function is a tagged template literal function that produces RegExp object from
 * the Verbose Regular Expression.
 */
export default function vre(str: TemplateStringsArray, ...values: any[]): RegExp {
    return vreImpl({}, str, ...values);
}


vre.indices = new Proxy(() => ({ _id: 'indices', indices: true }), proxyHandler) as typeof vre;
vre.first = new Proxy(() => ({ _id: 'first', global: false }), proxyHandler) as typeof vre;
vre.ignoreCase = new Proxy(() => ({ _id: 'ignoreCase', ignoreCase: true }), proxyHandler) as typeof vre;
vre.legacy = new Proxy(() => ({ _id: 'legacy', unicode: false }), proxyHandler) as typeof vre;
vre.unicode = new Proxy(() => ({ _id: 'unicode', unicodeSets: true }), proxyHandler) as typeof vre;
vre.sticky = new Proxy(() => ({ _id: 'sticky', sticky: true }), proxyHandler) as typeof vre;
vre.cache = new Proxy(() => ({ _id: 'cache', cache: true }), proxyHandler) as typeof vre;


// #endregion
