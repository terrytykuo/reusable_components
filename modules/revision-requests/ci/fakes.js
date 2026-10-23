'use strict';
/* In-memory stand-ins for firebase-admin Firestore and Messaging, only the
   calls revisions.js and admin-pwa's admin-firestore.js make. Test helper. */

function fakeDb(initial = {}) {
  const docs = new Map(Object.entries(initial)); // path → data
  const writes = [];
  const ref = (p) => ({ path: p, id: p.split('/').pop(), async delete() { docs.delete(p); writes.push({ op: 'delete', path: p }); } });
  const snap = (p) => ({ exists: docs.has(p), id: p.split('/').pop(), ref: ref(p), data: () => docs.get(p) });
  return {
    docs,
    writes,
    doc: ref,
    collection(p) {
      return {
        async get() {
          const prefix = p + '/';
          const hits = [...docs.keys()].filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/')).sort();
          return { docs: hits.map(snap) };
        },
      };
    },
    async runTransaction(fn) {
      return fn({
        async get(r) { return snap(r.path); },
        set(r, data, opts) {
          writes.push({ op: 'set', path: r.path, data, opts: opts || null });
          docs.set(r.path, opts && opts.merge ? Object.assign({}, docs.get(r.path) || {}, data) : data);
        },
      });
    },
  };
}

/* results: per token, true (ok) or an error code string. Missing = ok. */
function fakeMessaging(results = {}) {
  const calls = [];
  return {
    calls,
    async sendEachForMulticast(msg) {
      calls.push(msg);
      const responses = msg.tokens.map((t) => (results[t] === undefined || results[t] === true ? { success: true } : { success: false, error: { code: results[t] } }));
      const successCount = responses.filter((r) => r.success).length;
      return { successCount, failureCount: responses.length - successCount, responses };
    },
  };
}

// Records every call; answers with `status` per URL substring (default 204).
function fakeFetch(statusFor = {}) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init, body: init && init.body ? JSON.parse(init.body) : null });
    const hit = Object.keys(statusFor).find((k) => url.includes(k));
    const status = hit ? statusFor[hit] : 204;
    return { ok: status >= 200 && status < 300, status };
  };
  impl.calls = calls;
  return impl;
}

module.exports = { fakeDb, fakeMessaging, fakeFetch };
