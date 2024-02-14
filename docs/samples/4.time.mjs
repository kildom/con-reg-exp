// Match time in both 12 and 24-hour format

import cre from 'con-reg-exp';

// Convenient Regular Expression

const minutesAndSoOn = cre.ignoreCase`
    ":" [0-5] digit                     // Minutes
    optional {
        ":" [0-5] digit                 // Seconds
        optional ("." at-least-1 digit) // Fraction of a second
    }
`;

const time = cre.ignoreCase`
    {
        // 12-hour format
        {
            "1" [0-2]                   // Range 10…12
        or
            optional "0" digit          // Range 0…9
        }
        ${minutesAndSoOn}
        repeat whitespace               // Allow any whitespaces before AM/PM
        ("AM" or "PM")
    or
        // 24-hour format
        {
            "2" [0-3]                   // Range 20…23
        or
            optional [01] digit         // Range 0…19
        }
        ${minutesAndSoOn}
    }
`;

// Usage

console.log('Compiled: const time =', time.toString());

let sampleText = `
    sample time: 8:59
    12-hour format: 8:59AM
    24-hour format: 18:59
    you cannot combine these: 18:59PM
    or pass over valid range: 8:60
    with seconds: 8:58:09
    with fraction: 23:59:59.99
    or in nanosecond precision 23:59:59.999999999
`;

console.log(sampleText.match(time));
