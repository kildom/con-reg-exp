
# Verbose Regular Expressions Overview

This document explains how to use the **Verbose Regular Expressions** (VRE in short).

The examples shown here are kept simple.
Looking at them, you may not see benefits of VRE,
but true potential of VRE is really visible with longer and complex expressions.

## Embedding into JavaScript

The VRE are written using the
[tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates).
A tag name is **`vre`**. The VRE tagged template returns `RegExp` object.

```javascript
let match = input.match(vre`repeat digit`);
```

The equivalent code using RegExp would be:

```javascript
let match = input.match(/\d*/gms);
```

Only disadvantage of using tagged templates is need for escaping
backticks (`` ` `` => `` \` ``) and interpolation (`${` => `\${`).
Otherwise, you can put there anything without worring about escaping.

## Flags

The VRE starts with the flags. Flags are enclosed in `<` and `>`.
The VRE flags and RegExp flags are not all the same. For example:

```javascript
let items = input.split(vre`<IGNORE-CASE> "and"`);
```

Flag name | RegExp equivalent | Description
----|----|----
`<INDICES>` | [`d`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/hasIndices) | Generate indices.
`<FIRST>` | opposite of [`g`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/global) | VRE does global search by default. This flag disables global search.
`<IGNORE-CASE>` | [`i`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/ignoreCase) | Case-insensitive. Alias: `<CASE-INSENSITIVE>`.
`<UNICODE>` | [`u`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicode) | Unicode code points.
`<STICKY>` | [`y`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky) | Sticky search.
`<CACHE>` | | Use VRE cache, see below.

The flag names are case-insensitive, but it's better to use uppercase,
since they are significantly affecting the rest of the expression.

You may notice that some RegExp flags are not listed above.
The `m` and `s` flags are handled automatically by the VRE and you don't need to know
about their status. The `v` flag is not implemented yet.

## Cache

The regular expression can be cached, so once it get translated
into RegExp, the VRE will return copy of same object for the same
input string and interpolated values. It is done using `<CACHE>` flag that must be the
first flag in the expression, for example:

```javascript
let match = input.match(vre`<CACHE> repeat digit`);
```

If high performance is your goal, better solution would be to put the expression
in a variable just once and reuse it, for example in global `const`.

> [!WARNING]
> Be careful with the interpolation and cache. If interpolated values are
> changing, cache will keep regular expression for each value. Frequently changing
> values may lead to memory leaks.

## Literal

The basic node in VRE is a string literal.
It simply matches the string.

Its syntax is the same as JavaScript string literals with one exception.
You have to escape backticks `` ` `` and interpolation begin sequence `${`.

For example:

```javascript
let containsWarning = vre`<IGNORE-CASE> "warning"`.test(input);
let numberOfLines = input.match(vre`"\n"`).length + 1;
let hasBacktick = vre`"\`"`.test(input);
```

## Character class

Character class matches one character in set of characters.

Character class in VRE works the same as
[RegExp character class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class) with one exception.
You have to escape backticks `` ` `` and interpolation begin sequence `${`.

For example:

```javascript
let isNotHexString = vre`[^0-9a-fA-F]`.test(input);
```

Complement of character class can also be expressed using `not` keyword.
The example above can be rewritten as follows:

```javascript
let isNotHexString = vre`not [0-9a-fA-F]`.test(input);
```

## Sequence

Literals, character classes, and also other nodes described below can be
put next to each other to provide sequence of matches. For example:

```javascript
let hasGrayInAnyForm = vre`"gr" [ae] "y"`.test(input);
```

## `or` operator

Use `or` operator to specify two or more alternatives.
It takes entire sequence (not just nearest node) on the right and on the left and makes
alternative of them.

The same example as above, but using `or`:

```javascript
let hasGrayInAnyForm = vre`"gray" or "grey"`.test(input);
```

## Parentheses `( )` and braces `{ }`

Parentheses `( )` and braces `{ }` works exactly the same.
They controls the precedence of evaluation.

The same example as above, but with parentheses `( )`:

```javascript
let hasGrayInAnyForm = vre`"gr" ("a" or "e") "y"`.test(input);
```

In theory, you can exchange `( )` and `{ }` however you want,
but for clarity, you should use `( )` to group nodes in single line, and
`{ }` for groups that span multiple lines.

## Keywords

The rest of syntax is constructed with keywords. One keywords is a word, abbreviation, or multiple words joined by `-` sign, for example:
`or`, `at-most`, `at-least-3`, `word-boundary`.

## Boundary assertion

Checks if the current position is a specific boundary. There are several boundaries:

Keyword | RegExp equivalent | Description | Aliases
--------|-------------------|-------------|--------
`begin-of-text` | `^` without `m` flag | Start of input | `start-of-text`
`end-of-text` | `$` without `m` flag | End of input
`begin-of-line` | `^` with `m` flag | Start of line or input | `start-of-line`
`end-of-line` | `$` with `m` flag | End of line or input
`word-boundary` | `\b` | Word boundary

For example:

```javascript
let isJPEG = vre`<IGNORE-CASE> (".jpeg" or ".jpg") end-of-text`.test(fileName);
```

Boundary assertion can be complemented with the `not` operator, for example:

```javascript
let tabInTheMiddleOfLine = vre`not begin-of-line "\t"`.test(fileName);
```

## Character class keyword

Some character classes can be expressed with the keyword, for example `any` matches
any character.

Keyword | RegExp equivalent | Complement RegExp | Description | Aliases
--------|-------------------|-------------------|-------------|--------
`any` | `.` with `s` flag | `[]` | Matches any character
`digit` | `\d` | `\D` | Digit
`white-space` | `\s` | `\S` | Whitespace | `whitespace`
`word-character` | `\w` | `\W` | Word characters (`A` to `Z`, `a` to `z`, `0` to `9`, `_`) | `word-char`
`line-terminator` | `[\r\n\u2028\u2029]` | `.` without `s` flag | Character that terminates the line | `line-term` `terminator` `term`

```javascript
let hasDigit = vre`digit`.test(input);
```

Character class keyword can also be complemented with the `not` operator:

```javascript
let onlyDigits = input.replace(vre`not digit`, '');
```

## Quantifiers

Quantifiers tells how many times the following node must match.
Those are equivalents of `?`, `*`, `+`, `{n,m}` in RegExp notation.

Keyword | RegExp equivalent | Minimum | Maximum |
--------|-------------------|---------|----------
`optional`     | `?`     | 0 | 1
`at-least-1`   | `+`     | 1 | ∞
`at-least-N`   | `{N,}`  | N | ∞
`at-most-N`    | `{0,N}` | 0 | N
`repeat`       | `*`     | 1 | ∞
`N-times`      | `{N}`   | N | N
`N-to-M-times` | `{N,M}` | N | M


Those are "greedy" quantifiers. They match as many times as possible
to satisfy the following match. To make it "lazy",
add `lazy-` or `non-greedy-` prefix to the quantifier.

## Named capturing group

The named capturing group looks similar to the labels in JavaScript.
It is a name with colon at the end `name:`.

```javascript
let match = input.match(vre`
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
