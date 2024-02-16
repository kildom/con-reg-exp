// Match JSON array of numbers

import cre from 'con-reg-exp';

// Convenient Regular Expression

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

const arrayOfNumbers = cre`
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

// Usage

console.log('Compiled: const arrayOfNumbers =', arrayOfNumbers.toString());

let sampleTexts = [
    '[1,2,3]',
    ' [ 1 , 2 , 3 ] ',
    '\n[\n1,\n2,\r\n3\n]\n',
    '[0.1, 0.2, 0.3]',
    '[1e1, 1e+1, 1.00E+1, 0.1E-1]',
    '[]',
    '[1,2,]',
    '[1,2,"3"]',
    '[.1]',
    '[1.]',
    '[1.e+12]',
];

for (let text of sampleTexts) {
    if (arrayOfNumbers.test(text)) {
        console.log(JSON.stringify(text), '=>', JSON.parse(text));
    } else {
        console.log(JSON.stringify(text), '=> invalid');
    }
}
