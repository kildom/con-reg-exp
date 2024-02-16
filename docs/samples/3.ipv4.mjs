// Match IPv4 address

import cre from 'con-reg-exp';

// Convenient Regular Expression
const ipv4number = cre`
    {
        "25", [0-5];           // Range 250…255
    } or {
        "2", [0-4], digit;     // Range 240…249
    } or {
        "1", digit, digit;     // Range 100…199
    } or {
        optional [1-9], digit; // Range 0…99
    }
`;

const ipv4address = cre.global`
    // Disallow anything behind that reassembles IPv4 addresses
    lookbehind not (digit or ".");
    // Four numbers separated by dot
    ${ipv4number};
    3-times {
        ".";
        ${ipv4number};
    }
    // Disallow anything ahead that reassembles IPv4 addresses
    lookahead not (digit or ".");
`;

// Usage

console.log('Compiled: const ipv4address =', ipv4address.toString());

let sampleText = `
    This sample will extract everything that looks like an IPv4 address,
    for example this is valid: 127.0.0.1, but this is not: 127.0.o.1.
    Also, ranges of numbers are checked, so "255.255.255.255" is ok,
    but "256.256.256.256" is not. If you get too many number, the
    pattern will also not match, for example "233.252.0.1.80" will not
    match, but "233.252.0.2:80" will match everything before ":".
`;

console.log(sampleText.match(ipv4address));
