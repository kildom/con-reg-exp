
import { describe, expect, test } from 'vitest'
import cre from '../../src/con-reg-exp';

let doUpgraded = true;

try {
    new RegExp('', 'v');
} catch (e) {
    console.log('This JavasScript engine does not support RegExp v-mode');
    doUpgraded = false;
}

describe('Unicode', () => {
    if (doUpgraded) {

        test('Upgraded unicode', () => {
            expect(cre.unicode`[\w--_]`).toStrictEqual(new RegExp('[\\w--_]', 'sv'));
        });

    } else {

        test('Skipping upgraded unicode', () => { });

    }
});
