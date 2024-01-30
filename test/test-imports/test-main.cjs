
const cre = require('con-reg-exp');

console.log(cre.first.legacy`"OK"`);

try {
    console.log(cre.first.legacy`error`);
    throw new Error('Unreachable');
} catch (err) {
    if (!(err instanceof cre.Error)) {
        throw err;
    }
}
