
# Convenient Regular Expressions Overview

This document explains how to use the **Convenient Regular Expressions** (***CRE*** in short).

The examples shown here are kept simple.
Looking at them, you may not see benefits of *CRE*,
but true potential of *CRE* is really visible with longer and complex expressions.

## Embedding into JavaScript

The *CRE* are written using the
[tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates).
A tag name is **`cre`**. The *CRE* tagged template returns `RegExp` object.

```javascript
let match = input.match(cre`repeat digit`);
```

The equivalent code using RegExp would be:

```javascript
let match = input.match(/\d*/gms);
```

Only disadvantage of using tagged templates is need for escaping
backticks (`` ` `` => `` \` ``) and interpolation (`${` => `\${`).
Otherwise, you can put there anything without worring about escaping.

## Flags

After the `cre` tag, you can specify one or more flags.
The flags and tag are separated with a dot `.`.
The *CRE* flags and RegExp flags are not the same.
For example:

```javascript
let items = input.split(cre.ignoreCase.unicode`"and"`);
```

Flag name | RegExp<br/>equivalent | Description
----|----|----
`indices` | [`d`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/hasIndices) | Generate indices.
`first` | opposite of [`g`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/global) | *CRE* does global search by default. This flag disables global search.
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

```javascript
let match = input.match(cre.cache`repeat digit`);
```

If high performance is your goal, better solution would be to put the expression
in a variable just once and reuse it, for example in global `const`.

> [!WARNING]
> Be careful with the interpolation and cache. If interpolated values are
> changing, cache will keep regular expression for each value. Frequently changing
> values may lead to memory leaks.

## Literal

The basic node in *CRE* is a string literal.
It simply matches the string.

Its syntax is the same as JavaScript string literals with one exception.
You have to escape backticks `` ` `` and interpolation begin sequence `${`.

For example:

```javascript
let containsWarning = cre.ignoreCase`"warning"`.test(input);
let numberOfLines = input.match(cre`"\n"`).length + 1;
let hasBacktick = cre`"\`"`.test(input);
```

## Single character literals

You can use some single character literals instead of placing them in a string.

Value | Keyword and aliases
------|--------------------
`\n`  | `new-line`, `nl`, `\n`, `line-feed`, `lf`
`\r`  | `carriage-return`, `cr`, `\r`
`\t`  | `tabulation`, `tab`, `\t`
`\0`  | `null`, `nul`, `\0`
` `   | `space`, `sp`
`\xA0`| `nbsp`

## Character class

Character class matches one character in set of characters.

Character class in *CRE* works the same as
[RegExp character class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class) with one exception.
You have to escape backticks `` ` `` and interpolation begin sequence `${`.

For example:

```javascript
let isNotHexString = cre`[^0-9a-fA-F]`.test(input);
```

Complement of character class can also be expressed using `not` keyword.
The example above can be rewritten as follows:

```javascript
let isNotHexString = cre`not [0-9a-fA-F]`.test(input);
```

## Sequence

Literals, character classes, and also other nodes described below can be
put next to each other to provide sequence of matches. For example:

```javascript
let hasGrayInAnyForm = cre`"gr" [ae] "y"`.test(input);
```

## `or` operator

Use `or` operator to specify two or more alternatives.
It takes entire sequence (not just nearest node) on the right and on the left and makes
alternative of them.

The same example as above, but using `or`:

```javascript
let hasGrayInAnyForm = cre`"gray" or "grey"`.test(input);
```

## Parentheses `( )` and braces `{ }`

Parentheses `( )` and braces `{ }` works exactly the same.
They controls the precedence of evaluation.

The same example as above, but with parentheses `( )`:

```javascript
let hasGrayInAnyForm = cre`"gr" ("a" or "e") "y"`.test(input);
```

In theory, you can exchange `( )` and `{ }` however you want,
but for clarity, you should use `( )` to group nodes in single line, and
`{ }` for groups that span multiple lines.

## Keywords

The rest of syntax is constructed with keywords. One keywords is a word, abbreviation, or multiple words joined by `-` sign, for example:
`or`, `at‑most`, `at‑least‑3`, `word‑boundary`.

## Boundary assertion

Checks if the current position is a specific boundary. There are several boundaries:

Keyword | RegExp equivalent | Description | Aliases
--------|-------------------|-------------|--------
`begin‑of‑text` | `^` without `m` flag | Start of input | `start‑of‑text`
`end‑of‑text` | `$` without `m` flag | End of input
`begin‑of‑line` | `^` with `m` flag | Start of line or input | `start‑of‑line`
`end‑of‑line` | `$` with `m` flag | End of line or input
`word‑boundary` | `\b` | Word boundary

For example:

```javascript
let isJPEG = cre.ignoreCase`(".jpeg" or ".jpg") end-of-text`.test(fileName);
```

Boundary assertion can be complemented with the `not` operator, for example:

```javascript
let tabInTheMiddleOfLine = cre`not begin-of-line "\t"`.test(fileName);
```

## Character class keyword

Some character classes can be expressed with the keyword, for example `any` matches
any character.

Keyword | RegExp equivalent | Complement RegExp | Description | Aliases
--------|-------------------|-------------------|-------------|--------
`any` | `.` with `s` flag | `[]` | Matches any character
`digit` | `\d` | `\D` | Digit
`white‑space` | `\s` | `\S` | Whitespace | `whitespace`
`word‑character` | `\w` | `\W` | Word characters (`A` to `Z`, `a` to `z`, `0` to `9`, `_`) | `word‑char`
`line‑terminator` | `[\r\n\u2028\u2029]` | `.` without `s` flag | Character that terminates the line | `line‑term` `terminator` `term`

```javascript
let hasDigit = cre`digit`.test(input);
```

Character class keyword can also be complemented with the `not` operator:

```javascript
let onlyDigits = input.replace(cre`not digit`, '');
```

## Unicode Property

Character class that matches specific unicode property uses `property` (alias `prop`) keyword followed by actual property enclosed in `< >`.

This only works if the `unicode` property is set.

```javascript
let hasNonEnglishLetters = cre`lookahead not [A-Z] prop<Letter>`.test(input);
```

You can also specify unicode properties in character class `[\p{...}]`.

## Quantifiers

Quantifiers tells how many times the following node must match.
Those are equivalents of `?`, `*`, `+`, `{n,m}` in RegExp notation.

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


Those are "greedy" quantifiers. They match as many times as possible
to satisfy the following match. To make it "lazy",
add `lazy‑` or `non‑greedy‑` prefix to the quantifier.

## Named capturing group

The named capturing group looks similar to the labels in JavaScript.
It is a name with colon at the end `name:`.

```javascript
let match = input.match(cre`
    user: at-least-1 [a-zA-Z_.-]
    "@"
    address: at-least-1 [a-zA-Z_.-]
`);
```

## Positional capturing group

> [!NOTE]
> For better readability and maintenance,
> prefer named groups over positional.

The positional capturing group that is identified as a index
is using `group` operator followed by the node that should be captured.

## `not` operator

You can place `not` operator before some atoms to achieve opposite meaning.

Operand | Matching with `not` operator | Examples
--|---|---
Any character class | Complement of the class | `not [abc]`, `not digit`, `not property<Letter>`
One character | Anything other than that character | `not \n`, `not "x"`
Boundary assertion | Negative boundary assertion | `not end‑of‑line`, `not word‑boundary`
Look ahead and look behind assertion | Inverse of that assertion | `not look-ahead "x"`

## Backreference

You can match previously captured string using `match` operator followed by
capturing group name or index enclosed by `< >`.


```javascript
let hasRepeatingWords = cre`
    firstWord: at-least-1 word-char
    at-least-1 not word-char
    match<firstWord>
`.test(input);
```

## Look assertion

This kind of assertion allows you to match given pattern without
consuming anything.

Keyword | Description | Alias
--------|-----|---
`lookahead` | Matches the following atom against text after current position | `look‑ahead`
`lookbehind` | Matches the following atom against text before current position | `look‑behind`

You can add `not` keyword before or after `lookahead` and `lookbehind` keyword
to get Negated assertion.

## Comments

You can use comments inside *CRE*. They are the same as JavaScript's comments,
but you have to remember to escape `` ` `` and `${`
since you are in tagged template.

```javascript
let hasMath = cre`
    /* The following expression will match
     * a simple math with two integers.
     */
    at-least-1 digit   // First integer
    repeat whitespace
    [*/+-]             // Operator
    repeat whitespace
    at-least-1 digit   // Second integer
`.test(input);
```

## Interpolation

Other values and expressions can be added to the *CRE* using interpolation.
There are tree kinds of interpolations: string interpolation, character class interpolation, expression interpolation.

### String interpolation

You can place arbitrary string into the string literal. You don't need to
escape it before using, the *CRE* will handle that for you.

```javascript
function hasVerbInAnyForm(text, verb) {
    return cre.ignoreCase`
        word-boundary
        {
            "${verb}" or "${verb}s" or "${verb}es"
        }
        word-boundary
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

```javascript
function isInteger(text, isHex) {
    const additionalCharacters = isHex ? "abcdef" : "";
    return cre.ignoreCase`
        start-of-text
        at-least-1 [0-9${additionalCharacters}]
        end-of-text
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

```javascript
const number = cre`
    optional [+-]                   // Sign
    {
        at-least-1 digit            // Integral part
        optional ("." repeat digit) // Optional factional part
    or
        "." at-least-1 digit        // Variant with only fractional part
    }
    optional {                      // Optional exponent part
        [eE]
        optional [+-]
        at-least-1 digit
    }
`;

const ws = cre`repeat whitespace`;

function validateJSONArrayOfNumbers(text) {
    return cre.cache.first`
        begin-of-text ${ws}   // Trim leading whitespaces
        "[" ${ws}             // Begin of array
        optional {            // Array can be empty
            repeat {          // Numbers with trailing comma
                ${number} ${ws}
                "," ${ws}
            }
            ${number} ${ws}   // Last number has no comma
        }
        "]" ${ws}
        end-of-text
    `.test(text);
}
```

This is more comprehensive example of *CRE*. Now, you can judge what is
more readable: the above code, or the same function written in pure RegExp:

```javascript
function validateJSONArrayOfNumbers(text) {
    return /^\s*\[\s*(?:(?:[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\s*,\s*)*[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\s*)?\]\s*$/
        .test(text);
}
```

> [!NOTE]
> If it is possible, try to interpolate *CRE* expression instead of strings.
> Use string only when interpolated expression is not a full *CRE* expression.
> For example:


```javascript
function validateWord(text, allowEmpty) {
    let quantifier = allowEmpty ? 'repeat' : 'at-least-1';
    return cre.cache`
        begin-of-text
        ${quantifier} word-character
        end-of-text
    `.test(text);
}
```