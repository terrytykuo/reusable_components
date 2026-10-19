#!/usr/bin/env node
// Grant or revoke the `admin` custom claim that admin-pwa's AuthGate and
// firestore.rules.snippet check. The person must have signed in once (Google) first.
//
// Usage:
//   FIREBASE_ADMIN_KEY_PATH=/abs/service-account.json node set-admin.mjs <email> [--revoke]
// Needs `firebase-admin` resolvable from where the script lives (copy it next to a
// package.json that depends on firebase-admin, e.g. your functions/ or CI scripts folder).
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const CLAIM = 'admin';

const args = process.argv.slice(2);
const revoke = args.includes('--revoke');
const rest = args.filter((a) => a !== '--revoke');
if (rest.length !== 1 || rest[0].startsWith('-')) { console.error('usage: set-admin.mjs <email> [--revoke]'); process.exit(1); }
const [email] = rest;
const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!keyPath) { console.error('FIREBASE_ADMIN_KEY_PATH (or GOOGLE_APPLICATION_CREDENTIALS) is not set'); process.exit(1); }
initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
const auth = getAuth();
let user;
try {
  user = await auth.getUserByEmail(email);
} catch (e) {
  if (e?.code === 'auth/user-not-found') {
    console.error(`${email}: this account has not signed in to the admin app yet — sign in once with Google, then rerun`);
    process.exit(1);
  }
  throw e;
}
const claims = { ...(user.customClaims || {}) };
if (revoke) delete claims[CLAIM]; else claims[CLAIM] = true;
await auth.setCustomUserClaims(user.uid, claims);
if (revoke) await auth.revokeRefreshTokens(user.uid);   // stop the old session from minting new ID tokens
console.log(`${revoke ? 'revoked' : 'granted'} ${CLAIM} for ${email} (${user.uid}); claims now`, claims);
console.log('They pick it up the next time they open the app (the gate force-refreshes a token that lacks the claim).');
