import { describe, it, expect } from 'vitest';

describe('Simple Test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });

  it('should add numbers', () => {
    expect(2 + 2).toBe(4);
  });
});
