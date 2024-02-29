
import { describe, expect, test } from 'vitest'
import cre from '../../src/con-reg-exp';


describe('Capture', () => {
    test('Positional', () => {
        expect(cre`1: any`).toStrictEqual(/(.)/su);
        expect(cre`1: any, 2: digit`).toStrictEqual(/(.)(\d)/su);
        expect(cre`1: (any, 2: digit)`).toStrictEqual(/(.(\d))/su);
    });
    test('Positional failure', () => {
        expect(() => cre`0: any`).toThrow();
        expect(() => cre`2: any`).toThrow();
        expect(() => cre`1: (any, 1: digit)`).toThrow();
        expect(() => cre`first: digit, 1: any`).toThrow();
    });
    test('Mixed', () => {
        expect(cre`first: any, 2: digit`).toStrictEqual(/(?<first>.)(\d)/su);
        expect(cre`first: (any, 2: digit)`).toStrictEqual(/(?<first>.(\d))/su);
        expect(cre`1: any, two: digit, 3: word-char`).toStrictEqual(/(.)(?<two>\d)(\w)/su);
    });
});
