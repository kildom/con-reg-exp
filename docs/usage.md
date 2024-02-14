# Usage

## Getting the Convenient Regular Expressions

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

You can add flags after the `cre`, for example:

```javascript
const myRegExp = cre.cache.ignoreCase`... regular expression goes here ...`;
```

You can find more details in the [syntax page](syntax.md).
