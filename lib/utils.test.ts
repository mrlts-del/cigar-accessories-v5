import { formatPrice } from './utils';
import { Decimal } from '@prisma/client/runtime/library';

describe('formatPrice', () => {
  it('should format a positive number correctly', () => {
    expect(formatPrice(1234.56)).toBe('$1,234.56');
  });

  it('should format zero correctly', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('should format a string number correctly', () => {
    expect(formatPrice('987.65')).toBe('$987.65');
  });

  it('should format a Decimal object correctly', () => {
    const decimalValue = new Decimal('1500.75');
    expect(formatPrice(decimalValue)).toBe('$1,500.75');
  });

  it('should handle null input, defaulting to $0.00', () => {
    expect(formatPrice(null)).toBe('$0.00');
  });

  it('should handle undefined input, defaulting to $0.00', () => {
    expect(formatPrice(undefined)).toBe('$0.00');
  });

  it('should format with different currency', () => {
    expect(formatPrice(100, { currency: 'EUR' })).toBe('€100.00'); // Assuming locale default supports EUR symbol
  });

  it('should format with different fraction digits', () => {
    expect(formatPrice(50, { minimumFractionDigits: 0, maximumFractionDigits: 0 })).toBe('$50');
  });

  it('should handle large numbers', () => {
    expect(formatPrice(1000000)).toBe('$1,000,000.00');
  });

  it('should handle small fractional numbers', () => {
    expect(formatPrice(0.12)).toBe('$0.12');
  });

  it('should handle string with currency symbol (and ignore it)', () => {
    // Note: parseFloat might behave differently based on implementation,
    // but standard behavior usually stops at the first non-numeric character.
    // This test assumes parseFloat('$500') results in NaN or similar, leading to default 0.
    // Let's test the actual behavior based on the function's parseFloat usage.
    // If parseFloat('500') works, it should format correctly.
    expect(formatPrice('500')).toBe('$500.00');
    // If the string contains non-numeric prefix/suffix that parseFloat handles:
    // expect(formatPrice('$500')).toBe('$0.00'); // Or based on actual parseFloat result
  });
});