
export enum TokenType {
    Literal,
    Identifier,
    Keyword,
    CharacterClass,
    Begin,
    End,
}

export interface TextToken {
    type: TokenType.Literal | TokenType.Identifier | TokenType.Keyword;
    position: number[];
    text: string;
}

export interface CharacterClassToken {
    type: TokenType.CharacterClass;
    position: number[];
    text: string;
    complement: boolean;
}

export interface TextLessToken {
    type: TokenType.Begin | TokenType.End;
    position: number[];
}

export type Token = TextToken | CharacterClassToken | TextLessToken;

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

const tokenRegexBase = /*vre
    <FIRST> <IGNORE-CASE> <STICKY>

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
        or
            [']
            lazy-repeat ("\\" any or any)
            [']
        }
    or
        // Identifier (group name, flags)
        {
            "<"
            group<identifier> lazy-repeat(any)
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
            "/*" lazy-repeat any "*" "/"
        }
    or
        // Singleline comment
        group<comment2> {
            "//" lazy-repeat any end-of-line
        }
    }

    repeat whitespace // ignore trailing whitespace
    */ /\s*(?:(?<begin>[{(])|(?<end>[})])|(?<keyword>[a-z0-9\\-]+)|(?<literal>"(?:\\[\s\S]|[\s\S])*?")|(?:<(?<identifier>[\s\S]*?)>)|(?:\[(?<complement>\^)?(?<characterClass>(?:\\[\s\S]|[\s\S])*?)\])|(?:(?<prefix>`[A-Z]+)(?<index>[0-9]+)\})|(?<comment1>\/\*.*?\*\/)|(?<comment2>\/\/.*?(?:\n|$)))\s*/isy;


function randPrefix(length: number): string {
    let result = '`';
    for (let i = 0; i < length; i++) {
        result += String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
    return result;
}

export function randPrefixForText(text: readonly string[]): string {
    let prefix = randPrefix(3);
    while (text.some(x => x.indexOf(prefix) >= 0)) {
        prefix = randPrefix(prefix.length + 1);
    }
    return prefix;
}

export function tokenize(text: string, prefix: string, values: (string | Token[])[]): Token[] {
    let result: Token[] = [];
    let tokenRegex = new RegExp(tokenRegexBase);
    let groups: TokenRegexGroups | undefined;
    let position = 0;
    let prefixReplace: RegExp | undefined = undefined;
    let userOffset = 0;
    while ((groups = tokenRegex.exec(text)?.groups)) {
        let userPosition = position + userOffset;
        if (groups.begin !== undefined) {
            result.push({ position: [userPosition], type: TokenType.Begin });
        } else if (groups.end !== undefined) {
            result.push({ position: [userPosition], type: TokenType.End });
        } else if (groups.keyword !== undefined) {
            result.push({ position: [userPosition], type: TokenType.Keyword, text: groups.keyword.toLowerCase() });
        } else if (groups.literal !== undefined) {
            try {
                let content = groups.literal;
                if (content.indexOf(prefix) >= 0) {
                    if (prefixReplace === undefined) {
                        prefixReplace = new RegExp(prefix + '([0-9]+)\\}', 'g');
                    }
                    content = content.replace(prefixReplace, (_, index) => {
                        let value = values[parseInt(index)];
                        if (typeof value !== 'string') {
                            throw new Error('Cannot insert regexp to string literal.');
                        }
                        let result = JSON.stringify(value);
                        result = result.substring(1, result.length - 1);
                        return result;
                    });
                }
                result.push({ position: [userPosition], type: TokenType.Literal, text: (new Function(`return ${content};`))() });
            } catch (ex) {
                throw new Error(); // TODO: errors
            }
        } else if (groups.identifier !== undefined) {
            result.push({ position: [userPosition], type: TokenType.Identifier, text: groups.identifier });
        } else if (groups.characterClass !== undefined) {
            let content = groups.characterClass;
            if (content.indexOf(prefix) >= 0) {
                if (prefixReplace === undefined) {
                    prefixReplace = new RegExp(prefix + '([0-9]+)\\}', 'g');
                }
                content = content.replace(prefixReplace, (_, index) => {
                    let value = values[parseInt(index)];
                    if (typeof value !== 'string') {
                        throw new Error('Cannot insert regexp to character class.');
                    }
                    return value.replace(/[\-\]\\^]/g, '\\$&');
                });
            }
            result.push({ position: [userPosition], type: TokenType.CharacterClass, text: content, complement: !!groups.complement });
        } else if (groups.prefix === prefix) {
            let value = values[parseInt(groups.index as string)];
            let innerTokens: Token[];
            if (typeof value === 'string') {
                innerTokens = tokenize(value, randPrefixForText([value]), []);
            } else {
                innerTokens = value;
            }
            result.push({ position: [userPosition], type: TokenType.Keyword, text: '__sub__' });
            for (let innerToken of innerTokens) {
                result.push({ ...innerToken, position: [userPosition, ...innerToken.position] });
            }
            userOffset -= `${prefix}${groups.index}}`.length;
        } else if (groups.comment1 !== undefined || groups.comment2 !== undefined) {
            // skip comments
        } else {
            break;
        }
        position = tokenRegex.lastIndex;
    }
    if (position < text.length) {
        console.error(`Error at line ${text.substring(0, position).split('\n').length}: Syntax error.`);
        console.error(`Near: ${text.substring(position).split('\n')[0].substring(0, 70)}`);
    }
    return result;
}

/*
const newLine = '(optional -r -n)';

console.log(tokenize(
    `
    
    { [a-z\\]]
        "/*>>>"
""
"some\\" "  "\\\\klk\\""
        group<entryText> {
            lazy-least-1(any)
        }
        "* /"
        lazy-repeat(space)
        ${newLine}
        group<entryCode> {
            lazy-least-1(any)
        }
        lookahead(${newLine})
    } OR {
        "/*>"
        group<noteText> {
            not ">"
            lazy-repeat(any)
        }
        "* /"
    } OR {
        \`yyy0}
        /* This is a comment * /

        "\`yyy1}iooi"
        [\`yyy1}iooi]

    } // a different comment
`, '`yyy', ['xxxxxx', 'in_\0\u1234lit\\e\`\"ral']
));
*/
