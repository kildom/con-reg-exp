// Match JS floating point number

import cre from 'con-reg-exp';

// Convenient Regular Expression

const number = cre.global`
    optional [+-];                    // Sign
    {
        at-least-1 digit;             // Integral part
        optional (".", repeat digit); // Optional factional part
    } or {
        ".";
        at-least-1 digit;             // Variant with only fractional part
    }
    optional {                        // Optional exponent part
        [eE];
        optional [+-];
        at-least-1 digit;
    }
`;

// Usage

console.log('Compiled: const number =', number.toString());

let sampleText = `
    This is number: 7
    Scientific notation: 0.3e+10
    Some other examples: -.2, +0e0
    Those are not numbers, but numeric part will be extracted: 1e, x10, 10.10.10.10
`;

console.log(sampleText.match(number));
