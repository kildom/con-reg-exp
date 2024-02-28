
import { describe, expect, test } from 'vitest'
import cre from '../../src/con-reg-exp';


describe('Flags', () => {
    test('Invalid', () => {
        expect(() => { cre.ignorecase`"abc"`; }).toThrow();
        expect(() => { cre.sticky.ignorecase`"abc"`; }).toThrow();
    });
});
