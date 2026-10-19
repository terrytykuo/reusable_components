'use strict';
/* CI side of admin-pwa: write a doc the PWA reads, then push every device.
   For projects without Cloud Functions (the Spark plan is enough).

     const { initAdmin, publishDoc, sendPush } = require('./admin-firestore');
     if (!initAdmin()) { console.log('skipped: no FIREBASE_SERVICE_ACCOUNT'); process.exit(0); }
     const { created } = await publishDoc('admin/kits/items', id, doc, { preserve: [...DEFAULT_PRESERVE, 'metrics'] });
     if (created) await sendPush({ title, body, link: `https://<site>.web.app/items/${id}` });

   Every I/O function takes deps ({ db, messaging, Timestamp }) so tests run
   against fakes; without deps it uses the app from initAdmin(). */
const fs = require('node:fs');

/** Env vars tried in order. Each may hold the service-account JSON itself or a path to the file. */
const DEFAULT_ENV_VARS = ['FIREBASE_SERVICE_ACCOUNT', 'FIREBASE_ADMIN_KEY_PATH', 'GOOGLE_APPLICATION_CREDENTIALS'];
const DEFAULT_APP_NAME = 'admin-pwa';
/** Must match the PWA's brand.devicesPath. */
const DEFAULT_DEVICES_PATH = 'admin/pushTokens/devices';
/** Fields the PWA owns (StatusToggle); a re-publish never overwrites them. */
const DEFAULT_PRESERVE = ['status', 'postedAt', 'postedBy', 'postedUrl'];
const MULTICAST_LIMIT = 500;
const BODY_MAX = 120;
const STALE_CODES = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token']);

/* A JSON string (starts with "{") or a path to a JSON file → the parsed object. */
function loadServiceAccount(value, { readFile = (p) => fs.readFileSync(p, 'utf8') } = {}) {
  const v = String(value).trim();
  if (v.startsWith('{')) {
    try { return JSON.parse(v); } catch (e) { throw new Error('service account env value is not valid JSON: ' + e.message); }
  }
  return JSON.parse(readFile(v));
}

/* First configured env var → { name, serviceAccount }, or null when none is set. */
function credentialFromEnv(env = process.env, names = DEFAULT_ENV_VARS, opts) {
  for (const name of names) {
    const value = env[name];
    if (value && String(value).trim()) return { name, serviceAccount: loadServiceAccount(value, opts) };
  }
  return null;
}

let ctx = null;

/* Initialises (once) a named firebase-admin app from the env. Returns
   { app, db, messaging, Timestamp } or null when no credential is configured,
   so a CI step can print "skipped" and exit 0. */
function initAdmin({ env = process.env, envVars = DEFAULT_ENV_VARS, appName = DEFAULT_APP_NAME, sdk } = {}) {
  if (ctx) return ctx;
  const cred = credentialFromEnv(env, envVars);
  if (!cred) return null;
  const { initializeApp, cert, getApps } = sdk?.app || require('firebase-admin/app');
  const { getFirestore, Timestamp } = sdk?.firestore || require('firebase-admin/firestore');
  const { getMessaging } = sdk?.messaging || require('firebase-admin/messaging');
  const app = getApps().find((a) => a.name === appName) || initializeApp({ credential: cert(cred.serviceAccount) }, appName);
  ctx = { app, db: getFirestore(app), messaging: getMessaging(app), Timestamp };
  return ctx;
}

/* Test hook: forget the cached app context. */
function resetAdmin() { ctx = null; }

function requireCtx(deps, keys) {
  if (keys.every((k) => deps[k])) return deps;
  const c = initAdmin();
  if (!c) throw new Error('firebase-admin is not configured: set ' + DEFAULT_ENV_VARS[0] + ' (JSON or file path)');
  return { ...c, ...deps };
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;

/* Firestore rejects undefined: drop undefined keys in plain objects, turn
   undefined array items into null. Dates, Timestamps and sentinels pass through. */
function stripUndefined(value) {
  if (Array.isArray(value)) return value.map((v) => (v === undefined ? null : stripUndefined(v)));
  if (!isPlainObject(value)) return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = stripUndefined(v);
  return out;
}

/* Writes `${collectionPath}/${id}` with merge: true inside a transaction.
   - New doc: everything, with createdAt = Timestamp of doc.createdAt (a Date) or now.
   - Existing doc: createdAt and every `preserve` field are dropped from the write,
     so what the PWA set (status, metrics, notes…) and the original createdAt survive.
   Arrays are replaced wholesale by merge: true. Does not mutate `doc`.
   Returns { path, created } — push only when created. */
async function publishDoc(collectionPath, id, doc, { preserve = DEFAULT_PRESERVE, deps = {}, now = () => new Date() } = {}) {
  const { db, Timestamp } = requireCtx(deps, ['db', 'Timestamp']);
  const ref = db.doc(collectionPath + '/' + id);
  const { createdAt, ...rest } = stripUndefined(doc);
  const kept = Object.fromEntries(Object.entries(rest).filter(([k]) => !preserve.includes(k)));
  const created = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const stamp = createdAt ?? now();
    const payload = snap.exists ? kept : { ...rest, createdAt: stamp instanceof Date ? Timestamp.fromDate(stamp) : stamp };
    tx.set(ref, payload, { merge: true });
    return !snap.exists;
  });
  return { path: ref.path, created };
}

function truncate(s, max = BODY_MAX) {
  const chars = Array.from(String(s));
  return chars.length <= max ? chars.join('') : chars.slice(0, max - 1).join('') + '…';
}

/* The FCM multicast message (minus tokens). Same shape as the Functions template:
   the `notification` block lets the PWA's service worker show it and open
   fcmOptions.link on tap. `link` must be an absolute https URL. Data values are strings. */
function buildMessage({ title, body, link, tag, icon = '/icons/icon-192.png', data = {} }) {
  if (!title || !link) throw new Error('sendPush needs title and link');
  const strData = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));
  return {
    notification: { title, body: truncate(body ?? '') },
    webpush: { fcmOptions: { link }, notification: tag ? { icon, tag } : { icon } },
    data: { ...strData, link },
  };
}

/* Sends to every device doc (id = FCM token) under devicesPath, 500 per call,
   and deletes tokens FCM reports as gone. A chunk whose send throws counts its
   tokens as failed and prunes nothing. Returns { devices, sent, failed, pruned, errors }. */
async function sendPush(notification, devicesPath = DEFAULT_DEVICES_PATH, { deps = {} } = {}) {
  const { db, messaging } = requireCtx(deps, ['db', 'messaging']);
  const message = buildMessage(notification);
  const snap = await db.collection(devicesPath).get();
  const docs = snap.docs;
  const result = { devices: docs.length, sent: 0, failed: 0, pruned: 0, errors: {} };
  const count = (code) => { result.errors[code] = (result.errors[code] || 0) + 1; };
  const stale = [];
  for (let start = 0; start < docs.length; start += MULTICAST_LIMIT) {
    const chunk = docs.slice(start, start + MULTICAST_LIMIT);
    try {
      const res = await messaging.sendEachForMulticast({ ...message, tokens: chunk.map((d) => d.id) });
      result.sent += res.successCount;
      result.failed += res.failureCount;
      res.responses.forEach((r, i) => {
        if (r.success) return;
        const code = (r.error && r.error.code) || 'unknown';
        count(code);
        if (STALE_CODES.has(code)) stale.push(chunk[i].ref);
      });
    } catch (e) {
      result.failed += chunk.length;
      count(e && typeof e.code === 'string' ? e.code : 'send-threw');
    }
  }
  const deletes = await Promise.allSettled(stale.map((ref) => ref.delete()));
  result.pruned = deletes.filter((d) => d.status === 'fulfilled').length;
  return result;
}

module.exports = {
  DEFAULT_ENV_VARS,
  DEFAULT_DEVICES_PATH,
  DEFAULT_PRESERVE,
  loadServiceAccount,
  credentialFromEnv,
  initAdmin,
  resetAdmin,
  stripUndefined,
  publishDoc,
  buildMessage,
  sendPush,
  truncate,
};
