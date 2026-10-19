import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

export interface AdminCaller { uid: string; email: string | null }

/** Custom claim checked here, in firestore.rules.snippet and in the PWA's AuthGate. */
export const ADMIN_CLAIM = 'admin';

/**
 * Guard for admin-only callables: signed in AND custom claim admin === true
 * (strictly boolean true; 'true' / 1 are rejected). Call first in every handler.
 */
export function requireAdmin(request: CallableRequest<unknown>): AdminCaller {
  const auth = request.auth;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  const token = auth.token as Record<string, unknown> | undefined;
  if (token?.[ADMIN_CLAIM] !== true) throw new HttpsError('permission-denied', 'This account is not an admin.');
  return { uid: auth.uid, email: typeof token?.email === 'string' ? token.email : null };
}
