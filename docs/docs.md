# Usage

## Installing

You can choose one of two methods to get the Convenient Regular Expressions.
They are described below.
One is with the `npm` and the second one is with the `<script>` tag.

### Install with `npm`

The package name is `con-reg-exp`, so just run:

```bash
npm install con-reg-exp
```

Now, you can import it with the `import` keyword:

```javascript
import cre from "con-reg-exp";
```

Alternatively, if you are using CommonJS, you can write:

```javascript
const cre = require("con-reg-exp");
```

The `cre` symbol is available now and you can use it.
The package contains also TypeScript definitions for it.

### Use `<script>` tag

You can make `cre` available globally in your HTML page by using `<script>` tag:

```html
<script type="text/javascript" src="con-reg-exp.min.js"></script>
```

You can download the script from the [releases page](https://github.com/kildom/con-reg-exp/releases/).
You can also download [latest version](https://github.com/kildom/con-reg-exp/releases/latest/download/con-reg-exp.browser.zip) directly.

The release archive also contains TypeScript definitions that you can import, if you are using TypeScript.

## Using in the code

The only symbol that the module exports is `cre` (short for "Convenient Regular Expression").
Use it in the [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates):

```javascript
const myRegExp = cre`... regular expression goes here ...`;
```

The `cre` tag function returns a standard [`RegExp`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) object.

# Flags

After the `cre` tag, you can specify one or more flags.
The flags and tag are separated with a dot `.`.
For example:

```javascriptwithcre
let items = input.split(cre.ignoreCase.unicode`"and"`);
```

Flag name | RegExp<br/>equivalent | Description
----|----|----
`indices` | [`d`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/hasIndices) | Generate indices.
`global` | [`g`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/global) | Do global search.
`ignoreCase` | [`i`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/ignoreCase) | Case-insensitive.
`legacy` | opposite of [`u`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicode) | *CRE* support unicode surrogate pairs by default. This flag brings up old behavior which interprets surrogate pair as two separate characters and also disables `\u{}` and `\p{}`.
`unicode` | [`v`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicodeSets) | Upgraded unicode (v-mode).
`sticky` | [`y`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky) | Sticky search.
`cache` | | Use *CRE* cache, see below.

You may notice that some RegExp flags are not listed above.
The `m` and `s` flags are handled automatically by the *CRE* and you don't need to know
about their status.

> [!NOTE]
> The `unicode` (`v` in RegExp) flag is a recent addition to JavaScript's regular expressions,
> so it may not be available on some older platforms.

## Cache

The regular expression can be cached, so once it get translated
into RegExp, the *CRE* will return copy of same object for the same
input string and interpolated values. It is done using `cache` flag that must be the,
for example:

```javascriptwithcre
let match = input.match(cre.cache`repeat digit`);
```

If high performance is your goal, better solution would be to put the expression
in a variable just once and reuse it, for example in global `const`.

> [!WARNING]
> Be careful with the interpolation and cache. If interpolated values are
> changing, cache will keep regular expression for each value. Frequently changing
> values may lead to memory leaks.

# Syntax

> [!NOTE]
> If you are new to *Convenient Regular Expressions*, look at the [tutorial](tutorial.md) first.

## Comments

You can use comments inside *CRE*. They are the same as JavaScript's comments,
but you have to remember to escape `` ` `` and `${`
since you are in tagged template.

```javascriptwithcre
let hasMath = cre`
    /* The following expression will match
     * a simple math with two integers.
     */
    at-least-1 digit;   // First integer
    repeat whitespace;
    [*/+-];             // Operator
    repeat whitespace;
    at-least-1 digit;   // Second integer
`.test(input);
```

## String literal

It string literal matches a string literally.

Its syntax is the same as JavaScript string literals with one exception.
You have to escape backticks `` ` `` and interpolation begin sequence `${`.

For example:

```javascriptwithcre
let containsWarning = cre.ignoreCase`"warning"`.test(input);
let numberOfLines = input.match(cre`"\n"`).length + 1;
let hasBacktick = cre`"\`"`.test(input);
```

### String literal alias

Some special characters are available with a keyword.
You can use it instead of writing it literally in a string.

Value   | Aliases
--------|--------------------
`"\n"`  | `new-line`, `nl`, `\n`, `line-feed`, `lf`
`"\r"`  | `carriage-return`, `cr`, `\r`
`"\t"`  | `tabulation`, `tab`, `\t`
`"\0"`  | `null`, `nul`, `\0`
`" "`   | `space`, `sp`
`"\xA0"`| `nbsp`

## Character class

Character class matches one character in set of characters.

Character class in *CRE* works the same as
[RegExp character class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class) with one exception.
You have to escape backticks `` ` `` and interpolation begin sequence `${`.

For example:

```javascriptwithcre
let isNotHexString = cre`[^0-9a-fA-F]`.test(input);
```

Complement of character class can also be expressed using `not` keyword.
The example above can be rewritten as follows:

```javascriptwithcre
let isNotHexString = cre`not [0-9a-fA-F]`.test(input);
```

### Character class alias

Some character classes can be expressed with the keyword, for example `any` matches
any character.

Keyword | RegExp equivalent | Complement RegExp | Description | Aliases
--------|-------------------|-------------------|-------------|--------
`any` | `.` with `s` flag | `[]` | Matches any character
`digit` | `\d` | `\D` | Digit
`white‑space` | `\s` | `\S` | Whitespace | `whitespace`
`word‑character` | `\w` | `\W` | Word characters (`A` to `Z`, `a` to `z`, `0` to `9`, `_`) | `word‑char`
`line‑terminator` | `[\r\n\u2028\u2029]` | `.` without `s` flag | Character that terminates the line | `line‑term` `terminator` `term`

```javascriptwithcre
let hasDigit = cre`digit`.test(input);
```

Character class keyword can also be complemented with the `not` operator:

```javascriptwithcre
let onlyDigits = input.replace(cre.global`not digit`, '');
```

### Unicode Property

Character class that matches specific unicode property uses `property` (alias `prop`) keyword followed by actual property enclosed in `< >`.

```javascriptwithcre
let hasNonEnglishLetters = cre`lookahead not [A-Z], prop<Letter>`.test(input);
```

You can also specify unicode properties in character class `[\p{...}]`.

It is not available if `legacy` flag is set.
If the `unicode` flag is set, it can be used to match properties of strings, instead of just characters.

## Quantifiers

// TODO: Maybe stop using node, but instead maybe simply "expression"?

Quantifiers tells how many times the following node must match.
Those are equivalents of `?`, `*`, `+`, `{n,m}` in RegExp notation.
For example:

```javascriptwithcre
let numberLessThan100 = cre`optional [1-9], digit`;
```

Quantifier is a keyword with flexible syntax. Some parts of it are optional,
so it gives you a flexibility in writing quantifiers.

Keyword | RegExp<br/>equivalent | Min | Max | Comment 
--------|-------------------|-----|-----|--------
`optional`     | `?`     | 0 | 1
`at‑least‑1`   | `+`     | 1 | ∞ | You can skip `at‑` and optionally add `repeat‑` prefix or `‑times` suffix.
`at‑least‑N`   | `{N,}`  | N | ∞ | You can skip `at‑` and optionally add `repeat‑` prefix or `‑times` suffix.
`at‑most‑N`    | `{0,N}` | 0 | N | You can skip `at‑` and optionally add `repeat‑` prefix or `‑times` suffix.
`repeat`       | `*`     | 0 | ∞
`N‑times`      | `{N}`   | N | N | You can skip `‑times` and optionally add `repeat‑` prefix.
`N‑to‑M‑times` | `{N,M}` | N | M | You can skip `‑times` and optionally add `repeat‑` prefix.

### Lazy quantifiers

The above "greedy" quantifiers can be prefixed with `lazy‑` or `non‑greedy‑`.
It will make the quantifier lazy (non-greedy) which is equivalent of adding `?` sign in the standard RegExp.
For example:

```javascriptwithcre
let matchQuotedText = cre`["], lazy-repeat any, ["]`;
```

## Flow and grouping

### Sequence

// TODO: maybe call it differently?

Literals, character classes, and also other nodes described below can be
separated by comma or semicolon (`,` or `;`) to provide sequence of matches. For example:

```javascriptwithcre
let hasGrayInAnyForm = cre`"gr", [ae], "y"`.test(input);
```

The comma and semicolon have the same meaning, but for better readability:

* use comma to separate expressions in a single line, for example:

    ```javascriptwithcre
    let matchNumber = cre`optional [+-], at-least-1 digit`;
    ```

* use semicolon to separate expressions between lines by placing it at the end of a line, for example:

    ```javascriptwithcre
    let matchNumber = cre`
        optional [+-];
        at-least-1 digit;
    `;
    ```

Empty expression between separators are ignored.
Separator after closing bracket or parenthesis is optional, for example:

```javascriptwithcre
let addressWithUserName = cre`
    optional {
        lazy-repeat any;
        "@"; // here we have an empty expression which will be ignored
    } // no need to for a semicolon
    repeat any;
`
```

### Operator `or`

Use `or` operator to specify two or more alternatives.
It makes an alternative of expressions on the left and right.
Multiple `or`s can be used to make an alternative of more expressions.

The same example as above, but using `or`:

```javascriptwithcre
let hasGrayInAnyForm = cre`"gray" or "grey"`.test(input);
```

All prefix (unary) operators have higher precedence, so `or` operator is applied after all
prefixes on both sides. If left or right hand expression contains multiple prefix operators surround it with
the parentheses for better readability. For example:

```javascriptwithcre
// This is more readable:
let pattern = cre`(other: lazy-repeat not digit) or (optional digit)`;
// than that:
let pattern = cre`other: lazy-repeat not digit or optional digit`;
// but both generates exactly the same result.
```

### Parentheses `( )` and braces `{ }`

Parentheses `( )` and braces `{ }` works exactly the same.
They controls the precedence of evaluation.

In theory, you can exchange `( )` and `{ }` however you want,
but for clarity, you should use `( )` to group nodes in single line, and
`{ }` for groups that span multiple lines.

The same example as above, but with parentheses `( )`:

```javascriptwithcre
let hasDarkGrayInAnyForm = cre`(optional "dark ", "gray") or (optional "dark ", "grey")`.test(input);
```

Or, multi-line variant:

```javascriptwithcre
let hasDarkGrayInAnyForm = cre`
    {
        optional "dark ", "gray";
    } or {
        optional "dark ", "grey"
    }
    `.test(input);
```

### Operator `not`

You can place `not` operator before some atoms to achieve opposite meaning.

Operand | Matching with `not` operator | Examples
--|---|---
Any character class | Complement of the class | `not [abc]`, `not digit`, `not property<Letter>`
One character | Anything other than that character | `not \n`, `not "x"`
Boundary assertion | Negative boundary assertion | `not end‑of‑line`, `not word‑boundary`
Look ahead and look behind assertion | Inverse of that assertion | `not look-ahead "x"`

## Assertions

### Boundary assertion

Checks if the current position is a specific boundary. There are several boundaries:

Keyword | RegExp equivalent | Description | Aliases
--------|-------------------|-------------|--------
`begin‑of‑text` | `^` without `m` flag | Start of input | `start‑of‑text`
`end‑of‑text` | `$` without `m` flag | End of input
`begin‑of‑line` | `^` with `m` flag | Start of line or input | `start‑of‑line`
`end‑of‑line` | `$` with `m` flag | End of line or input
`word‑boundary` | `\b` | Word boundary

For example:

```javascriptwithcre
let isJPEG = cre.ignoreCase`(".jpeg" or ".jpg"), end-of-text`.test(fileName);
```

Boundary assertion can be complemented with the `not` operator, for example:

```javascriptwithcre
let tabInTheMiddleOfLine = cre`not begin-of-line, "\t"`.test(fileName);
```

### Look assertion

This kind of assertion allows you to match given pattern without
consuming anything.

Keyword | Description | Alias
--------|-----|---
`lookahead` | Matches the following atom against text after current position | `look‑ahead`
`lookbehind` | Matches the following atom against text before current position | `look‑behind`

You can add `not` keyword before or after `lookahead` and `lookbehind` keyword
to get Negated assertion.

## Capturing

### Named capturing group

The named capturing group looks similar to the labels in JavaScript.
It is a name with colon at the end `name:`.

```javascriptwithcre
let match = input.match(cre`
    user: at-least-1 [a-zA-Z_.-];
    "@";
    address: at-least-1 [a-zA-Z_.-];
`);
```

### Positional capturing group

> [!NOTE]
> For better readability and maintenance,
> prefer named groups over positional.

The positional capturing group that is identified as a index
is using `group` operator followed by the node that should be captured.

### Backreference

You can match previously captured string using `match` operator followed by
capturing group name or index enclosed by `< >`.


```javascriptwithcre
let hasRepeatingWords = cre`
    firstWord: at-least-1 word-char;
    at-least-1 not word-char;
    match<firstWord>;
`.test(input);
```

## Interpolation

Other values and expressions can be added to the *CRE* using interpolation.
There are tree kinds of interpolations: string interpolation, character class interpolation, expression interpolation.

### String interpolation

You can place arbitrary string into the string literal. You don't need to
escape it before using, the *CRE* will handle that for you.

```javascriptwithcre
function hasVerbInAnyForm(text, verb) {
    return cre.ignoreCase`
        word-boundary;
        "${verb}" or "${verb}s" or "${verb}es";
        word-boundary;
    `.test(text);
}
```

If the interpolated value is *CRE*, error will be thrown.
If it is not a string, it will be converted to string.

### Character class interpolation

You can place arbitrary string into the character class.
Each character from the string will be added to matching set of that class.
You don't need to escape it before using, the *CRE* will handle that for you.

Characters from interpolated value are added with escaping,
so value `a-f` will be interpreted as `a\-f`. If this is not your intention,
you must specify each character in the interpolated string - `abcdef`.

```javascriptwithcre
function isInteger(text, isHex) {
    const additionalCharacters = isHex ? "abcdef" : "";
    return cre.ignoreCase`
        start-of-text;
        at-least-1 [0-9${additionalCharacters}];
        end-of-text;
    `.test(text);
}
```

If the interpolated value is *CRE*, error will be thrown.
If it is not a string, it will be converted to string.

### Expression interpolation

You can reuse *CRE* expression in another expression.
The input expression must be a *CRE* expression created with the `cre` tag or a string.
There is a slide difference between interpolating *CRE* expression and a string:

* Interpolated *CRE* expression becomes an atom, so, for example, adding `repeat`
  quantifier will affect entire interpolated expression.
  The `ignoreCase`, `unicode` and `legacy` flags must be the same in both
  expressions. JavaScript does not allow to change RegExp flags in the middle of
  the expression.
* Interpolated string is simply placed token by token, so, for example,
  adding `repeat` quantifier will affect only the first atom in
  the interpolated expression.

```javascriptwithcre
const number = cre`
    optional [+-];                   // Sign
    {
        at-least-1 digit;            // Integral part
        optional (".", repeat digit);// Optional factional part
    or
        ".";                         // Variant with only fractional part
        at-least-1 digit;
    }
    optional {                       // Optional exponent part
        [eE];
        optional [+-];
        at-least-1 digit;
    }
`;

const ws = cre`repeat whitespace`;

function validateJSONArrayOfNumbers(text) {
    return cre.cache`
        begin-of-text, ${ws};  // Trim leading whitespaces
        "[", ${ws};            // Begin of array
        optional {             // Array can be empty
            repeat {           // Numbers with trailing comma
                ${number}, ${ws};
                ",", ${ws};
            }
            ${number}, ${ws};  // Last number has no comma
        }
        "]", ${ws};
        end-of-text;
    `.test(text);
}
```

> [!NOTE]
> If it is possible, try to interpolate *CRE* expression instead of strings.
> Use string only when interpolated expression is not a full *CRE* expression.
> For example:


```javascriptwithcre
function validateWord(text, allowEmpty) {
    let quantifier = allowEmpty ? 'repeat' : 'at-least-1';
    return cre.cache`
        begin-of-text;
        ${quantifier} word-character;
        end-of-text;
    `.test(text);
}
```
