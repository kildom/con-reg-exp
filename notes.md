
```
Escape characters support:
\b	REPLACED BY: word-boundary
\B	REPLACED BY: not word-boundary
\d	REPLACED BY: digit
\D	REPLACED BY: not digit
\s	REPLACED BY: white-space, ALIAS: whitespace
\S	REPLACED BY: not white-space, ALIAS: not whitespace
\w	REPLACED BY: word
\W	REPLACED BY: not word
\n	AVAILABLE, ALIAS: lf, nl, new-line, line-feed
\r	AVAILABLE, ALIAS: cr, carriage-return
\t	AVAILABLE, ALIAS: tab
\0	AVAILABLE, ALIAS: null, nul
\xXX	REPLACED BY: "\xXX"
\uXXXX	REPLACED BY: "\uXXXX"
\u{...}	REPLACED BY: "\u{...}"
\p{...}	REPLACED BY: property<...>, ALIAS: prop<...>
\P{...}	REPLACED BY: not property<...>, ALIAS: not prop<...>
\k<...>	REPLACED BY: match<...>
\c	DELETED
\q	DELETED
```
