import { describe, it, expect } from 'vitest';

describe('Timer math', () => {
  it('calculates elapsed seconds correctly', () => {
    const startedAt = new Date('2025-01-01T12:00:00Z').getTime();
    const now = new Date('2025-01-01T12:00:30Z').getTime();
    const elapsed = Math.floor((now - startedAt) / 1000);
    expect(elapsed).toBe(30);
  });
});
