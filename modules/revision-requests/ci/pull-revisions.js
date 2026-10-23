#!/usr/bin/env node
'use strict';
/* revision-requests CLI, run by the Actions cron (workflow/revisions.yml.example).

   --expire    every `queued` entry → `failed` + a "failed" push when
                 - the worker session reported it cannot be done (the host's
                   outcome file for that item names this revisionId with
                   revisionFailed: true) → reply = its revisionReply; or
                 - it has been queued longer than CONFIG.expireMs.
   --dispatch  every `open` entry:
                 - item not eligible (CONFIG.isEligible) → `failed` + push;
                 - item already posted (CONFIG.isPosted) → CONFIG.notePosted()
                   side channel (if any), then `noted`; no worker session;
                 - item already has a `queued` entry → stays `open` (one worker
                   session per item at a time; the next run picks it up);
                 - otherwise the oldest: `queued` + queuedAt, a
                   repository_dispatch on CONFIG.repo (event CONFIG.eventType),
                   and one entry appended to CONFIG.logFile. Commit that file
                   to the branch the routine watches: the push is what wakes it.
               A failed dispatch call fails the entry (not retried).
   --done <id> mark the outcome's revision of item <id> `done` and push "done".
               Run it in the step that re-publishes the item after the worker's
               change (or call markRevisionDone from your own publish script).
   --dry-run   print what would happen; nothing written, dispatched or pushed.

   Contract: NEVER fails the workflow. No credentials → "skipped", exit 0;
   any error → one WARNING line, exit 0.

   Env: FIREBASE_SERVICE_ACCOUNT (JSON or path; see CONFIG.envVars),
   GITHUB_TOKEN (GH_DISPATCH_TOKEN overrides it), GITHUB_OUTPUT (dispatched=N
   is appended for the commit message), GITHUB_SHA (the --done commit).

   Usage: node pull-revisions.js --expire|--dispatch|--done <id> [--dry-run] */
const fs = require('node:fs');
const path = require('node:path');
const rev = require('./revisions');

/* ======== Host-specific: edit this block ======== */
const CONFIG = {
  /** Collection of the item docs the PWA shows (odd segment count). */
  collectionPath: 'admin/content/items',
  /** Must match the PWA's brand.devicesPath. */
  devicesPath: 'admin/pushTokens/devices',
  /** Service-account env vars, tried in order (admin-pwa initAdmin). */
  envVars: ['FIREBASE_SERVICE_ACCOUNT', 'FIREBASE_ADMIN_KEY_PATH', 'GOOGLE_APPLICATION_CREDENTIALS'],
  /** 'owner/repo' that receives the repository_dispatch. */
  repo: 'OWNER/REPO',
  eventType: 'revision-request',
  /** Repo root of the checkout (the workflow runs from it). */
  repoRoot: process.cwd(),
  /** Dispatch log, relative to repoRoot; the worker reads it, the workflow commits it. */
  logFile: 'revisions-log.json',
  logMax: 200,
  /** Where the worker session writes {revisionId, revisionReply, revisionFailed} for an item, relative to repoRoot. */
  outcomePath: (id) => path.join('data', id + '.json'),
  /** Items the worker can handle. Others fail at once with replies.notEligible. */
  isEligible: (id) => rev.DAILY_ID.test(String(id || '')),
  /** Items already published: the text is only recorded (see notePosted), never dispatched. */
  isPosted: (data) => !!data && data.status === 'posted',
  /** Optional side channel for posted items, e.g. POST the text to a taste log. Throw to leave the entry open for the next run. */
  notePosted: null, // async (item, revision, { env, fetchImpl }) => {}
  expireMs: rev.DEFAULT_EXPIRE_MS,
  /** The PWA's origin; push links open the item's page. */
  adminUrl: 'https://YOUR-SITE.web.app',
  linkFor: (id, cfg) => cfg.adminUrl + '/items/' + encodeURIComponent(id),
  replies: {
    timeout: '逾時：雲端 session 沒有在 90 分鐘內完成，請看 claude.ai 的 routine run',
    reported: '雲端 session 回報做不到，沒有說明原因',
    notEligible: '這種項目還沒接自動修改',
    dispatchFailed: (message) => '派送失敗：' + message,
    done: '已照意見改好',
  },
  push: { failed: '修改失敗', done: '已改好' },
};
/* ======== end of host-specific block ======== */

/* admin-pwa's CI helper: next to this file when the host copied both, else
   the sibling module in reusable_components. */
function loadAdminFirestore() {
  try { return require('./admin-firestore'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }
  return require('../../admin-pwa/server/ci/admin-firestore');
}

/* firebase-admin resolved from THIS folder (so the helper works even when it
   lives in another folder without node_modules). */
const firebaseSdk = () => ({ app: require('firebase-admin/app'), firestore: require('firebase-admin/firestore'), messaging: require('firebase-admin/messaging') });

function parseArgs(argv) {
  const i = argv.indexOf('--done');
  return {
    dispatch: argv.includes('--dispatch'),
    expire: argv.includes('--expire'),
    done: i > -1 ? argv[i + 1] || '' : null,
    dryRun: argv.includes('--dry-run'),
  };
}

async function fireDispatch(cfg, itemId, revision, { token, fetchImpl }) {
  if (!token) throw new Error('no GITHUB_TOKEN / GH_DISPATCH_TOKEN');
  const res = await fetchImpl('https://api.github.com/repos/' + cfg.repo + '/dispatches', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
    body: JSON.stringify(rev.dispatchBody(cfg.eventType, itemId, revision)),
  });
  if (!res.ok) throw new Error('repository_dispatch HTTP ' + res.status);
}

/* Returns {lines, dispatched}. Never throws. deps (tests): {db, messaging,
   fetchImpl, env, now, config (merged over CONFIG), readOutcome, commit}. */
async function run(argv, deps = {}) {
  const lines = [];
  let dispatched = 0;
  const say = (s) => lines.push('revisions: ' + s);
  const warn = (s, e) => lines.push('WARNING: revisions ' + s + ' (non-blocking): ' + ((e && e.message) || e));
  try {
    const cfg = Object.assign({}, CONFIG, deps.config || {});
    cfg.replies = Object.assign({}, CONFIG.replies, (deps.config || {}).replies || {});
    cfg.push = Object.assign({}, CONFIG.push, (deps.config || {}).push || {});
    const opts = parseArgs(argv);
    if (!opts.dispatch && !opts.expire && opts.done === null) throw new Error('usage: pull-revisions.js --expire|--dispatch|--done <id> [--dry-run]');
    if (opts.done === '') throw new Error('--done needs an item id');
    const env = deps.env || process.env;
    const now = deps.now || new Date();
    const fetchImpl = deps.fetchImpl || fetch;
    const af = loadAdminFirestore();

    let db = deps.db;
    let messaging = deps.messaging;
    if (!db) {
      if (!af.credentialFromEnv(env, cfg.envVars)) { say('skipped: no ' + cfg.envVars[0]); return { lines, dispatched }; }
      const ctx = af.initAdmin({ env, envVars: cfg.envVars, sdk: firebaseSdk() });
      db = ctx.db;
      messaging = ctx.messaging;
    }
    const docPath = (id) => cfg.collectionPath + '/' + id;
    const push = async (title, item) => {
      const r = await af.sendPush({ title, body: String((item.data && item.data.title) || item.id), link: cfg.linkFor(item.id, cfg), tag: 'revision-' + item.id }, cfg.devicesPath, { deps: { db, messaging } });
      return 'push sent ' + r.sent + ', failed ' + r.failed;
    };
    const fail = async (item, r, reply, from, extra = {}) => {
      const { updated } = await rev.updateRevision(db, docPath(item.id), r.id, Object.assign({ status: 'failed', reply }, extra), { from });
      return updated ? 'failed; ' + await push(cfg.push.failed, item) : 'changed meanwhile, left alone';
    };

    if (opts.done !== null) {
      const readOutcome = deps.readOutcome || ((id) => rev.readOutcomeFile(path.join(cfg.repoRoot, cfg.outcomePath(id))));
      const outcome = readOutcome(opts.done);
      if (!outcome || outcome.revisionFailed === true) {
        say(opts.done + ': outcome names no finished revision, nothing to mark');
      } else if (opts.dryRun) {
        say('dry-run: would mark ' + opts.done + ' ' + outcome.revisionId + ' done');
      } else {
        const commit = deps.commit !== undefined ? deps.commit : rev.headCommit(env, cfg.repoRoot);
        const res = await rev.markRevisionDone(db, docPath(opts.done), outcome, { commit, now, doneReply: cfg.replies.done });
        if (!res.revision) say(opts.done + ' revision ' + outcome.revisionId + ' not found on the doc');
        else if (!res.updated) say(opts.done + ' revision ' + outcome.revisionId + ' already ' + res.revision.status + ', left alone');
        else say(opts.done + ' revision ' + outcome.revisionId + ' done; ' + await push(cfg.push.done, { id: opts.done, data: null }));
      }
    }

    const items = (opts.expire || opts.dispatch) ? await rev.listDocs(db, cfg.collectionPath) : [];

    if (opts.expire) {
      const readOutcome = deps.readOutcome || rev.fileOutcomeReader(cfg.repoRoot, cfg.outcomePath);
      for (const item of items) {
        const plan = rev.planExpire(item, now, readOutcome, { isEligible: cfg.isEligible, expireMs: cfg.expireMs, timeoutReply: cfg.replies.timeout, reportedReply: cfg.replies.reported });
        for (const { revision: r, reason, reply, commit } of plan) {
          const what = reason === 'reported' ? ' reported not doable' : ' timed out';
          if (opts.dryRun) { say('dry-run: would fail ' + item.id + ' ' + r.id + what + ': ' + reply); continue; }
          try { say(item.id + ' ' + r.id + what + ' → ' + await fail(item, r, reply, ['queued'], commit ? { commit } : {})); }
          catch (e) { warn('expire failed for ' + item.id + ' ' + r.id, e); }
        }
      }
    }

    if (opts.dispatch) {
      const token = env.GH_DISPATCH_TOKEN || env.GITHUB_TOKEN || '';
      const logPath = path.join(cfg.repoRoot, cfg.logFile);
      for (const item of items) {
        for (const { revision: r, action } of rev.planDispatch(item, { isEligible: cfg.isEligible, isPosted: cfg.isPosted })) {
          const tag = item.id + ' ' + r.id;
          if (action === 'wait') { say(tag + ' waits (this item already has one queued)'); continue; }
          if (opts.dryRun) {
            say('dry-run: would ' + action + ' ' + tag);
            if (action === 'dispatch') lines.push(JSON.stringify(rev.dispatchBody(cfg.eventType, item.id, r), null, 2));
            continue;
          }
          try {
            if (action === 'fail') {
              say(tag + ' not eligible → ' + await fail(item, r, cfg.replies.notEligible, ['open']));
            } else if (action === 'note') {
              if (cfg.notePosted) await cfg.notePosted(item, r, { env, fetchImpl });
              await rev.updateRevision(db, docPath(item.id), r.id, { status: 'noted' }, { from: ['open'] });
              say(tag + ' item already posted → noted');
            } else {
              // queued first: a failed dispatch then fails the entry instead of
              // leaving it open to re-dispatch on every run.
              const { updated } = await rev.updateRevision(db, docPath(item.id), r.id, { status: 'queued', queuedAt: now }, { from: ['open'] });
              if (!updated) { say(tag + ' changed meanwhile, left alone'); continue; }
              try { await fireDispatch(cfg, item.id, r, { token, fetchImpl }); }
              catch (e) { say(tag + ' dispatch failed (' + e.message + ') → ' + await fail(item, r, cfg.replies.dispatchFailed(e.message), ['queued'])); continue; }
              let before = null;
              try { before = fs.readFileSync(logPath, 'utf8'); } catch (_) { /* first one */ }
              fs.mkdirSync(path.dirname(logPath), { recursive: true });
              fs.writeFileSync(logPath, rev.appendLog(before, { kitId: item.id, revisionId: r.id, text: String(r.text || ''), dispatchedAt: now }, cfg.logMax), 'utf8');
              dispatched += 1;
              say(tag + ' queued and dispatched');
            }
          } catch (e) { warn(action + ' failed for ' + tag, e); }
        }
      }
      say('dispatched ' + dispatched);
    }
  } catch (e) {
    warn('failed', e);
  }
  return { lines, dispatched };
}

if (require.main === module) {
  run(process.argv.slice(2)).then(({ lines, dispatched }) => {
    for (const l of lines) (/^WARNING/.test(l) ? console.warn : console.log)(l);
    if (process.env.GITHUB_OUTPUT) {
      try { fs.appendFileSync(process.env.GITHUB_OUTPUT, 'dispatched=' + dispatched + '\n'); } catch (_) { /* cosmetic */ }
    }
    process.exit(0);
  }, (e) => {
    console.warn('WARNING: revisions failed (non-blocking): ' + ((e && e.message) || e));
    process.exit(0);
  });
}

module.exports = { CONFIG, run, parseArgs, loadAdminFirestore };
