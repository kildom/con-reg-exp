
/\/\*>>>(?<entryText>.+?)\*\/\s*?\r?\n(?<entryCode>.+?)(?=\r?\n)|\/\*>(?<noteText>[^>].*?)\*\/|(?<itemText>\/\/\*.+?\r?\n(?:[\t ]*\/\/\*.+?\r?\n)*)(?<itemCode>[\t ]*(?!\/\/\*).*?)(?=\r?\n)/gis;

const myRegEx = VerboseRegExp(`
	{
		"/*>>>"
		group<entryText> {
			lazy-repeat-1+(any)
		}
		"*/"
		lazy-repeat(space)
		${newLine}
		group<entryCode> {
			lazy-repeat-1+(any)
		}
		lookahead(${newLine})
	} OR {
		"/*>"
		group<noteText> {
			not ">"
			lazy-repeat(any)
		}
		"*/"
	} OR {
		group<itemText> {
			"//*"
			lazy-repeat(any)
			${newLine}
			repeat {
				repeat[\t ]
				"//*"
				lazy-repeat(any)
				${newLine}
			}
		}
		group<itemCode> {
			repeat[\t ]
			not lookahead "//*"
			lazy-repeat(any)
			lookahead ${newLine}
		}
	}

    types: Expression, CharacterClass, Assertion

    "abc"           Expression
    not
        Expression      unsupported!
        CharacterClass  CharacterClass: complement = !complement
        Assertion       Assertion:
                            Look around: Positive<->Negative
                            Word boundary: complement
                            ^ (?<!^)
                            $ (?!$)
    -n -r -t ...        CharacterClass
    [abc]               CharacterClass
    CharacterClass or CharacterClass
                        CharacterClass: if complement == complement: [abc] or [def] => [abcdef]
                        Expression: otherwise (?:[abc]|[^def])
    any or any
                        Expression: (?:abc|def)

	*"abc"			Literal abc
	*not "abc"		something different than literal abc
	*-n			Newline
	*-r			Carriage return
	*-t			Tab
	*-0			Null character
	*[abc]			A single character of: a, b or c
	*not [abc]		A character except: a, b or c
	*[a-z]			A character in the range: a-z
	*not [a-z]		A character not in the range: a-z
	*[a-c] or -n		A character in the range: a-c or new line
	*[a-z] and not [pq]		A character in the range: a-z except p and q
	*[a-k] and [c-z]		A character in both ranges: a-k and c-z
	any			Any single character
	or			Alternate - match either a or b
	-s			Any whitespace character
	not -s			Any non-whitespace character
	-d			Any digit
	not -d			Any non-digit
	-w			Any word character
	not -w			Any non-word character
	-v			Vertical whitespace character
	-b			A word boundary
	not -b			not a word boundary
	match<#>		Match subpattern number #
	???			Unicode property or script category \p{...}
	???			Negation of \p
	match<name>		Match subpattern name
	-uXXXX -xXX		Hex
	( ) { }			Match everything enclosed (?:...)
	group			Capture everything enclosed (...)
	group<name>		Named Capturing Group
	lookahead		Positive Lookahead (?=...)
	lookahead not		Negative Lookahead (?!...)
	lookbehind		Positive lookbehind (?<=...)
	lookbehind not		Negative lookbehind (?<!...)
	optional		Zero or one of - a?
	repeat			Zero or more of - a*
	least-1			One or more of - a+
	repeat-3		exactly 3
	least-3			3 or more
	repeat-3-6		between 3 and 6
	most-6			6 or less
	lazy-repeat		Zero or more of - a*?
	lazy-least-1		One or more of - a+?
	lazy-repeat-3		exactly 3
	lazy-least-3		3 or more
	lazy-repeat-3-6		between 3 and 6
	lazy-most-6		6 or less
	start-of-text		^ (if exists switch off multi-line mode)
	end-of-text		$ (if exists switch off multi-line mode)
	start-of-line		^ for multi-line mode, (?<=[\r\n]|^) otherwise
	end-of-line		$ for multi-line mode, (?=[\r\n]|$) otherwise

`);
