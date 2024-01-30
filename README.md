# Convenient Regular Expressions

〚 Guide 〛&nbsp;
〚 [Syntax overview](docs/overview.md) 〛&nbsp;
〚 Installing 〛&nbsp;

This is a JavaScript module that provides different syntax for regular expressions.
The syntax is more convenient making it much easier to understand, review, maintain, and more.

> [!NOTE]
> This is still work in progress project. The main functionality is done.
> More work is needed in context of documentation, tests, build and deployment.

## Benefits

* **You can add whitespaces**

  This allows you to organize with spaces,
  new lines and indentation.

* **You can add comments**
 
  When a pice of code is not self-explanatory, a good comment
  makes a huge difference.

* **You are using words**

  The words that describe the regular expression, are significantly
  more readable. It is easier to memorize words which means
  something than some arbitrarily selected special characters.

* **Maintenance is simpler**

  If you want to make a change in a well structured code, you simply
  do it. With regular expression, you have to parse it your head,
  track brackets, groups, and divide it into pieces.

* **Code review is faster and more accurate**

  It easier to understand well formatted convenient code and changes
  that are happening there. Have you ever try to review changes
  in regular expression that are longer than 100 characters?
  What was the felling?

* **You can reuse code**

  You can put pieces of your expression into variables and simply
  insert them into you expression. This is like splitting your
  code into functions.

* **You can forget about double meaning**

  Some flags are automatically taken care. For example, you
  don't need to think if dot character includes new lines or not.

* **You are using sain language**

  Long regular expressions looks like those esoteric programming
  languages created just to give you a headache.

## Some example

Let's play a game. You have two functions. Try to understand what
they are doing.

Pure RegExp implementation:

```javascript
function guessWhatDoesThisFunction(text) {
    return /^\s*\[\s*(?:(?:[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\s*,\s*)*[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\s*)?\]\s*$/
        .test(text);
}
```

Convenient Regular Expressions:

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

function guessWhatDoesThisFunction(text) {
    return cre`
        begin-of-text ${ws}   // Trim leading whitespaces
        "[" ${ws}             // Begin of array
        optional {            // Optional, because array can be empty
            repeat {          // Numbers with trailing comma
                ${number} ${ws}
                "," ${ws}
            }
            ${number} ${ws}   // Last number has no comma
        }
        "]" ${ws}             // End of array
        end-of-text
    `.test(text);
}
```

Which one was easier to understand? I assuming that you don't know
the convenient regular expressions [syntax](docs/overview.md) yet. Were you able to guess
despite this?

Click or hover the link to see [the answer](#It-validates-if-the-input-is-a-json-containing-an-array-of-numbers).

Imagine that you want modify both functions to allow strings in the array.
