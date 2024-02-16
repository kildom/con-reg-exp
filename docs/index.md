
* [<span><span class="material-symbols-outlined">school</span></span>Get started](#get-started)
* [<span><span class="material-symbols-outlined">menu_book</span></span>Docs](docs.html)
* [<span><span class="material-symbols-outlined">lightbulb</span></span>Demo](demo.html)
* [<img src="npm.svg">npm](https://www.npmjs.com/package/con-reg-exp)
* [<img src="github-mark.svg">GitHub](https://github.com/kildom/con-reg-exp/)

# Convenient Regular Expressions

* improve your RegExp.
* organize your RegExp.
* maintain your RegExp.
* review your RegExp.
* express in words your RegExp.
* reuse your RegExp.
* clear your RegExp.
* improve your RegExp.

## What is Convenient Regular Expression?

### Regular expression syntax redefined

The "Convenient Regular Expression" gives a different approach to
a regular expressions syntax. The main goal is to provide
a syntax that is more manageable in complex regular expressions.
It looks more like actual program source code with clearly
visible structure, comments, and meaning.

### Under the hood

Under the hood, the module is still using a standard JavaScript's `RegExp`
object, so it is basically a runtime transpiler that converts
"Convenient Regular Expression" into standard regular expression.

## Why Convenient Regular Expressions?

### You can add whitespaces

This allows you to organize with spaces, new lines and indentation.

### You can add comments

When a pice of code is not self-explanatory, a good comment makes a huge difference.

### You are using words

The words that describe the regular expression, are significantly more readable. It is easier to memorize words which means something than some arbitrarily selected special characters.

### Maintenance is simpler

If you want to make a change in a well structured code, you simply do it. With regular expression, you have to parse it your head, track brackets, groups, and divide it into pieces.

### Code review is faster and more accurate

It easier to understand well formatted convenient code and changes that are happening there. Have you ever try to review changes in regular expression that are longer than 100 characters? What was the felling?

### You can reuse code

You can put pieces of your expression into variables and simply insert them into you expression. This is like splitting your code into functions.

### You can forget about double meaning

Some flags are automatically taken care. For example, you don't need to think if dot character includes new lines or not.

### You are using sain language

Long regular expressions looks like those esoteric programming languages created just to give you a headache.

## Get started

### Install

```bash
npm install con-reg-exp
```

Or, if you prefer to [download](https://github.com/kildom/con-reg-exp/releases/latest/download/con-reg-exp.browser.zip)
and use in an HTML tag:

```html
<script src="con-reg-exp.min.js"></script>
```

### Import module

```javascriptwithcre
import cre from "con-reg-exp";
```

Or, if you are using CommonJS:

```javascriptwithcre
const cre = require("con-reg-exp");
```

If you are using an HTML tag, the `cre` symbol is globally available and you don't need to import anything.

### Write your first Convenient Regular Expressions

```javascriptwithcre
const inputText = "Hello World!!!";

const pattern = cre.global`
    at-least-1 word-char
`;

const words = inputText.match(pattern);

console.log(...words);
```

### Learn more

* [Learn basics with the tutorial](tutorial.html)

* [Learn details from the documentation](docs.html)

* [Experiment with web demo](demo.html)

<!--
Copyright © 2024
-->
