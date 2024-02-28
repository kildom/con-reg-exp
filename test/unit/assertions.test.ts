
import { describe, expect, test } from 'vitest'
import cre from '../../src/con-reg-exp';


describe('Assertions', () => {
    test('Input/line boundary assertion', () => {
        expect(cre`begin-of-text, end-of-text`).toStrictEqual(/^$/su);
        expect(cre`start-of-text`).toStrictEqual(/^/su);
        expect(cre`begin-of-line, end-of-line`).toStrictEqual(/^$/msu);
        expect(cre`start-of-line`).toStrictEqual(/^/msu);
        expect(cre`begin-of-text, begin-of-line, end-of-line, end-of-text`).toStrictEqual(/^(?<=[\r\n\u2028\u2029]|^)(?=[\r\n\u2028\u2029]|$)$/su);
        expect(cre`start-of-text, start-of-line`).toStrictEqual(/^(?<=[\r\n\u2028\u2029]|^)/su);
        expect(cre`not begin-of-text, not end-of-text`).toStrictEqual(/(?<!^)(?!$)/su);
        expect(cre`not start-of-text`).toStrictEqual(/(?<!^)/su);
        expect(cre`not begin-of-line, not end-of-line`).toStrictEqual(/(?<!^)(?!$)/msu);
        expect(cre`not start-of-line`).toStrictEqual(/(?<!^)/msu);
        expect(cre`not begin-of-text, not begin-of-line, not end-of-line, not end-of-text`).toStrictEqual(/(?<!^)(?<![\r\n\u2028\u2029]|^)(?![\r\n\u2028\u2029]|$)(?!$)/su);
        expect(cre`not start-of-text, not start-of-line`).toStrictEqual(/(?<!^)(?<![\r\n\u2028\u2029]|^)/su);
    });
});
