

Done | Feature |  Description
-----|---------|------
...| **Regex flags** |
OK | d | `indices` Generate indices for substring matches.
OK | g | `global` Global search.
OK | i | `ignore-case` Case-insensitive search.
OK | m | automatic;  Allows ^ and $ to match next to newline characters.
OK | s | always enabled Allows . to match newline characters.
OK | u | `unicode` Treat a pattern as a sequence of Unicode code points
ns | v | Not supported for now. An upgrade to the u mode with more Unicode features.
OK | y | `sticky` Perform a "sticky" search that matches starting at the current position in the target string.
...| **Assertions**
OK | `^$` | start-of-text, start-of-line, ...
OK | `(?=...) (?!...) (?<=...) (?<!...)` | look-ahead, look-ahead not, ...
OK | `\b\B` | word-boundary, not word-boundary, TODO: not operator
...| **Atoms**
OK | `\1, \2` | `match<N>` Backreference
OK | `( )` | group ...
OK | `[ ] [^ ]` | `[ ] [^ ]` Character class
OK | `\d, \D, \w, \W, \s, \S` | digit, not digit, word-char, ... Character class escape (TODO: rename to word => word-char)
OK | `\r\n\t\0` | `\r\n\t\0` or `tab`, e.t.c... Character escape
OK | `\u...\x...`  | `"\u...\x..."` Unicode or byte escape
OK | `abc` | `"abc"` Literal character
OK | `\k<name>` | `match<name>` Named backreference
OK | `(?<name>...)` | `group<name> ...` Named capturing group
OK | `(?:...)` | Added automatically when needed
OK | `\p{...}, \P{...}` | `property<...>` Unicode character class escape
OK | `.` | `any` or `not term` Wildcard
...| **Other features**
OK | `\|` | `or`
OK | `* + ? {n} {n,} {n,m}` | `optional`, `repeat-N`, `at-least-N`, ...
...| **Escape sequences**
OK | `\b` | REPLACED BY: word-boundary
OK | `\B` | REPLACED BY: not word-boundary
OK | `\d` | REPLACED BY: digit
OK | `\D` | REPLACED BY: not digit
OK | `\s` | REPLACED BY: white-space, ALIAS: whitespace
OK | `\S` | REPLACED BY: not white-space, ALIAS: not whitespace
OK | `\w` | REPLACED BY: word-character, ALIAS: word-char
OK | `\W` | REPLACED BY: not word-character, ALIAS: not word-char
.  | `\q` | REPLACED BY: "..."
OK | `\n` | AVAILABLE, ALIAS: lf, nl, new-line, line-feed
OK | `\r` | AVAILABLE, ALIAS: cr, carriage-return
OK | `\t` | AVAILABLE, ALIAS: tab
OK | `\0` | AVAILABLE, ALIAS: null, nul
OK | `\xXX` | REPLACED BY: "\xXX"
OK | `\uXXXX` | REPLACED BY: "\uXXXX"
OK | `\u{...}` | REPLACED BY: "\u{...}"
OK | `\p{...}` | REPLACED BY: property<...>, ALIAS: prop<...>
OK | `\P{...}` | REPLACED BY: not property<...>, ALIAS: not prop<...>
OK | `\k<...>` | REPLACED BY: match<...>
OK | `\c` | DELETED

