
# Operators

Operators ordered by precedence.

Operator | Name | Precedence | Comment
--|--|:--:|--
&nbsp; | **GROUPING<br>OPERATORS**
`( )` | Parentheses | 4 | Suggested for single-line groups.
`{ }` | Brackets | 4 | Suggested for multi-line groups.
&nbsp; | **UNARY (PREFIX)<br>OPERATORS**
`not` | Complement | 3 | Applies only to some operands.
`group` | Positional capturing<br>group | 3
*`NAME`* `:` | Named capturing<br>group | 3
`lookahead` | Lookahead assertion | 3
`lookbehind` | lookbehind assertion | 3
`optional` | Optional quantifier | 3 | 0 to 1 times
`repeat` | Unlimited quantifier | 3 | 0 to ∞ times
`at‑least‑N` | Lower limit quantifier | 3 | N to ∞ times
`at‑most‑N` | Upper limit quantifier | 3 | 0 to N times
`N‑times` | Exact quantifier | 3 | exactly N times
`N‑to‑M‑times` | Range quantifier | 3 | N to M times
&nbsp; | **BINARY<br>OPERATORS**
` ` | Concatenation | 2 | Operands next to each other without any conjunction characters.
`or` | Disjunction | 1

TODO: write more
