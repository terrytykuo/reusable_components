import { describe, expect, it } from 'vitest';
import { requireAdmin } from '../requireAdmin';

const req = (auth: unknown) => ({ auth, data: {}, rawRequest: {} as never }) as never;
const code = (c: string) => expect.objectContaining({ code: c });

describe('requireAdmin', () => {
  it('throws unauthenticated when there is no auth', () => {
    expect(() => requireAdmin(req(undefined))).toThrow(code('unauthenticated'));
  });
  it('throws unauthenticated when auth has no uid', () => {
    expect(() => requireAdmin(req({ token: { admin: true } }))).toThrow(code('unauthenticated'));
  });
  it('throws permission-denied without the admin claim', () => {
    expect(() => requireAdmin(req({ uid: 'u1', token: { email: 'x@y' } }))).toThrow(code('permission-denied'));
  });
  it.each([
    ['false', { uid: 'u1', token: { admin: false } }],
    ["the string 'true'", { uid: 'u1', token: { admin: 'true' } }],
    ['1', { uid: 'u1', token: { admin: 1 } }],
    ['a missing token', { uid: 'u1' }],
  ])('throws permission-denied when the claim is %s', (_label, auth) => {
    expect(() => requireAdmin(req(auth))).toThrow(code('permission-denied'));
  });
  it('returns uid and email with the claim', () => {
    expect(requireAdmin(req({ uid: 'u1', token: { admin: true, email: 'admin@x' } }))).toEqual({ uid: 'u1', email: 'admin@x' });
  });
  it('returns email null when the token has no email', () => {
    expect(requireAdmin(req({ uid: 'u1', token: { admin: true } }))).toEqual({ uid: 'u1', email: null });
  });
});
