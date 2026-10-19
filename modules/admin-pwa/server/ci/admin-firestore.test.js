'use strict';
const test = require('node:test');
const assert = require('node:assert');
const {
  DEFAULT_PRESERVE, loadServiceAccount, credentialFromEnv, initAdmin, resetAdmin,
  stripUndefined, publishDoc, buildMessage, sendPush, truncate,
} = require('./admin-firestore');

const NOW = new Date('2026-10-19T08:30:00.000Z');
const Timestamp = { fromDate: (d) => ({ _d: d }) };
const SA = { type: 'service_account', project_id: 'p', client_email: 'x@p.iam.gserviceaccount.com', private_key: 'k' };

/* ---------- credentials ---------- */

test('loadServiceAccount: JSON string, or a file path', () => {
  assert.deepStrictEqual(loadServiceAccount('  ' + JSON.stringify(SA)), SA);
  const read = [];
  const fromFile = loadServiceAccount('/abs/sa.json', { readFile: (p) => { read.push(p); return JSON.stringify(SA); } });
  assert.deepStrictEqual(fromFile, SA);
  assert.deepStrictEqual(read, ['/abs/sa.json']);
  assert.throws(() => loadServiceAccount('{not json'), /not valid JSON/);
});

test('credentialFromEnv: first non-empty var wins; null when none is set', () => {
  const env = { FIREBASE_SERVICE_ACCOUNT: ' ', FIREBASE_ADMIN_KEY_PATH: JSON.stringify(SA) };
  assert.deepStrictEqual(credentialFromEnv(env), { name: 'FIREBASE_ADMIN_KEY_PATH', serviceAccount: SA });
  assert.strictEqual(credentialFromEnv({}), null);
  assert.deepStrictEqual(credentialFromEnv({ MY_SA: JSON.stringify(SA) }, ['MY_SA']).name, 'MY_SA');
});

function fakeSdk() {
  const apps = [];
  return {
    apps,
    sdk: {
      app: {
        getApps: () => apps,
        cert: (sa) => ({ cert: sa.client_email }),
        initializeApp: (opts, name) => { const a = { name, opts }; apps.push(a); return a; },
      },
      firestore: { getFirestore: (app) => ({ db: app.name }), Timestamp },
      messaging: { getMessaging: (app) => ({ messaging: app.name }) },
    },
  };
}

test('initAdmin: null without credentials, otherwise one named app, cached', () => {
  resetAdmin();
  const f = fakeSdk();
  assert.strictEqual(initAdmin({ env: {}, sdk: f.sdk }), null);
  const ctx = initAdmin({ env: { FIREBASE_SERVICE_ACCOUNT: JSON.stringify(SA) }, sdk: f.sdk });
  assert.strictEqual(ctx.app.name, 'admin-pwa');
  assert.deepStrictEqual(ctx.app.opts, { credential: { cert: SA.client_email } });
  assert.deepStrictEqual(ctx.db, { db: 'admin-pwa' });
  assert.strictEqual(ctx.Timestamp, Timestamp);
  assert.strictEqual(initAdmin({ env: {}, sdk: f.sdk }), ctx, 'cached');
  assert.strictEqual(f.apps.length, 1);
  resetAdmin();
});

test('initAdmin: reuses an app of the same name that already exists', () => {
  resetAdmin();
  const f = fakeSdk();
  f.apps.push({ name: 'admin-pwa', existing: true });
  const ctx = initAdmin({ env: { FIREBASE_SERVICE_ACCOUNT: JSON.stringify(SA) }, sdk: f.sdk });
  assert.strictEqual(ctx.app.existing, true);
  assert.strictEqual(f.apps.length, 1);
  resetAdmin();
});

test('publishDoc without deps or credentials throws a setup hint', async () => {
  resetAdmin();
  const saved = {};
  for (const k of ['FIREBASE_SERVICE_ACCOUNT', 'FIREBASE_ADMIN_KEY_PATH', 'GOOGLE_APPLICATION_CREDENTIALS']) { saved[k] = process.env[k]; delete process.env[k]; }
  try {
    await assert.rejects(publishDoc('a/b/c', 'x', {}), /FIREBASE_SERVICE_ACCOUNT/);
  } finally {
    for (const [k, v] of Object.entries(saved)) if (v !== undefined) process.env[k] = v;
  }
});

/* ---------- publishDoc ---------- */

function fakeDb(existing) {
  const calls = [];
  return {
    calls,
    doc: (p) => ({ path: p }),
    runTransaction: (fn) => fn({
      get: async () => ({ exists: !!existing }),
      set: (ref, data, opts) => { calls.push({ path: ref.path, data, opts }); },
    }),
  };
}

test('publishDoc: a new doc gets everything plus a converted createdAt, merge: true', async () => {
  const db = fakeDb(false);
  const doc = { title: 'T', status: 'draft', slides: [{ file: '01.jpg', url: 'https://x/01.jpg' }], createdAt: NOW };
  const res = await publishDoc('admin/content/items', '2026-10-19', doc, { deps: { db, Timestamp } });
  assert.deepStrictEqual(res, { path: 'admin/content/items/2026-10-19', created: true });
  assert.strictEqual(db.calls.length, 1);
  assert.deepStrictEqual(db.calls[0].opts, { merge: true });
  assert.deepStrictEqual(db.calls[0].data, { title: 'T', status: 'draft', slides: doc.slides, createdAt: { _d: NOW } });
  assert.strictEqual(doc.createdAt, NOW, 'input not mutated');
});

test('publishDoc: createdAt defaults to now() on a new doc', async () => {
  const db = fakeDb(false);
  await publishDoc('a/b/c', 'id', { title: 'T' }, { deps: { db, Timestamp }, now: () => NOW });
  assert.deepStrictEqual(db.calls[0].data.createdAt, { _d: NOW });
});

test('publishDoc: an existing doc keeps createdAt and every preserved field', async () => {
  const db = fakeDb(true);
  const doc = { title: 'T2', status: 'draft', postedAt: null, metrics: { views: 1 }, notes: 'n', createdAt: NOW };
  const res = await publishDoc('admin/content/items', 'x', doc, { preserve: [...DEFAULT_PRESERVE, 'metrics', 'notes'], deps: { db, Timestamp } });
  assert.deepStrictEqual(res, { path: 'admin/content/items/x', created: false });
  assert.deepStrictEqual(db.calls[0].data, { title: 'T2' });
  assert.deepStrictEqual(db.calls[0].opts, { merge: true });
});

test('publishDoc: the default preserve list is the StatusToggle fields', async () => {
  assert.deepStrictEqual(DEFAULT_PRESERVE, ['status', 'postedAt', 'postedBy', 'postedUrl']);
  const db = fakeDb(true);
  await publishDoc('a/b/c', 'x', { title: 'T', status: 'draft', postedBy: 'x', metrics: 1 }, { deps: { db, Timestamp } });
  assert.deepStrictEqual(db.calls[0].data, { title: 'T', metrics: 1 });
});

test('publishDoc: undefined never reaches Firestore', async () => {
  const db = fakeDb(false);
  await publishDoc('a/b/c', 'x', { a: undefined, b: { c: undefined, d: 1 }, e: [undefined, 2] }, { deps: { db, Timestamp }, now: () => NOW });
  assert.deepStrictEqual(db.calls[0].data, { b: { d: 1 }, e: [null, 2], createdAt: { _d: NOW } });
});

test('stripUndefined leaves Dates and class instances alone', () => {
  class Sentinel { constructor() { this.x = undefined; } }
  const s = new Sentinel();
  const out = stripUndefined({ d: NOW, s });
  assert.strictEqual(out.d, NOW);
  assert.strictEqual(out.s, s);
});

/* ---------- push ---------- */

test('truncate caps at 120 code points with an ellipsis', () => {
  const body = truncate('字'.repeat(200));
  assert.strictEqual(Array.from(body).length, 120);
  assert.ok(body.endsWith('…'));
  assert.strictEqual(truncate('a'.repeat(120)), 'a'.repeat(120));
});

test('buildMessage: notification block, link in fcmOptions and data, string data, optional tag', () => {
  assert.deepStrictEqual(buildMessage({ title: 'New', body: 'B', link: 'https://x.web.app/items/1', tag: 'items-1', data: { id: 1 } }), {
    notification: { title: 'New', body: 'B' },
    webpush: { fcmOptions: { link: 'https://x.web.app/items/1' }, notification: { icon: '/icons/icon-192.png', tag: 'items-1' } },
    data: { id: '1', link: 'https://x.web.app/items/1' },
  });
  assert.deepStrictEqual(buildMessage({ title: 't', link: 'https://x' }).webpush.notification, { icon: '/icons/icon-192.png' });
  assert.throws(() => buildMessage({ title: 't' }), /title and link/);
});

function devicesDb(ids) {
  const deleted = [];
  const paths = [];
  const docs = ids.map((id) => ({ id, ref: { id, delete: async () => { deleted.push(id); } } }));
  return { deleted, paths, db: { collection: (p) => { paths.push(p); return { get: async () => ({ docs }) }; } } };
}

function fakeMessaging(respond) {
  const calls = [];
  return {
    calls,
    sendEachForMulticast: async (m) => {
      calls.push(m);
      const responses = respond(calls.length - 1, m.tokens);
      const successCount = responses.filter((r) => r.success).length;
      return { responses, successCount, failureCount: responses.length - successCount };
    },
  };
}
const ok = { success: true };
const err = (code) => ({ success: false, error: { code } });

test('sendPush: sends to every device under the default path and prunes gone tokens', async () => {
  const d = devicesDb(['a', 'b', 'c']);
  const messaging = fakeMessaging((_c, t) => t.map((tok) => (tok === 'b' ? err('messaging/registration-token-not-registered') : tok === 'c' ? err('messaging/internal-error') : ok)));
  const res = await sendPush({ title: 'T', body: 'B', link: 'https://x/1' }, undefined, { deps: { db: d.db, messaging } });
  assert.deepStrictEqual(d.paths, ['admin/pushTokens/devices']);
  assert.deepStrictEqual(messaging.calls[0].tokens, ['a', 'b', 'c']);
  assert.deepStrictEqual(messaging.calls[0].notification, { title: 'T', body: 'B' });
  assert.deepStrictEqual(d.deleted, ['b']);
  assert.deepStrictEqual(res, { devices: 3, sent: 1, failed: 2, pruned: 1, errors: { 'messaging/registration-token-not-registered': 1, 'messaging/internal-error': 1 } });
});

test('sendPush: chunks by 500; a throwing chunk counts as failed and the loop continues', async () => {
  const ids = Array.from({ length: 1001 }, (_, i) => 'tok' + i);
  const d = devicesDb(ids);
  const messaging = fakeMessaging((c, t) => {
    if (c === 0) throw Object.assign(new Error('boom'), { code: 'app/network-error' });
    return t.map((_, i) => (c === 2 && i === 0 ? err('messaging/invalid-registration-token') : ok));
  });
  const res = await sendPush({ title: 'T', link: 'https://x' }, 'custom/devices/path', { deps: { db: d.db, messaging } });
  assert.deepStrictEqual(d.paths, ['custom/devices/path']);
  assert.deepStrictEqual(messaging.calls.map((m) => m.tokens.length), [500, 500, 1]);
  assert.deepStrictEqual(res, { devices: 1001, sent: 500, failed: 501, pruned: 1, errors: { 'app/network-error': 1, 'messaging/invalid-registration-token': 1 } });
  assert.deepStrictEqual(d.deleted, ['tok1000']);
});

test('sendPush: no devices → no send', async () => {
  const d = devicesDb([]);
  const messaging = fakeMessaging(() => []);
  const res = await sendPush({ title: 'T', link: 'https://x' }, undefined, { deps: { db: d.db, messaging } });
  assert.deepStrictEqual(res, { devices: 0, sent: 0, failed: 0, pruned: 0, errors: {} });
  assert.strictEqual(messaging.calls.length, 0);
});
