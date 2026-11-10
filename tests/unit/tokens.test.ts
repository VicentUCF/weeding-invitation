import { describe, expect, it } from 'vitest';
import { hashToken, makeToken, validToken } from '../../src/lib/tokens';

describe('invitation tokens', () => {
  it('creates an unpredictable URL-safe token and stores only its hash', () => {
    const token = makeToken();
    expect(validToken(token)).toBe(true);
    expect(hashToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(token)).not.toBe(token);
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('rejects short or malformed tokens', () => {
    expect(validToken('abc')).toBe(false);
    expect(validToken('x'.repeat(42) + '/')).toBe(false);
  });
});
