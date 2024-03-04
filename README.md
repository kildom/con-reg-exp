# Convenient Regular Expressions

〚 [Web Page](https://kildom.github.io/con-reg-exp/) 〛&nbsp;
〚 [Tutorial](https://kildom.github.io/con-reg-exp/tutorial.html) 〛&nbsp;
〚 [Docs](https://kildom.github.io/con-reg-exp/docs.html) 〛&nbsp;
〚 [Web Demo](https://kildom.github.io/cre-web-demo/) 〛&nbsp;

> [!WARNING]
> This is a project in an early stage of development.
> The main functionality is done.
> More work is needed especially in the context of documentation and tests.

## Regular expression syntax redefined

The "Convenient Regular Expressions" give an alternative syntax for regular expressions.
The main goal is to introduce a syntax that is easily manageable in complex regular expressions.

The module is still using a standard JavaScript's [`RegExp`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) object.
Essentially, it is a runtime transpiler that converts "Convenient Regular Expression" into a classic regular expression.

## Usage

1. Install with `npm`:

    ```
    npm install con-reg-exp
    ```

2. Import it:

    ```javascript
    import cre from "con-reg-exp";
    ```

3. Use it as a tagged template:

    ```javascript
    const myRegExp = cre`"Write your expression here."`;
    ```

You can find more details on usage in [the documentation](https://kildom.github.io/con-reg-exp/docs.html).

If you want to start using it, go to the [tutorial](https://kildom.github.io/con-reg-exp/tutorial.html).

## Benefits

* **You can use whitespaces**

  Organize your expression structure with spaces, new lines, and indentation.

* **You can use comments**

  A good comment can clarify an expression a lot making it easier to understand later.

* **You are using words**

  The words are significantly more readable than some arbitrarily selected special characters.

* **Maintenance is simpler**

  If you want to make a change in a well-structured expression, you simply do it.
  With complex classic regular expressions, first, you have to parse it in your head, track brackets, and groups, and divide it into pieces.

* **Code review is faster and more accurate**

  It is easier to understand well-structured expressions and changes in such expressions.
  Have you ever tried to review changes in regular expressions that are longer than 100 characters?

* **You can reuse the expressions**

  You can put pieces of your expression into variables and reuse them multiple times later.
  It is like splitting your code into functions.

* **You are using sane syntax**

  Long and complex regular expressions look like some esoteric programming languages created just to make the code unreadable.

## Some example

Let's play a game. You have two functions. Try to understand what
they are doing.

Classic RegExp implementation:

```javascript
const pattern = /^\s*\[\s*(?:(?:-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?\s*,\s*)*-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?\s*)?\]\s*$/;

function guessWhatDoesThisFunctionDo(text) {
    return pattern.test(text);
}
```

Convenient Regular Expressions:

```javascript
import cre from "con-reg-exp";

const number = cre`
    optional "-";               // Sign
    {                           // Integral part
        "0";                    // Zero is special case
    } or {
        [1-9], repeat digit;    // Everything above zero
    }
    optional {                  // Optional factional part
        ".";
        at-least-1 digit;
    }
    optional {                  // Optional exponent part
        [eE];
        optional [+-];
        at-least-1 digit;
    }
`;

const ws = cre`repeat whitespace`;

const pattern = cre`
    begin-of-text, ${ws};      // Trim leading whitespaces
    "[", ${ws};                // Begin of array
    optional {                 // Optional, because array can be empty
        repeat {               // Numbers with trailing comma
            ${number}, ${ws};
            ",", ${ws};
        }
        ${number}, ${ws};      // Last number has no comma
    }
    "]", ${ws};                // End of array
    end-of-text;
`;

function guessWhatDoesThisFunctionDo(text) {
    return pattern.test(text);
}
```

Which one was easier to understand? I'm assuming that you don't know
the convenient regular expressions [syntax](https://kildom.github.io/con-reg-exp/docs.html#syntax) yet. Were you able to guess
despite this?

Click the link to see [the answer](https://kildom.github.io/cre-web-demo/#1nVZRa9swEN6zf4UQAxOqGNt52sr2sOGHwVgf1r1MNsxN1NSjVoqVpnQl/33fSZYtp1lGa0iwpbvvdPfdnU7ft3O4UT8m7W/zBklkC5tRI2B2nfIdQleqM1F0OhOiCPoo+p3SjdJbahsIR8fQOzplDMISRa4cHWCfERHl+MAsn/Pz5zX+HUli5Z5O94Iv6DjrDjDoXFurQA9Pn2F6hZ+q27DGgCi1bKBHJW71XEUOEDKbv6uET5ieSgdR7FT3iFrXa1ZfbXaK/QGmw5i6duTsUL/w29fg3b1ND5/w8+EjyFR3hlfYAVcbTfxMzEhVVKOdAUuezYPlf5n/Be4dsw+mZ7WP1Jjgo4zNq4vrby6rwiyYlLVAgj6Yfc8cPLjsmpbB/opCPQIbq8olnypMnP9EwJTK1vb/whVES+BMy/oe3dpVw7LWWGGqvds6GHp6Xw+BAON9xCVyg0uiblDUa4b7sK0HbXrePrmS2HsfJrtcDL4N647zo7qD9a+gytfaTW3QyQLTDoBXp8JWoHNMghY2Wss6hH4Y9EDHrb9448/uxl+9h8FjlMfiYGkcB2YzwNJdber27lZdwhTliLT2Y5mJXCyqWLhPJlnGBMvxW7CK+eVSy1JnotS5KLtSL0pd4d7sN2WaZIKlSU5/I5TMFJYzdUb/SZoW9ALRYp6NMoE0zjH94gs+LiSBUpaE7zCQ0zfKKrIDB/lKAaVIBz5jBLA6NJwcxooGKFKZeSE7nQQEHAxyVlaw+MNHBN7uucnOYfRV3A8lL8PDILSrb5tV7FGiffQX).

Imagine that you want to modify the function to allow strings in the array.
