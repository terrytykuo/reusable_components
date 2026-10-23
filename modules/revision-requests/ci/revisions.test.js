'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const R = require('./revisions');
const { fakeDb } = require('./fakes');

const NOW = new Date('2026-10-23T08:00:00.000Z');
const ts = (iso) => ({ toDate: () => new Date(iso) }); // Firestore Timestamp stand-in
const rv = (id, status, extra = {}) => Object.assign({ id, text: 'text ' + id, status, createdAt: ts('2026-10-23T06:00:00Z'), by: 't@x' }, extra);
const tmpRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'revision-requests-'));

test('millis: Timestamp, Date, number, ISO, junk', () => {
  assert.strictEqual(R.millis(ts('2026-10-23T00:00:00Z')), Date.parse('2026-10-23T00:00:00Z'));
  assert.strictEqual(R.millis(NOW), NOW.getTime());
  assert.strictEqual(R.millis(5), 5);
  assert.strictEqual(R.millis('2026-10-23T00:00:00Z'), Date.parse('2026-10-23T00:00:00Z'));
  assert.ok(Number.isNaN(R.millis(null)));
});

test('updateRevision: patches one entry, keeps the others, honours `from`', async () => {
  const a = { id: 'r:a', text: 'A', status: 'queued' };
  const b = { id: 'r:b', text: 'B', status: 'open' };
  const db = fakeDb({ 'admin/content/items/x': { title: 'T', revisions: [a, b] } });
  const res = await R.updateRevision(db, 'admin/content/items/x', 'r:a', { status: 'done', reply: 'ok' }, { from: ['queued'] });
  assert.deepStrictEqual(res, { updated: true, revision: a });
  assert.deepStrictEqual(db.writes[0].opts, { merge: true });
  assert.deepStrictEqual(Object.keys(db.writes[0].data), ['revisions']);
  const after = db.docs.get('admin/content/items/x');
  assert.deepStrictEqual(after.revisions, [{ id: 'r:a', text: 'A', status: 'done', reply: 'ok' }, b]);
  assert.strictEqual(after.title, 'T');
  const again = await R.updateRevision(db, 'admin/content/items/x', 'r:a', { status: 'failed' }, { from: ['queued'] });
  assert.strictEqual(again.updated, false);
  assert.strictEqual(again.revision.status, 'done');
  assert.strictEqual(db.writes.length, 1);
  assert.deepStrictEqual(await R.updateRevision(db, 'admin/content/items/x', 'r:zz', {}), { updated: false, revision: null });
  assert.deepStrictEqual(await R.updateRevision(db, 'admin/content/items/none', 'r:a', {}), { updated: false, revision: null });
});

test('planDispatch: not eligible fails, posted notes, oldest open dispatches, the rest wait', () => {
  const older = rv('r:a', 'open', { createdAt: ts('2026-10-23T05:00:00Z') });
  const newer = rv('r:b', 'open', { createdAt: ts('2026-10-23T06:00:00Z') });
  const ids = (plan) => plan.map((p) => [p.revision.id, p.action]);
  assert.deepStrictEqual(ids(R.planDispatch({ id: '2026-10-23', data: { revisions: [newer, older, rv('r:c', 'done')] } })), [['r:a', 'dispatch'], ['r:b', 'wait']]);
  assert.deepStrictEqual(ids(R.planDispatch({ id: '2026-10-23', data: { revisions: [rv('r:q', 'queued'), older] } })), [['r:a', 'wait']]);
  assert.deepStrictEqual(R.planDispatch({ id: '2026-10-23', data: { status: 'posted', revisions: [older, newer] } }).map((p) => p.action), ['note', 'note']);
  assert.deepStrictEqual(R.planDispatch({ id: 'special-x', data: { revisions: [older] } }).map((p) => p.action), ['fail']);
  assert.deepStrictEqual(R.planDispatch({ id: '2026-10-23', data: {} }), []);
  // Host predicates
  const custom = { isEligible: (id) => id.startsWith('post-'), isPosted: (d) => d.published === true };
  assert.deepStrictEqual(R.planDispatch({ id: 'post-1', data: { status: 'posted', revisions: [older] } }, custom).map((p) => p.action), ['dispatch']);
  assert.deepStrictEqual(R.planDispatch({ id: 'post-1', data: { published: true, revisions: [older] } }, custom).map((p) => p.action), ['note']);
  assert.deepStrictEqual(R.planDispatch({ id: '2026-10-23', data: { revisions: [older] } }, custom).map((p) => p.action), ['fail']);
});

test('planExpire: timeout by queuedAt else createdAt; a reported failure wins; one readOutcome per item', () => {
  const item = { id: '2026-10-23', data: { revisions: [
    rv('r:old', 'queued', { queuedAt: ts('2026-10-23T06:29:00Z') }),
    rv('r:fresh', 'queued', { queuedAt: ts('2026-10-23T07:00:00Z') }),
    rv('r:noq', 'queued', { createdAt: ts('2026-10-23T05:00:00Z') }),
    rv('r:done', 'done', { queuedAt: ts('2026-10-23T01:00:00Z') }),
  ] } };
  const o = { timeoutReply: 'T', reportedReply: 'R' };
  assert.deepStrictEqual(R.planExpire(item, NOW, () => null, o).map((p) => [p.revision.id, p.reason, p.reply]), [['r:old', 'timeout', 'T'], ['r:noq', 'timeout', 'T']]);
  let calls = 0;
  const sha = 'c'.repeat(40);
  const readOutcome = (id) => { calls++; assert.strictEqual(id, '2026-10-23'); return { revisionId: 'r:fresh', revisionFailed: true, revisionReply: ' 做不到 ', commit: sha }; };
  assert.deepStrictEqual(R.planExpire(item, NOW, readOutcome, o).map((p) => [p.revision.id, p.reason, p.reply, p.commit]),
    [['r:old', 'timeout', 'T', null], ['r:fresh', 'reported', '做不到', sha], ['r:noq', 'timeout', 'T', null]]);
  assert.strictEqual(calls, 1);
  // Not failed, or another revision → no report; empty reply → fallback.
  assert.strictEqual(R.planExpire(item, NOW, () => ({ revisionId: 'r:fresh', revisionFailed: false }), o).length, 2);
  assert.strictEqual(R.planExpire(item, NOW, () => ({ revisionId: 'r:fresh', revisionFailed: true, commit: 'nothex' }), o)[1].reply, 'R');
  assert.strictEqual(R.planExpire(item, NOW, () => ({ revisionId: 'r:fresh', revisionFailed: true, commit: 'nothex' }), o)[1].commit, null);
  // Ineligible items never consult the outcome; expireMs is configurable.
  assert.strictEqual(R.planExpire({ id: 'special-x', data: item.data }, NOW, () => { throw new Error('no call'); }, o).length, 2);
  assert.strictEqual(R.planExpire(item, NOW, () => null, { expireMs: 30 * 60 * 1000 }).length, 3);
});

test('dispatchBody shape', () => {
  assert.deepStrictEqual(R.dispatchBody('revision-request', '2026-10-23', rv('r:a', 'open')), {
    event_type: 'revision-request',
    client_payload: { kitId: '2026-10-23', revisionId: 'r:a', text: 'text r:a', date: '2026-10-23' },
  });
});

test('appendLog: newest last, fixed key order, no duplicate, capped', () => {
  const one = R.appendLog(null, { kitId: 'k', revisionId: 'r:1', text: 't', dispatchedAt: NOW });
  assert.strictEqual(one, JSON.stringify([{ kitId: 'k', revisionId: 'r:1', text: 't', dispatchedAt: NOW.toISOString() }], null, 2) + '\n');
  assert.strictEqual(R.appendLog(one, { kitId: 'k', revisionId: 'r:1', text: 't', dispatchedAt: NOW }), one);
  assert.strictEqual(JSON.parse(R.appendLog('not json', { kitId: 'k', revisionId: 'r:2', text: 't', dispatchedAt: NOW })).length, 1);
  let text = null;
  for (let i = 0; i < 15; i++) text = R.appendLog(text, { kitId: 'k', revisionId: 'r:' + i, text: 't', dispatchedAt: NOW }, 10);
  const list = JSON.parse(text);
  assert.strictEqual(list.length, 10);
  assert.strictEqual(list[0].revisionId, 'r:5');
  assert.strictEqual(list[9].revisionId, 'r:14');
});

test('markRevisionDone: queued → done with reply, doneAt and a hex commit, once', async () => {
  const q = rv('r:q', 'queued');
  const other = rv('r:o', 'open');
  const db = fakeDb({ 'c/d/x': { revisions: [q, other] } });
  const sha = 'a'.repeat(40);
  const res = await R.markRevisionDone(db, 'c/d/x', { revisionId: 'r:q', revisionReply: ' moved story 3 up ' }, { commit: sha, now: NOW });
  assert.strictEqual(res.updated, true);
  assert.strictEqual(res.revisionId, 'r:q');
  assert.deepStrictEqual(db.docs.get('c/d/x').revisions, [Object.assign({}, q, { status: 'done', doneAt: NOW, reply: 'moved story 3 up', commit: sha }), other]);
  const again = await R.markRevisionDone(db, 'c/d/x', { revisionId: 'r:q' }, { now: NOW });
  assert.strictEqual(again.updated, false);
});

test('markRevisionDone: fallback reply, bad commit dropped, failed outcome or none → nothing', async () => {
  const db = fakeDb({ 'c/d/x': { revisions: [rv('r:q', 'open')] } });
  await R.markRevisionDone(db, 'c/d/x', { revisionId: 'r:q' }, { commit: 'HEAD', now: NOW, doneReply: 'DONE' });
  const r = db.docs.get('c/d/x').revisions[0];
  assert.strictEqual(r.reply, 'DONE');
  assert.ok(!('commit' in r));
  const db2 = fakeDb({ 'c/d/x': { revisions: [rv('r:q', 'queued')] } });
  assert.deepStrictEqual(await R.markRevisionDone(db2, 'c/d/x', { revisionId: 'r:q', revisionFailed: true }), { revisionId: null, updated: false, revision: null });
  assert.deepStrictEqual(await R.markRevisionDone(db2, 'c/d/x', null), { revisionId: null, updated: false, revision: null });
  assert.strictEqual(db2.writes.length, 0);
});

function writeOutcome(root, id, obj, { commit = false } = {}) {
  const rel = path.join('data', id + '.json');
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  fs.writeFileSync(path.join(root, rel), JSON.stringify(obj));
  if (!commit) return null;
  const git = (...a) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@x', '-c', 'commit.gpgsign=false', ...a], { cwd: root, encoding: 'utf8' }).trim();
  git('init', '-q');
  git('add', rel);
  git('commit', '-q', '-m', 'Revision r:q: cannot');
  return git('rev-parse', 'HEAD');
}

test('readOutcomeFile / fileOutcomeReader: only files naming a revision; commit from git log', () => {
  const root = tmpRoot();
  const read = R.fileOutcomeReader(root, (id) => path.join('data', id + '.json'));
  assert.strictEqual(read('2026-10-23'), null);
  writeOutcome(root, '2026-10-23', { title: 'no revision here' });
  assert.strictEqual(read('2026-10-23'), null);
  writeOutcome(root, '2026-10-23', { revisionId: 'r:q', revisionReply: 'x', revisionFailed: 'yes' });
  assert.deepStrictEqual(read('2026-10-23'), { revisionId: 'r:q', revisionReply: 'x', revisionFailed: false, commit: null });
  const sha = writeOutcome(root, '2026-10-23', { revisionId: 'r:q', revisionFailed: true, revisionReply: '找不到替代' }, { commit: true });
  assert.deepStrictEqual(read('2026-10-23'), { revisionId: 'r:q', revisionReply: '找不到替代', revisionFailed: true, commit: sha });
  assert.strictEqual(R.headCommit({}, root), sha);
  assert.strictEqual(R.headCommit({ GITHUB_SHA: 'b'.repeat(40) }, root), 'b'.repeat(40));
  assert.strictEqual(R.headCommit({ GITHUB_SHA: 'nope' }, root), null);
});
