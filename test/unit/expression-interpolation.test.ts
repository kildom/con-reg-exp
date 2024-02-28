
import { describe, expect, test } from 'vitest'
import cre from '../../src/con-reg-exp';


describe('Expression interpolation', () => {
    test('Mismatching flags', () => {
        expect(() => { let abc = cre.ignoreCase`"abc"`; cre`${abc}`; }).toThrow();
        expect(() => { let abc = cre`"abc"`; cre.ignoreCase`${abc}`; }).toThrow();
        expect(() => { let abc = cre.legacy`"abc"`; cre`${abc}`; }).toThrow();
        expect(() => { let abc = cre`"abc"`; cre.legacy`${abc}`; }).toThrow();
        expect(() => { let abc = cre.ignoreCase.legacy`"abc"`; cre.legacy`${abc}`; }).toThrow();
        expect(() => { let abc = cre.ignoreCase`"abc"`; cre.ignoreCase.legacy`${abc}`; }).toThrow();
    });
});
