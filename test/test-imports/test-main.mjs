
import cre from 'con-reg-exp';

console.log(cre.legacy`"OK"`);

try {
    console.log(cre.legacy`error`);
    throw new Error('Unreachable');
} catch (err) {
    if (!(err instanceof cre.Error)) {
        throw err;
    }
}
