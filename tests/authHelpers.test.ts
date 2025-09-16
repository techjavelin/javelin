import { describe, it, expect } from 'vitest';
import { withAuth, withUserAuth, withPublic, DEFAULT_AUTH_MODE } from '../src/amplifyClient';

// These tests verify that helper wrappers attach authMode appropriately and do not mutate input objects.

describe('auth helper wrappers', () => {
  it('withAuth adds default authMode when DEFAULT_AUTH_MODE is set', () => {
    const base = { filter: { foo: 'bar' } } as any;
    const result = withAuth(base);
    if (DEFAULT_AUTH_MODE) {
      expect(result.authMode).toBe(DEFAULT_AUTH_MODE);
    } else {
      expect(result.authMode).toBeUndefined();
    }
    // Ensure original object not mutated with authMode (unless by design)
    expect((base as any).authMode).toBeUndefined();
  });

  it('withUserAuth always sets authMode userPool', () => {
    const res = withUserAuth({ limit: 10 });
    expect(res.authMode).toBe('userPool');
  });

  it('withPublic always sets authMode apiKey', () => {
    const res = withPublic();
    expect(res.authMode).toBe('apiKey');
  });

  it('withUserAuth does not mutate source object', () => {
    const source: any = { limit: 5 };
    const res = withUserAuth(source);
    expect(res).not.toBe(source);
    expect(source.authMode).toBeUndefined();
  });
});
