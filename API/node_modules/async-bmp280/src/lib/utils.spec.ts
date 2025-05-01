import { extractValue, lookUp, reverseLookUp } from './utils';

describe('utils', () => {
  describe('extractValue', () => {
    it('should return the masked shifted value', () => {
      expect(extractValue(0b10110100, 0b00111000, 3)).toBe(0b110);
    });
  });
  describe('lookUp', () => {
    it('should lookup the value in the table', () => {
      const table = {
        a: 0,
        b: 1,
      };

      expect(lookUp(table)('b')).toBe(table.b);
    });
    it('should return default value if not found', () => {
      const table = {
        a: 0,
        b: 1,
      };

      expect(lookUp(table)('c' as keyof typeof table)).toBe(0);
      expect(lookUp(table)('c' as keyof typeof table, 5)).toBe(5);
    });
  });
  describe('reverseLookUp', () => {
    it('should lookup the key in the table', () => {
      const table = {
        a: 0,
        b: 1,
      };

      expect(reverseLookUp(table)(1)).toBe('b');
    });
    it('should return first key if not found', () => {
      const table = {
        a: 0,
        b: 1,
      };

      expect(reverseLookUp(table)(2)).toBe('a');
    });
  });
});
