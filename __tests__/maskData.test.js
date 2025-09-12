const { maskData } = require('../src/index');

describe('maskData', () => {
  test('masks email partially', () => {
    expect(maskData('user@example.com')).toBe('us***@ex***.com');
  });

  test('masks phone partially', () => {
    expect(maskData('+1234567890')).toBe('+123****7890');
  });

  test('masks object with multiple fields', () => {
    const input = { email: 'user@example.com', phone: '+1234567890' };
    const expected = { email: 'us***@ex***.com', phone: '+123****7890' };
    expect(maskData(input)).toEqual(expected);
  });

  test('masks in total mode', () => {
    expect(maskData('user@example.com', { mode: 'total' })).toBe('********');
  });

  test('handles custom patterns', () => {
    const options = { patterns: { custom: /secret/g } };
    expect(maskData('my secret password', options)).toBe('my ******** password');
  });

  test('throws error if no data', () => {
    expect(() => maskData()).toThrow('Data is required');
  });
});