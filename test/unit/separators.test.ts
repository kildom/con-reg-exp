
import { describe, expect, test } from 'vitest'
import cre from '../../src/con-reg-exp';


describe('Separators', () => {

    test('Missing', () => {

        expect(() => cre`"abc" "abc"`).toThrow();
        expect(() => cre`repeat("abc") "abc"`).toThrow();
        expect(() => cre`"abc" ("abc" or "def")`).toThrow();

    });

    test('Optional', () => {

        expect(cre`
            "abc"
            group "def"
            group "ghi";
            (group "jkl")
            group "mno"
        `).toStrictEqual(/abc(def)(ghi)(jkl)(mno)/msu)

    });

    test('Interpolation', () => {// TODO: Remove new line tokens at the end and beginning of interpolated tokens
        let inner = cre`
            "def"
        `;
        let inner2 = cre`
            ${inner}
        `;
        expect(() => cre`"abc" ${inner} "ghi"`).toThrow();
        expect(() => cre`"abc" ${inner}`).toThrow();
        expect(() => cre`${inner} "ghi"`).toThrow();
        expect(() => cre`"abc" ${inner2} "ghi"`).toThrow();
        expect(() => cre`"abc" ${inner2}`).toThrow();
        expect(() => cre`${inner2} "ghi"`).toThrow();
        expect(cre`
            ${inner}
            group ${inner2}
            group ${inner};
            (group ${inner})
            group ${inner2}
        `).toStrictEqual(/def(def)(def)(def)(def)/msu)
    });
});
