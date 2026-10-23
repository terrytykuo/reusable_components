'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { run, parseArgs, CONFIG } = require('./pull-revisions');
const { fakeDb, fakeMessaging, fakeFetch } = require('./fakes');

const NOW = new Date('2026-10-23T08:00:00.000Z');
const ts = (iso) => ({ toDate: () => new Date(iso) });
const rv = (id, status, extra = {}) => Object.assign({ id, text: 'text ' + id, status, createdAt: ts('2026-10-23T06:00:00Z'), by: 't@x' }, extra);
const tmpRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'revision-requests-'));
const C = 'admin/content/items';
const config = (root, extra = {}) => Object.assign({ repoRoot: root, repo: 'acme/site', adminUrl: 'https://acme-admin.web.app' }, extra);
const D = 'admin/pushTokens/devices/tok';

test('parseArgs', () => {
  assert.deepStrictEqual(parseArgs(['--expire', '--dry-run']), { dispatch: false, expire: true, done: null, dryRun: true });
  assert.deepStrictEqual(parseArgs(['--done', '2026-10-23']), { dispatch: false, expire: false, done: '2026-10-23', dryRun: false });
  assert.strictEqual(CONFIG.expireMs, 90 * 60 * 1000);
});

test('--dispatch: queues + dispatches (PAT wins) + logs; posted → notePosted + noted; ineligible → failed + push; next run waits', async () => {
  const root = tmpRoot();
  const db = fakeDb({
    [D]: {},
    [C + '/2026-10-23']: { title: 'Today', status: 'draft', revisions: [rv('r:a', 'open'), rv('r:b', 'open', { createdAt: ts('2026-10-23T07:00:00Z') })] },
    [C + '/2026-10-22']: { title: 'Yesterday', status: 'posted', revisions: [rv('r:p', 'open')] },
    [C + '/special-x']: { title: 'Special', revisions: [rv('r:s', 'open')] },
  });
  const messaging = fakeMessaging();
  const fetchImpl = fakeFetch();
  const noted = [];
  const notePosted = async (item, r, { env }) => { noted.push([item.id, r.id, env.TASTE]); };
  const env = { GITHUB_TOKEN: 'gh', GH_DISPATCH_TOKEN: 'pat', TASTE: 'k' };
  const deps = { db, messaging, fetchImpl, env, now: NOW, config: config(root, { notePosted }) };
  const { lines, dispatched } = await run(['--dispatch'], deps);
  assert.strictEqual(dispatched, 1, lines.join('\n'));

  const today = db.docs.get(C + '/2026-10-23').revisions;
  assert.deepStrictEqual([today[0].status, today[0].queuedAt, today[1].status], ['queued', NOW, 'open']);
  assert.strictEqual(db.docs.get(C + '/2026-10-22').revisions[0].status, 'noted');
  assert.deepStrictEqual(noted, [['2026-10-22', 'r:p', 'k']]);
  const sp = db.docs.get(C + '/special-x').revisions[0];
  assert.deepStrictEqual([sp.status, sp.reply], ['failed', CONFIG.replies.notEligible]);

  assert.strictEqual(fetchImpl.calls.length, 1);
  assert.strictEqual(fetchImpl.calls[0].url, 'https://api.github.com/repos/acme/site/dispatches');
  assert.strictEqual(fetchImpl.calls[0].init.headers.Authorization, 'Bearer pat');
  assert.deepStrictEqual(fetchImpl.calls[0].body, { event_type: 'revision-request', client_payload: { kitId: '2026-10-23', revisionId: 'r:a', text: 'text r:a', date: '2026-10-23' } });
  assert.deepStrictEqual(messaging.calls.map((c) => [c.notification.title, c.notification.body, c.webpush.fcmOptions.link, c.webpush.notification.tag]),
    [['修改失敗', 'Special', 'https://acme-admin.web.app/items/special-x', 'revision-special-x']]);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(root, 'revisions-log.json'), 'utf8')),
    [{ kitId: '2026-10-23', revisionId: 'r:a', text: 'text r:a', dispatchedAt: NOW.toISOString() }]);

  const again = await run(['--dispatch'], deps);
  assert.strictEqual(again.dispatched, 0);
  assert.ok(again.lines.some((l) => /r:b waits/.test(l)), again.lines.join('\n'));
  assert.strictEqual(fetchImpl.calls.length, 1);
});

test('--dispatch: GITHUB_TOKEN without a PAT; a failed dispatch fails the entry, pushes, logs nothing', async () => {
  const root = tmpRoot();
  const db = fakeDb({ [D]: {}, [C + '/2026-10-23']: { title: 'T', revisions: [rv('r:a', 'open')] } });
  const messaging = fakeMessaging();
  const fetchImpl = fakeFetch({ 'api.github.com': 404 });
  const { dispatched } = await run(['--dispatch'], { db, messaging, fetchImpl, env: { GITHUB_TOKEN: 'gh' }, now: NOW, config: config(root) });
  assert.strictEqual(dispatched, 0);
  assert.strictEqual(fetchImpl.calls[0].init.headers.Authorization, 'Bearer gh');
  const r = db.docs.get(C + '/2026-10-23').revisions[0];
  assert.strictEqual(r.status, 'failed');
  assert.match(r.reply, /HTTP 404/);
  assert.strictEqual(messaging.calls.length, 1);
  assert.ok(!fs.existsSync(path.join(root, 'revisions-log.json')));
});

test('--dispatch: a throwing notePosted leaves the posted entry open; without notePosted it is just noted', async () => {
  const db = fakeDb({ [C + '/2026-10-22']: { title: 'T', status: 'posted', revisions: [rv('r:p', 'open')] } });
  const boom = async () => { throw new Error('taste api HTTP 500'); };
  const { lines } = await run(['--dispatch'], { db, messaging: fakeMessaging(), fetchImpl: fakeFetch(), env: {}, now: NOW, config: config(tmpRoot(), { notePosted: boom }) });
  assert.ok(lines.some((l) => /^WARNING: .*HTTP 500/.test(l)), lines.join('\n'));
  assert.strictEqual(db.docs.get(C + '/2026-10-22').revisions[0].status, 'open');
  await run(['--dispatch'], { db, messaging: fakeMessaging(), fetchImpl: fakeFetch(), env: {}, now: NOW, config: config(tmpRoot()) });
  assert.strictEqual(db.docs.get(C + '/2026-10-22').revisions[0].status, 'noted');
});

test('--expire: timeout and reported failures → failed with reply, commit and a push; fresh and done untouched', async () => {
  const db = fakeDb({
    [D]: {},
    [C + '/2026-10-23']: { title: 'Today', revisions: [
      rv('r:old', 'queued', { queuedAt: ts('2026-10-23T06:00:00Z') }),
      rv('r:new', 'queued', { queuedAt: ts('2026-10-23T07:50:00Z') }),
      rv('r:done', 'done'),
    ] },
    [C + '/2026-10-24']: { title: 'Tomorrow', revisions: [rv('r:rep', 'queued', { queuedAt: ts('2026-10-23T07:55:00Z') })] },
  });
  const messaging = fakeMessaging();
  const sha = 'd'.repeat(40);
  const readOutcome = (id) => (id === '2026-10-24' ? { revisionId: 'r:rep', revisionFailed: true, revisionReply: 'no replacement found', commit: sha } : null);
  const { lines } = await run(['--expire'], { db, messaging, fetchImpl: fakeFetch(), env: {}, now: NOW, readOutcome, config: config(tmpRoot()) });
  const today = db.docs.get(C + '/2026-10-23').revisions;
  assert.deepStrictEqual(today.map((r) => r.status), ['failed', 'queued', 'done'], lines.join('\n'));
  assert.strictEqual(today[0].reply, CONFIG.replies.timeout);
  const rep = db.docs.get(C + '/2026-10-24').revisions[0];
  assert.deepStrictEqual([rep.status, rep.reply, rep.commit], ['failed', 'no replacement found', sha]);
  assert.deepStrictEqual(messaging.calls.map((c) => [c.notification.title, c.notification.body]), [['修改失敗', 'Today'], ['修改失敗', 'Tomorrow']]);
  assert.ok(lines.some((l) => /reported not doable/.test(l)), lines.join('\n'));
});

test('--expire: the default reader reads the outcome file under repoRoot', async () => {
  const root = tmpRoot();
  fs.mkdirSync(path.join(root, 'data'));
  fs.writeFileSync(path.join(root, 'data', '2026-10-23.json'), JSON.stringify({ revisionId: 'r:q', revisionFailed: true, revisionReply: 'already published' }));
  const db = fakeDb({ [C + '/2026-10-23']: { revisions: [rv('r:q', 'queued', { queuedAt: NOW })] } });
  await run(['--expire'], { db, messaging: fakeMessaging(), fetchImpl: fakeFetch(), env: {}, now: NOW, config: config(root) });
  const r = db.docs.get(C + '/2026-10-23').revisions[0];
  assert.deepStrictEqual([r.status, r.reply], ['failed', 'already published']);
});

test('--done <id>: marks the outcome revision done with the commit and pushes once', async () => {
  const db = fakeDb({ [D]: {}, [C + '/2026-10-23']: { revisions: [rv('r:q', 'queued')] } });
  const messaging = fakeMessaging();
  const sha = 'e'.repeat(40);
  const deps = { db, messaging, fetchImpl: fakeFetch(), env: {}, now: NOW, commit: sha, readOutcome: () => ({ revisionId: 'r:q', revisionReply: 'cover changed' }), config: config(tmpRoot()) };
  const { lines } = await run(['--done', '2026-10-23'], deps);
  const r = db.docs.get(C + '/2026-10-23').revisions[0];
  assert.deepStrictEqual([r.status, r.reply, r.commit, r.doneAt], ['done', 'cover changed', sha, NOW], lines.join('\n'));
  assert.deepStrictEqual(messaging.calls.map((c) => [c.notification.title, c.webpush.fcmOptions.link]), [['已改好', 'https://acme-admin.web.app/items/2026-10-23']]);
  const again = await run(['--done', '2026-10-23'], deps);
  assert.ok(again.lines.some((l) => /already done/.test(l)), again.lines.join('\n'));
  assert.strictEqual(messaging.calls.length, 1);
  const failed = await run(['--done', '2026-10-23'], Object.assign({}, deps, { readOutcome: () => ({ revisionId: 'r:q', revisionFailed: true }) }));
  assert.ok(failed.lines.some((l) => /nothing to mark/.test(l)));
});

test('no credentials → skipped; dry-run writes nothing; bad args and store errors are WARNING lines', async () => {
  assert.deepStrictEqual((await run(['--dispatch'], { env: {} })).lines, ['revisions: skipped: no FIREBASE_SERVICE_ACCOUNT']);
  const root = tmpRoot();
  const db = fakeDb({ [C + '/2026-10-23']: { title: 'T', revisions: [rv('r:a', 'open'), rv('r:q', 'queued', { queuedAt: ts('2026-10-23T01:00:00Z') })] } });
  const fetchImpl = fakeFetch();
  const dry = await run(['--dispatch', '--expire', '--dry-run'], { db, messaging: fakeMessaging(), fetchImpl, env: { GITHUB_TOKEN: 'g' }, now: NOW, config: config(root) });
  assert.ok(dry.lines.some((l) => /dry-run: would fail 2026-10-23 r:q timed out/.test(l)), dry.lines.join('\n'));
  assert.ok(dry.lines.some((l) => /dry-run: would wait|waits/.test(l)), dry.lines.join('\n'));
  assert.strictEqual(db.writes.length, 0);
  assert.strictEqual(fetchImpl.calls.length, 0);
  assert.ok(!fs.existsSync(path.join(root, 'revisions-log.json')));
  assert.match((await run([], { env: {} })).lines[0], /^WARNING: .*usage/);
  assert.match((await run(['--done'], { env: {} })).lines[0], /^WARNING: .*needs an item id/);
  const broken = fakeDb();
  broken.collection = () => ({ async get() { throw new Error('permission denied'); } });
  assert.deepStrictEqual((await run(['--expire'], { db: broken, env: {}, config: config(root) })).lines, ['WARNING: revisions failed (non-blocking): permission denied']);
});
