

Done | Feature |  Description
-----|---------|------
...| **Regex flags** |
.  | d | `indices` Generate indices for substring matches.
.  | g | `global` Global search.
.  | i | `ignore-case` Case-insensitive search.
OK | m | automatic;  Allows ^ and $ to match next to newline characters.
OK | s | always disabled Allows . to match newline characters.	dotAll
.  | u | `unicode` Treat a pattern as a sequence of Unicode code points
ns | v | Not supported for now. An upgrade to the u mode with more Unicode features.
.  | y | `sticky` Perform a "sticky" search that matches starting at the current position in the target string.
...| **Assertions**
OK | `^$` | start-of-text, start-of-line, ...
OK | `(?=...) (?!...) (?<=...) (?<!...)` | look-ahead, look-ahead not, ...
?  | `\b\B` | word-boundary, not word-boundary, TODO: not operator
...| **Atoms**
OK | `\1, \2` | `match<N>` Backreference
OK | `( )` | group ...
?  | `[ ] [^ ]` | `[ ] [^ ]` Character class (TODO: some improvements, or operator)
.  | `\d, \D, \w, \W, \s, \S` | digit, not digit, word-char, ... Character class escape (TODO: rename to word => word-char)
OK | `\r\n\t\0` | `\r\n\t\0` or `tab`, e.t.c... Character escape
OK | `\u...\x...`  | `"\u...\x..."` Unicode or byte escape
OK | `abc` | `"abc"` Literal character
OK | `\k<name>` | `match<name>` Named backreference
OK | `(?<name>...)` | `group<name> ...` Named capturing group
OK | `(?:...)` | Added automatically when needed
.  | `\p{...}, \P{...}` | `property<...>` Unicode character class escape
.  | `.` | `any` or `not term` Wildcard
...| **Other features**
OK | `\|` | `or`
OK | `* + ? {n} {n,} {n,m}` | `optional`, `repeat-N`, `at-least-N`, ...
...| **Escape sequences**
.  | `\b` | REPLACED BY: word-boundary
.  | `\B` | REPLACED BY: not word-boundary
.  | `\d` | REPLACED BY: digit
.  | `\D` | REPLACED BY: not digit
.  | `\s` | REPLACED BY: white-space, ALIAS: whitespace
.  | `\S` | REPLACED BY: not white-space, ALIAS: not whitespace
.  | `\w` | REPLACED BY: word-character, ALIAS: word-char
.  | `\W` | REPLACED BY: not word-character, ALIAS: not word-char
.  | `\q` | REPLACED BY: "..."
.  | `\n` | AVAILABLE, ALIAS: lf, nl, new-line, line-feed
.  | `\r` | AVAILABLE, ALIAS: cr, carriage-return
.  | `\t` | AVAILABLE, ALIAS: tab
.  | `\0` | AVAILABLE, ALIAS: null, nul
.  | `\xXX` | REPLACED BY: "\xXX"
.  | `\uXXXX` | REPLACED BY: "\uXXXX"
.  | `\u{...}` | REPLACED BY: "\u{...}"
.  | `\p{...}` | REPLACED BY: property<...>, ALIAS: prop<...>
.  | `\P{...}` | REPLACED BY: not property<...>, ALIAS: not prop<...>
.  | `\k<...>` | REPLACED BY: match<...>
.  | `\c` | DELETED

