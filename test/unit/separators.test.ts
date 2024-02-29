
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
            1: "def"
            2: "ghi";
            (3: "jkl")
            4: "mno"
        `).toStrictEqual(/abc(def)(ghi)(jkl)(mno)/su)

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
            1: ${inner2}
            2: ${inner};
            (3: ${inner})
            4: ${inner2}
        `).toStrictEqual(/def(def)(def)(def)(def)/su)
    });
});
