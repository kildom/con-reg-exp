
* [<span><span class="material-symbols-outlined">rocket</span></span>Get started](#get-started)
* [<span><span class="material-symbols-outlined">school</span></span>Tutorial](tutorial.html)
* [<span><span class="material-symbols-outlined">menu_book</span></span>Docs](docs.html)
* <a href="https://kildom.github.io/cre-web-demo/" target="cre-web-demo"><span><span class="material-symbols-outlined">lightbulb</span></span>Demo</a>
* [<img src="npm.svg">npm](https://www.npmjs.com/package/con-reg-exp)
* [<img src="github-mark.svg">GitHub](https://github.com/kildom/con-reg-exp/)

# Convenient Regular Expressions

* improve your RegExp.
* organize your RegExp.
* maintain your RegExp.
* review your RegExp.
* express in words your RegExp.
* reuse your RegExp.
* improve your RegExp.

## What are Convenient Regular Expressions?

### Regular expression syntax redefined

The "Convenient Regular Expressions" give an alternative syntax for regular expressions.
The main goal is to introduce a syntax that is easily manageable in complex regular expressions.

### Under the hood

The module is still using a standard JavaScript's [`RegExp`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) object.
Essentially, it is a runtime transpiler that converts "Convenient Regular Expression" into a classic regular expression.

## Why Convenient Regular Expressions?

### You can use whitespaces

Organize your expression structure with spaces, new lines, and indentation.

### You can use comments

A good comment can clarify an expression a lot making it easier to understand later.

### You are using words

The words are significantly more readable than some arbitrarily selected special characters.

### Maintenance is simpler

If you want to make a change in a well-structured expression, you simply do it.
With complex classic regular expressions, first, you have to parse it in your head, track brackets, and groups, and divide it into pieces.

### Code review is faster and more accurate

It is easier to understand well-structured expressions and changes in such expressions.
Have you ever tried to review changes in regular expressions that are longer than 100 characters?

### You can reuse the expressions

You can put pieces of your expression into variables and reuse them multiple times later.
It is like splitting your code into functions.

### You are using sane syntax

Long and complex regular expressions look like some esoteric programming languages created just to make the code unreadable.

## Get started

### Install

```bash
npm install con-reg-exp
```

Or, if you prefer to [download](https://github.com/kildom/con-reg-exp/releases/latest/download/con-reg-exp-browser.zip)
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

### Write your first Convenient Regular Expression

```javascriptwithcre
const inputText = "Hello World!!!";

const pattern = cre.global`
    at-least-1 word-char
`;

const words = inputText.match(pattern);

console.log(words);
```

### Learn more

* [Learn basics with the **tutorial**](tutorial.html)

* [Learn details from the **documentation**](docs.html)

* <a href="https://kildom.github.io/cre-web-demo/" target="cre-web-demo">Experiment with <b>web demo</b></a>

<!--
Copyright © 2024
-->
