
import { describe, expect, test } from 'vitest'
import cre from '../../src/con-reg-exp';


describe('Brackets', () => {
    test('Unmatched', () => {
        expect(() => cre`("abc"`).toThrow();
        expect(() => cre`("abc" or ("def")`).toThrow();
        expect(() => cre`"abc") or "x"`).toThrow();
        expect(() => cre`("def") or "abc")`).toThrow();
    });
});
