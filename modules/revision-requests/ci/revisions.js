'use strict';
/* revision-requests, CI side: the pure planners and the Firestore writes that
   move a revision request through open → queued → done / failed / noted.
   Host-agnostic: no collection path, repo or wording in here; the CLI
   (pull-revisions.js) holds those in its CONFIG.

   Every entry lives in the `revisions` array of an item doc. The PWA appends
   {id, text, status:'open', createdAt, by} with arrayUnion and never edits it;
   everything else goes through updateRevision (one transaction: read → map the
   array → set merge), guarded on the status the caller last saw. */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const STATUSES = ['open', 'queued', 'done', 'failed', 'noted'];
const DEFAULT_EXPIRE_MS = 90 * 60 * 1000;
const DEFAULT_LOG_MAX = 200;
const DAILY_ID = /^\d{4}-\d{2}-\d{2}$/;

// Firestore Timestamp (toDate), Date, ISO string or epoch ms → epoch ms; else NaN.
function millis(v) {
  if (v == null) return NaN;
  if (typeof v.toDate === 'function') return v.toDate().getTime();
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  return Date.parse(v);
}

/** The well-formed entries of a doc's `revisions` (anything with an id). */
const revisionsOf = (data) => (data && Array.isArray(data.revisions) ? data.revisions.filter((r) => r && r.id) : []);

const oldestFirst = (a, b) => (millis(a.createdAt) || 0) - (millis(b.createdAt) || 0) || String(a.id).localeCompare(String(b.id));

/* ---------- Firestore ---------- */

/* Changes one entry of `${docPath}.revisions` (matched by its id) in one
   transaction: an entry the PWA appends meanwhile makes the transaction retry
   rather than vanish. `from` lists the statuses the entry may have for the
   patch to apply; any other status leaves the doc untouched (an entry that
   went `done` while --expire was looking stays done).
   Returns {updated, revision} — revision as it was read, null when the doc or
   the entry is missing. */
async function updateRevision(db, docPath, revisionId, patch, { from = null } = {}) {
  const ref = db.doc(docPath);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { updated: false, revision: null };
    const data = (typeof snap.data === 'function' ? snap.data() : null) || {};
    const list = Array.isArray(data.revisions) ? data.revisions : [];
    const hit = list.find((r) => r && r.id === revisionId) || null;
    if (!hit) return { updated: false, revision: null };
    if (from && !from.includes(hit.status)) return { updated: false, revision: hit };
    const next = list.map((r) => (r === hit ? Object.assign({}, r, patch) : r));
    tx.set(ref, { revisions: next }, { merge: true });
    return { updated: true, revision: hit };
  });
}

/** Every doc of a collection as {id, data}. */
async function listDocs(db, collectionPath) {
  const snap = await db.collection(collectionPath).get();
  return (snap.docs || []).map((d) => ({ id: d.id, data: d.data() }));
}

/* ---------- planners (pure) ---------- */

/* What --dispatch does with one item ({id, data}): [{revision, action}],
   oldest first. action:
     'fail'     the item is not eligible (isEligible(id) false);
     'note'     the item is already posted (isPosted(data) true);
     'dispatch' the oldest open entry, when no entry of this item is queued;
     'wait'     open, but this item already has one in flight.
   Defaults: eligible = YYYY-MM-DD id, posted = data.status === 'posted'. */
function planDispatch(item, { isEligible = (id) => DAILY_ID.test(String(id || '')), isPosted = (data) => !!data && data.status === 'posted' } = {}) {
  const list = revisionsOf(item.data);
  const open = list.filter((r) => r.status === 'open').sort(oldestFirst);
  if (!open.length) return [];
  if (!isEligible(item.id)) return open.map((revision) => ({ revision, action: 'fail' }));
  if (isPosted(item.data)) return open.map((revision) => ({ revision, action: 'note' }));
  const busy = list.some((r) => r.status === 'queued');
  return open.map((revision, i) => ({ revision, action: !busy && i === 0 ? 'dispatch' : 'wait' }));
}

/* Does the host's outcome for this item report `revisionId` as not doable?
   `outcome` is what readOutcome(itemId) returned: the fields the worker
   session wrote into the host's outcome file — {revisionId, revisionReply,
   revisionFailed, commit?} — or null. Returns {reply, commit} or null. */
function reportedFailure(outcome, revisionId, fallbackReply) {
  if (!outcome || outcome.revisionId !== revisionId || outcome.revisionFailed !== true) return null;
  const reply = typeof outcome.revisionReply === 'string' && outcome.revisionReply.trim() ? outcome.revisionReply.trim() : fallbackReply;
  const commit = typeof outcome.commit === 'string' && /^[0-9a-f]{40}$/.test(outcome.commit) ? outcome.commit : null;
  return { reply, commit };
}

/* The `queued` entries of one item to fail: [{revision, reason, reply, commit}].
   'reported' (checked first, eligible items only): readOutcome(item.id) says the
   worker could not do this one. 'timeout': queued longer than expireMs
   (queuedAt, else createdAt). readOutcome is called at most once per item. */
function planExpire(item, now = new Date(), readOutcome = () => null, {
  isEligible = (id) => DAILY_ID.test(String(id || '')),
  expireMs = DEFAULT_EXPIRE_MS,
  timeoutReply = 'timeout',
  reportedReply = 'reported',
} = {}) {
  const out = [];
  let outcome;
  let read = false;
  for (const r of revisionsOf(item.data)) {
    if (r.status !== 'queued') continue;
    if (isEligible(item.id)) {
      if (!read) { outcome = readOutcome(item.id); read = true; }
      const reported = reportedFailure(outcome, r.id, reportedReply);
      if (reported) { out.push({ revision: r, reason: 'reported', reply: reported.reply, commit: reported.commit }); continue; }
    }
    const t = millis(r.queuedAt != null ? r.queuedAt : r.createdAt);
    if (Number.isFinite(t) && now.getTime() - t > expireMs) out.push({ revision: r, reason: 'timeout', reply: timeoutReply, commit: null });
  }
  return out;
}

/* The repository_dispatch body; client_payload is what the worker session gets. */
function dispatchBody(eventType, itemId, revision) {
  return { event_type: eventType, client_payload: { kitId: itemId, revisionId: revision.id, text: String(revision.text || ''), date: itemId } };
}

/* The dispatch log (a JSON array, newest last) with one more entry: fixed key
   order, 2-space indent, at most `max` entries, no duplicate revisionId.
   `before` is the file's text (null or unreadable → start empty). The worker
   session reads this file to find its request without Firestore. */
function appendLog(before, { kitId, revisionId, text, dispatchedAt }, max = DEFAULT_LOG_MAX) {
  let list = [];
  try {
    const parsed = before == null ? [] : JSON.parse(before);
    if (Array.isArray(parsed)) list = parsed.filter((e) => e && typeof e === 'object');
  } catch (_) { list = []; }
  list = list.map((e) => ({ kitId: e.kitId, revisionId: e.revisionId, text: e.text, dispatchedAt: e.dispatchedAt }));
  if (!list.some((e) => e.revisionId === revisionId)) {
    list.push({ kitId, revisionId, text, dispatchedAt: new Date(dispatchedAt).toISOString() });
  }
  return JSON.stringify(list.slice(-max), null, 2) + '\n';
}

/* Marks the outcome's revision `done` (+ doneAt, reply, commit when 40-hex)
   on `docPath`. Call it from the step that re-publishes the item after the
   worker's change. Nothing happens when the outcome names no revision or says
   revisionFailed: true. Returns {revisionId, updated, revision}; push only
   when updated (an earlier resend already made it done → updated false). */
async function markRevisionDone(db, docPath, outcome, { commit = null, now = new Date(), doneReply = 'done', from = ['queued', 'open'] } = {}) {
  if (!outcome || typeof outcome.revisionId !== 'string' || !outcome.revisionId || outcome.revisionFailed === true) {
    return { revisionId: null, updated: false, revision: null };
  }
  const reply = typeof outcome.revisionReply === 'string' && outcome.revisionReply.trim() ? outcome.revisionReply.trim() : doneReply;
  const patch = { status: 'done', doneAt: now, reply };
  if (typeof commit === 'string' && /^[0-9a-f]{40}$/.test(commit)) patch.commit = commit;
  const res = await updateRevision(db, docPath, outcome.revisionId, patch, { from });
  return { revisionId: outcome.revisionId, ...res };
}

/* ---------- reading the host's outcome file ---------- */

/* {revisionId, revisionReply, revisionFailed} from a JSON file (any extra
   fields ignored), or null when missing / unreadable / names no revision. */
function readOutcomeFile(file) {
  let obj = null;
  try { obj = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return null; }
  if (!obj || typeof obj.revisionId !== 'string' || !obj.revisionId) return null;
  return { revisionId: obj.revisionId, revisionReply: obj.revisionReply, revisionFailed: obj.revisionFailed === true };
}

/* The last commit touching `rel` in the repo at `root` (40-hex) or null. */
function lastCommitFor(root, rel) {
  try {
    const sha = execFileSync('git', ['log', '-1', '--format=%H', '--', rel], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return /^[0-9a-f]{40}$/.test(sha) ? sha : null;
  } catch (_) { return null; }
}

/* GITHUB_SHA, else git HEAD at `root`; null unless 40-hex. The sha a resend ran on. */
function headCommit(env = process.env, root = process.cwd()) {
  let sha = env.GITHUB_SHA || '';
  if (!sha) {
    try { sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (_) { sha = ''; }
  }
  return /^[0-9a-f]{40}$/.test(sha) ? sha : null;
}

/* readOutcome for planExpire: the outcome file at outcomePath(id) under root,
   with `commit` = the last commit touching it. */
function fileOutcomeReader(root, outcomePath) {
  return (itemId) => {
    const rel = outcomePath(itemId);
    const o = readOutcomeFile(path.join(root, rel));
    return o ? Object.assign(o, { commit: lastCommitFor(root, rel) }) : null;
  };
}

module.exports = {
  STATUSES, DEFAULT_EXPIRE_MS, DEFAULT_LOG_MAX, DAILY_ID,
  millis, revisionsOf, updateRevision, listDocs,
  planDispatch, planExpire, reportedFailure, dispatchBody, appendLog, markRevisionDone,
  readOutcomeFile, lastCommitFor, headCommit, fileOutcomeReader,
};
