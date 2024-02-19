# Tutorial

The tutorial will show you how to setup and use basic functionality of the Convenient Regular Expressions (CRE for short).

We will be using `node.js` (with `npm`), JavaScript and ES modules.
See the ["Installing" section in the documentation](docs.md#installing) for other options.

Before you begin you should know basics of the standard JavaScript's regular expressions (RegExp object).

# Install

Start by creating a new project.

```bash
mkdir cre-tutorial
cd cre-tutorial
npm init
```

Now, install the Convenient Regular Expressions `con-reg-exp` package.

```bash
npm install con-reg-exp
```

# Import

Create a new script file in the project directory and open it in your favorite editor.
Let's call it `tutorial-1.mjs`.
The `.mjs` file extension is recommended since you will be using ES modules.


Use `import` statement to import the `con-reg-exp` module:

```javascript
import cre from "con-reg-exp";
```

The only identifier that you need import is `cre`.
The module does not export anything else, so the above line will never change.

# Your first Convenient Regular Expression

The `cre` identifier is a tag function that you will use in 
[tagged template](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) containing actual expression. The syntax is following:

```javascriptwithcre
const myFirstExp = cre`... expression goes here ...`;
```

As the result, the `myFirstExp` constant will contain a standard
[RegExp object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
created from the expression inside backticks `` `...` ``.

The simplest expression in CRE is a string literal, which looks the same as in JavaScript. We can use it to create an expression matching specific word.

```javascriptwithcre
const myFirstExp = cre`"World"`;
```

Let's use it to do string replacement. The final `tutorial-1.mjs` file will look like this:

```javascriptwithcre
import cre from "con-reg-exp";

const myFirstExp = cre`"World"`;

const input = "Hello World!!!";
const result = input.replace(myFirstExp, "Convenient Regular Expressions");

console.log(result);
```

Now, run it:

```bash
node tutorial-1.mjs
```

The expected output:

```text
Hello Convenient Regular Expressions!!!
```

The `myFirstExp` constant contains the standard regular expression.
To verify what was created from our expression we can print it.
Add the following line at the end of your script:

```javascript
console.log(myFirstExp);
```

Run the script again and the expected output is now:

```text
Hello Convenient Regular Expressions!!!
/World/msu
```

There are some [aliases](docs.md#string-literal-alias) that you can use instead of writing it explicitly in quotes, for example
`` cre`"\n"` `` can be replaced by `` cre`new-line` `` or  `` cre`nl` ``.

# Flags

You may notice in the example above that the CRE added some flags to the RegExp object.
The `m` and `s` flags are controlled automatically by the CRE based on
your expression. You don't need to worry about them.
You can control the remaining flags by specifying them after the `cre` tag.

The flags syntax is following:

```javascript
const pattern = cre.flag1.flag2.flag3`... expression ...`;
```

You can read more about flags in the [documentation](docs.md#flags).
For now, we will use `ignoreCase` flag to allow both upper and lower case
letters in our replacement:

```javascriptwithcre
const myFirstExp = cre.ignoreCase`"world"`;
```

Run the script and the expected output is now:

```text
Hello Convenient Regular Expressions!!!
/world/imsu
```

# Character classes

Another simple expression in the CRE is [character class](docs.md#character-class) that works exactly the same and has the same syntax as standard [RexExp character class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class).

Use it now to remove all the non-english letters from a string.
Add the following line to the end of your script:

```javascriptwithcre
console.log(result.replace(cre.global`[^a-zA-Z]`, ''));
```

Run it and you should see:
```text
Hello Convenient Regular Expressions!!!
/world/imsu
HelloConvenientRegularExpressions
```

You may noticed that we added `global` flag.
It works exactly the same as `g` RegExp flag.

## Character class keywords

You can use keywords that defines a character class.
You can find more details in the [documentation](docs.md#character-class-keyword), but for now we just use `whitespace`.

We will replace all the whitespace characters with underscore.
Add it to the end of the script.

```javascriptwithcre
console.log(result.replace(cre.global`whitespace`, '_'));
```

The last line of output is now:

```text
...
Hello_Convenient_Regular_Expressions!!!
```

Now, let's do something opposite.
Replace all non-whitespace characters with a question mark.
Add the following to the script:

```javascriptwithcre
console.log(result.replace(cre.global`not whitespace`, '?'));
```

Now, output ends with:

```text
...
Hello_Convenient_Regular_Expressions!!!
????? ?????????? ??????? ??????????????
```

We used here `not` operator.
This operator can be added before different kinds of expressions
to negate its meaning.
In this case, we got complement of a character class.
It can be applied to any character class, for example: `` cre`not [a-z]` `` is equivalent of `` cre`[^a-z]` ``.

# Combine the expressions

We want to combine our knowledge in one expression.
Create an expression that replaces both `gray` and `grey` words with
some other word.

Start again with a new script called `tutorial-2.mjs`:

```javascriptwithcre
import cre from "con-reg-exp";

const mySecondExp = cre.global`"gr", [ae], "y"`;

const input = "The Englishman's hair is grey. The American's hair is gray.";
const result = input.replace(mySecondExp, "white");

console.log(result);
console.log(mySecondExp);
```

Now, run it:

```bash
node tutorial-2.mjs
```

And, the expected output is:

```text
The Englishman's hair is white. The American's hair is white.
/gr[ae]y/gmsu
```

Now, look at our expression:

```javascriptwithcre
const mySecondExp = cre.global`"gr", [ae], "y"`;
```

We have `"gr"` string literal, `[ae]` character class, and `"y"` string literal.
As you can see, the expressions are separated with the comma `,`.
You can also use semicolon `;` which is recommended for multiline
expressions, so give it a try and rewrite the expression in multiline form:

```javascriptwithcre
const mySecondExp = cre.global`
    "gr";
    [ae];
    "y";
`;
```

Run it again and you should see exactly the same output.

There is one additional separator at the end of the expression.
It is redundant, but it should be there for consistency.
The redundant separators are ignored.

This example looks better in single-line form, but when expression grows
it is much better to use multiple lines.

## Operator `or`

The `or` operator is equivalent to `|` in standard RegExp.

We can rewrite previous expression to use `or` instead of character class.

```javascriptwithcre
const mySecondExp = cre.global`"gray" or "grey"`;
```

Run it and you will get:

```text
The Englishman's hair is white. The American's hair is white.
/gray|grey/gmsu
```

We apply or operator on entire words in the expression above.
Now, try to apply `or` only to letters are different.

```javascriptwithcre
const mySecondExp = cre.global`"gr", "a" or "e", "y"`;
```

The output is now:

```text
The Englishman's hair is white. The American's hair is white.
/gr(?:a|e)y/gmsu
```

Looking at the expression you may notice that `or` operator has higher precedence than comma.
The `or` operator was first applied to `"a"` and `"e"`, then it is separated by commas. That is why output RegExp contains group `(?:a|e)`.

## Grouping

Now, we will add `silver` word to our expression.
Additionally, we need to extend our sample string.

```javascriptwithcre
import cre from "con-reg-exp";

const mySecondExp = cre.global`("gr", "a" or "e", "y") or "silver"`;

const input = `The Englishman's hair is grey
    The American's hair is gray.
    Some other guy has silver hair.`;
const result = input.replace(mySecondExp, "white");

console.log(result);
console.log(mySecondExp);
```

Run the script and you will see:

```text
The Englishman's hair is white
    The American's hair is white.
    Some other guy has white hair.
/gr(?:a|e)y|silver/gmsu
```

Have a look at our expression now:

```javascriptwithcre
const mySecondExp = cre.global`("gr", "a" or "e", "y") or "silver"`;
```

We surrounded the expression responsible for `gray` and `grey`
with the parentheses `( ... )` before adding `or "silver"`.
If we would miss the parentheses, the `or` operator will apply to the `"y"` literal only.

You can also use the braces `{ ... }`, but those are recommended for
groups that span multiple lines.
We can rewrite the expression for multiple lines:

```javascriptwithcre
const mySecondExp = cre.global`
    {
        "gr", "a" or "e", "y";
    } or {
        "silver";
    }
`;
```

The braces around `"silver"` are not required, but using them will make the expression more readable.

# Comments

The comments in code are important.
They helps to understand the code.
This is especially important when the code is not self-explanatory.
This great feature is not available in the standard RegExp, but
Convenient Regular Expression allows them.

The comments works exactly the same as in JavaScript. Use `//` or `/* */`.

Add some comments to our last expression. The expression is so simple that the comments are not needed, but let's do it anyway.

```javascriptwithcre
const mySecondExp = cre.global`
    /*
     * The expression matches "silver" and "gray" in both forms.
     */
    {
        "gr", "a" or "e", "y"; // The "gray" or "grey" word.
    } or {
        "silver"; // The "silver" word.
    }
`;
```

As expected, you should get the same output if you run the script with the changes above.

# Quantifiers

[Quantifiers](docs.md#quantifiers) tell how many times the following expression should be matched.

Start with the `optional` quantifier (`?` in the standard RegExp).
We will now split lines.
The input can have either Windows or UNIX line endings, which is
`\r\n` or `\n`. The `\n` character is always present, but the `\r` character is optional.


Create a new `tutorial-3.mjs` file for this:

```javascriptwithcre
import cre from "con-reg-exp";

const splitPattern = cre`optional \r, \n`;

const input = `
    Two households, both alike in dignity,
    In fair Verona, where we lay our scene,
    From ancient grudge break to new mutiny,
    Where civil blood makes civil hands unclean.
`;
const result = input.split(splitPattern);

console.log(result);
console.log(splitPattern);
```

The output is:
```text
[
  '',
  '    Two households, both alike in dignity,',
  '    In fair Verona, where we lay our scene,',
  '    From ancient grudge break to new mutiny,',
  '    Where civil blood makes civil hands unclean.',
  ''
]
/\r?\n/msu
```

The `repeat` quantifier (`*` in the standard RegExp) matches any number of times.

We will divide our text using both new lines and commas, but we want to get rid of all the spaces around the separator.


```javascriptwithcre
const splitPattern = cre`
    repeat space;
    (optional \r, \n) or ",";
    repeat space;
`;
```

```[
  '',
  'Two households',
  'both alike in dignity',
  '',
  'In fair Verona',
  'where we lay our scene',
  '',
  'From ancient grudge break to new mutiny',
  '',
  'Where civil blood makes civil hands unclean.',
  ''
]
/ *(?:\r?\n|,) */msu
```

We can see empty strings when comma and new line are next to each other.
We will handle by repeating the expression at least once.

```javascriptwithcre
const splitPattern = cre`
    at-least-1 {
        repeat space;
        (optional \r, \n) or ",";
        repeat space;
    }
`;
```

The previous expression was surrounded by braces and after that
`at-least-1` quantifier was applied to the entire group.
You can put any number after the `at-least-` quantifier.

Have a look if this modification does what we wanted:

```text
[
  '',
  'Two households',
  'both alike in dignity',
  'In fair Verona',
  'where we lay our scene',
  'From ancient grudge break to new mutiny',
  'Where civil blood makes civil hands unclean.',
  ''
]
/(?: *(?:\r?\n|,) *)+/msu
```

There are a few other quantifiers, but since you already know general concept, we will not go into details. Those are the quantifiers:

* `at-most-5` matches from zero to five times.

    For example, `` cre`begin-of-line, "#", at-most-5 "#", whitespace``
    will match beginning of markdown headings.

* `1-to-6-times` matches from one to six times.

    For example, `` cre`begin-of-line, 1-to-6-times "#", whitespace``
    will match beginning of markdown headings, so it is exactly the same as above.

* `3-times` matches exactly three times.

    For example, `` cre`begin-of-line, 3-times "#", whitespace``
    will match beginning of markdown heading level 3.

I used `begin-of-line` assertion in the examples above.
You probably guessing what this is, but more about assertions later.

## Lazy Quantifiers

Create yet another script called `tutorial-4.mjs`.
We will try to extract any quotations from input text.

```javascriptwithcre
import cre from "con-reg-exp";

const quotesExtract = cre.global`["], repeat any, ["]`;

const input = `
    "Gregory, o' my word, we'll not carry coals." said Sampson.
    "No, for then we should be colliers." replied Gregory.
`;
const result = input.match(quotesExtract);

console.log([...result]);
console.log(quotesExtract);
```

We used character class here to match quotation mark `["]`,
because it is simpler than `"\""`.
It will translate into the same regular expression anyway.

The second interesting part is `any` character class.
It always matches any character.
It is an improvement over standard RegExp where `.` character depends on flags and you had to keep in mind the flags when reading the expression.

Run it and see the output:

```text
[
  `"Gregory, o' my word, we'll not carry coals." said Sampson.\n` +
    '    "No, for then we should be colliers."'
]
/".*"/gmsu
```

That's not what we wanted. We are expecting two strings in the array.
This happens because `repeat` quantifier is greedy and it will consume
as much as possible. We need to use "lazy" quantifier instead.

To make quantifier "lazy" add `lazy-` prefix to it.
Our expression is now:

```javascriptwithcre
const quotesExtract = cre.global`["], lazy-repeat any, ["]`;
```

The output is correct now:
```text
[
  `"Gregory, o' my word, we'll not carry coals."`,
  '"No, for then we should be colliers."'
]
/".*?"/gmsu
```

The `lazy-` prefix can be applied to any quantifier,
but it does not make sense for exact quantifier (`lazy-N-times`).

# Capturing

We can see quote characters in the output above.
Let's improve it by extracting only inner part of the quote.

We can do it with named capturing group.
The syntax is similar to JavaScript's label.

```javascriptwithcre
const quotesExtract = cre.global`
    ["];
    quotation: lazy-repeat any;
    ["];
`;
```

The `quotation:` applies to the following expression.
In this case all the characters inside the quote.

To see the groups, we need to modify the script a little bit more:

```javascriptwithcre
import cre from "con-reg-exp";

const quotesExtract = cre.global`
    ["];
    quotation: lazy-repeat any;
    ["];
`;

const input = `
    "Gregory, o' my word, we'll not carry coals." said Sampson.
    "No, for then we should be colliers." replied Gregory.
`;
const result = input.matchAll(quotesExtract);

console.log([...result].map(m => m.groups.quotation));
console.log(quotesExtract);

```

And see the result:

```text
[
  "Gregory, o' my word, we'll not carry coals.",
  'No, for then we should be colliers.'
]
/"(?<quotation>.*?)"/gimsu
```

Now, extract also first word from the quote.

```javascriptwithcre
const quotesExtract = cre.global`
    ["];
    quotation: {
        firstWord: repeat word-char;
        lazy-repeat any;
    }
    ["];
`;
```

The expression in `quotation:` capturing group become more complex,
so it is now surrounded with braces.
The `word-char` is a character class that is equivalent to `\w` in standard RegExp.

We need to adjust the output to see all the groups:

```javascriptwithcre
console.log([...result].map(m => m.groups));
```

And finally we will get:

```text
[
  [Object: null prototype] {
    quotation: "Gregory, o' my word, we'll not carry coals.",
    firstWord: 'Gregory'
  },
  [Object: null prototype] {
    quotation: 'No, for then we should be colliers.',
    firstWord: 'No'
  }
]
/"(?<quotation>(?<firstWord>\w*).*?)"/gmsu
```

// TODO: The following is not implemented yet

Positional capturing group uses integer as a name.
As usual in regular expressions, it starts with `1`.
Zero is reserved for entire match. The CRE will
check if capturing groups are correctly numbered.

// TODO: Example with replace the string

When to use named and when positional capturing groups?
* If you can access groups by its name, prefer named capturing groups
  since it will make your code more readable and immune to mistakes.
  For example `match`, `exec` functions.
* If you cannot access groups by its name and you are using positions,
  prefer positional capturing groups since CRE will check if you
  ordered them correctly.

// TODO: Explain how to pass groups to replacement function.

// TODO: Backreference

# Assertion

The assertions does not consume any characters from the input,
but instead asserts that specific conditions are met.

## Boundary

There are five boundary assertions: `begin-of-text`, `end-of-text`, `begin-of-line`, `end-of-line`, `word-boundary`.
Unlike standard regular expressions, their meaning is not changing
depending on the flags.

// TODO: Simpler example at the beginning.

Line boundary assertions follows the JavaScript rules for `^` and `$`
with `m` flag enabled. This means that both `\r` and `\n` are
interpreted as separate line endings.
You must keep it in mind for Windows line endings `\r\n`.

// TODO: Reconsider adding something like universal-begin-of-line for better Windows line endings.

Now, we will make a script that prints a HTML containing the input
string with annotations `w`, `bol`, `eol`, `bot`, `eot` for word, line, and text boundaries.
Create script called `tutorial-5.mjs`.

```javascriptwithcre
import cre from "con-reg-exp";

const input = `
Two households, both alike in dignity,
In fair Verona, where we lay our scene,
From ancient grudge break to new mutiny,
Where civil blood makes civil hands unclean.
`;

const boundaries = cre.global`
    bot: begin-of-text
    or eot: end-of-text
    or bol: begin-of-line
    or eol: end-of-line
    or word: word-boundary;
`;

const result = input.replace(boundaries, (_, bot, eot, bol, eol, word) => {
    if (bot !== undefined) return '<sub>bot</sub>';
    if (eot !== undefined) return '<sub>eot</sub>';
    if (bol !== undefined) return '<sub>bol</sub>';
    if (eol !== undefined) return '<sub>eol</sub>';
    if (word !== undefined) return '<sub>w</sub>';
});

console.log(`<pre>${result}</pre>`);
console.log(`<pre>${boundaries.toString().replace(/</g, "&lt;")}</pre>`);
```

The expression is actually pretty simple.
It matches all possible boundaries and assigns them a capturing group name.

The replacement function returns HTML `<sub>` element containing
type of boundary.
The expression contains only assertions, so it will not consume any
characters.

Run it redirecting output to an HTML file:

```bash
node tutorial-5.mjs > tutorial-5.html
```

When you open the HTML file you should see something like that:

<pre><sub>bot</sub>
<sub>bol</sub>Two<sub>w</sub> <sub>w</sub>households<sub>w</sub>, <sub>w</sub>both<sub>w</sub> <sub>w</sub>alike<sub>w</sub> <sub>w</sub>in<sub>w</sub> <sub>w</sub>dignity<sub>w</sub>,<sub>eol</sub>
<sub>bol</sub>In<sub>w</sub> <sub>w</sub>fair<sub>w</sub> <sub>w</sub>Verona<sub>w</sub>, <sub>w</sub>where<sub>w</sub> <sub>w</sub>we<sub>w</sub> <sub>w</sub>lay<sub>w</sub> <sub>w</sub>our<sub>w</sub> <sub>w</sub>scene<sub>w</sub>,<sub>eol</sub>
<sub>bol</sub>From<sub>w</sub> <sub>w</sub>ancient<sub>w</sub> <sub>w</sub>grudge<sub>w</sub> <sub>w</sub>break<sub>w</sub> <sub>w</sub>to<sub>w</sub> <sub>w</sub>new<sub>w</sub> <sub>w</sub>mutiny<sub>w</sub>,<sub>eol</sub>
<sub>bol</sub>Where<sub>w</sub> <sub>w</sub>civil<sub>w</sub> <sub>w</sub>blood<sub>w</sub> <sub>w</sub>makes<sub>w</sub> <sub>w</sub>civil<sub>w</sub> <sub>w</sub>hands<sub>w</sub> <sub>w</sub>unclean<sub>w</sub>.<sub>eol</sub>
<sub>eot</sub></pre>

If you look closely, you may notice that something is wrong with the annotations that we generated.
We have at most one annotation in one place, but we should have more.
For example, in the same place where each `bol` is,
we should also see `w` annotation.

This is because the `or` operator selects only one matching part.

Since the assertion does not consume characters, we can use it multiple times. We can separate them with semicolons:

```cre
bot: begin-of-text;
eot: end-of-text;
bol: begin-of-line;
eol: end-of-line;
word: word-boundary;
```

The problem is that each of assertions must be fulfilled.
We can help with the `not` operator mentioned before.
It also works for assertions.
With it, we can ensure that each line contains expression that is always fulfilled.

```cre
(bot: begin-of-text) or (not begin-of-text);
(eot: end-of-text) or (not end-of-text);
(bol: begin-of-line) or (not begin-of-line);
(eol: end-of-line) or (not end-of-line);
(word: word-boundary) or (not word-boundary);
```

Each line contains two mutually exclusive expressions.
One of them contains capturing group.

The parenthesis are not required here since the `or` operator has lower precedence than capturing, but with it, the expression is easier to understand.

We are almost there. There is still one issue to solve.
Since expressions in each line is always matching,
the entire expression is also always matching, so the replacement
function will be called every character. We can add one more
line to ensure that entire expression will match exactly in boundary
assertions.

```cre
begin-of-line or end-of-line or word-boundary;
```

The above line will match any of the boundary assertions.
There is no `begin‑of‑text` and `end‑of‑text` because
`begin‑of‑line` is also matching the `begin‑of‑text` and
`end‑of‑line` is also matching the `end‑of‑text`.

The final script is:

```javascriptwithcre
import cre from "con-reg-exp";

const input = `
Two households, both alike in dignity,
In fair Verona, where we lay our scene,
From ancient grudge break to new mutiny,
Where civil blood makes civil hands unclean.
`;

const boundaries = cre.global`
    (bot: begin-of-text) or (not begin-of-text);
    (eot: end-of-text) or (not end-of-text);
    (bol: begin-of-line) or (not begin-of-line);
    (eol: end-of-line) or (not end-of-line);
    (word: word-boundary) or (not word-boundary);
    begin-of-line or end-of-line or word-boundary;
`;

const result = input.replace(boundaries, (_, bot, eot, bol, eol, word) => {
    let result = [];
    if (bot !== undefined) result.push("bot");
    if (bol !== undefined) result.push("bol");
    if (word !== undefined) result.push("w");
    if (eol !== undefined) result.push("eol");
    if (eot !== undefined) result.push("eot");
    return `<sub>${result.join("+")}</sub>`;
});

console.log(`<pre>${result}</pre>`);
console.log(`<pre>${boundaries.toString().replace(/</g, "&lt;")}</pre>`);
```

Run it again:

```bash
node tutorial-5.mjs > tutorial-5.html
```

The resulting HTML is now:

<pre><sub>bot+bol+eol</sub>
<sub>bol+w</sub>Two<sub>w</sub> <sub>w</sub>households<sub>w</sub>, <sub>w</sub>both<sub>w</sub> <sub>w</sub>alike<sub>w</sub> <sub>w</sub>in<sub>w</sub> <sub>w</sub>dignity<sub>w</sub>,<sub>eol</sub>
<sub>bol+w</sub>In<sub>w</sub> <sub>w</sub>fair<sub>w</sub> <sub>w</sub>Verona<sub>w</sub>, <sub>w</sub>where<sub>w</sub> <sub>w</sub>we<sub>w</sub> <sub>w</sub>lay<sub>w</sub> <sub>w</sub>our<sub>w</sub> <sub>w</sub>scene<sub>w</sub>,<sub>eol</sub>
<sub>bol+w</sub>From<sub>w</sub> <sub>w</sub>ancient<sub>w</sub> <sub>w</sub>grudge<sub>w</sub> <sub>w</sub>break<sub>w</sub> <sub>w</sub>to<sub>w</sub> <sub>w</sub>new<sub>w</sub> <sub>w</sub>mutiny<sub>w</sub>,<sub>eol</sub>
<sub>bol+w</sub>Where<sub>w</sub> <sub>w</sub>civil<sub>w</sub> <sub>w</sub>blood<sub>w</sub> <sub>w</sub>makes<sub>w</sub> <sub>w</sub>civil<sub>w</sub> <sub>w</sub>hands<sub>w</sub> <sub>w</sub>unclean<sub>w</sub>.<sub>eol</sub>
<sub>bol+eol+eot</sub></pre>

The text contains all the annotation describing boundary assertions.


## Lookahead and lookbehind

// TODO: Lookahead and lookbehind

# Interpolation

// TODO: Interpolation

# Unicode

// TODO: Unicode
