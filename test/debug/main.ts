

import cre from '../../src/con-reg-exp';

let inner = cre`
    "def"
`;
let inner2 = cre`
    ${inner}
`;

console.log(inner2);
