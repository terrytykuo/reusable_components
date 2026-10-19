import { describe, expect, it, vi } from 'vitest';
import type { BatchResponse, MulticastMessage } from 'firebase-admin/messaging';
import type { DocumentReference } from 'firebase-admin/firestore';
import { buildMessage, notifyDevices, sendToTokens, truncate } from '../onKitCreated';

describe('truncate', () => {
  it('caps at 120 code points with an ellipsis and leaves shorter text alone', () => {
    const body = truncate('字'.repeat(200));
    expect(Array.from(body)).toHaveLength(120);
    expect(body.endsWith('…')).toBe(true);
    expect(body.startsWith('字'.repeat(119))).toBe(true);
    const exact = 'a'.repeat(120);
    expect(truncate(exact)).toBe(exact);
  });
});

describe('buildMessage', () => {
  it('puts the link in fcmOptions and data, the tag and icon in webpush.notification', () => {
    const m = buildMessage({ title: 'New', body: 'Body', link: 'https://x.web.app/items/1', tag: 'items-1' }, { kind: 'items', id: '1' });
    expect(m).toEqual({
      notification: { title: 'New', body: 'Body' },
      webpush: { fcmOptions: { link: 'https://x.web.app/items/1' }, notification: { icon: '/icons/icon-192.png', tag: 'items-1' } },
      data: { kind: 'items', id: '1', link: 'https://x.web.app/items/1' },
    });
  });
  it('omits the tag when none is given and truncates the body', () => {
    const m = buildMessage({ title: 't', body: 'b'.repeat(300), link: 'https://x' }, {}, '/i.png');
    expect(m.webpush?.notification).toEqual({ icon: '/i.png' });
    expect(Array.from(m.notification?.body ?? '')).toHaveLength(120);
  });
});

type Doc = { id: string; ref: DocumentReference };
const docs = (n: number): Doc[] =>
  Array.from({ length: n }, (_, i) => ({ id: `tok${i}`, ref: { path: `admin/pushTokens/devices/tok${i}` } as unknown as DocumentReference }));

const ok = { success: true as const, messageId: 'm' };
const err = (code: string) => ({ success: false as const, error: { code, message: code } as never });

/** Fake messaging: `respond(callIndex, tokens)` returns the per-token responses or throws. */
function fakeMessaging(respond: (call: number, tokens: string[]) => BatchResponse['responses']) {
  const calls: MulticastMessage[] = [];
  return {
    calls,
    messaging: {
      sendEachForMulticast: async (m: MulticastMessage): Promise<BatchResponse> => {
        calls.push(m);
        const responses = respond(calls.length - 1, m.tokens);
        const successCount = responses.filter((r) => r.success).length;
        return { responses, successCount, failureCount: responses.length - successCount };
      },
    },
  };
}

const msg = { notification: { title: 't', body: 'b' } };

describe('sendToTokens', () => {
  it('chunks 1,001 tokens into 3 calls of at most 500', async () => {
    const f = fakeMessaging((_c, t) => t.map(() => ok));
    const res = await sendToTokens(f.messaging, docs(1001), msg);
    expect(f.calls.map((c) => c.tokens.length)).toEqual([500, 500, 1]);
    expect(f.calls[0].notification).toEqual(msg.notification);
    expect(res).toEqual({ sent: 1001, failed: 0, stale: [], errors: {} });
  });
  it('maps a stale response in chunk 2 to the right ref', async () => {
    const d = docs(1001);
    const f = fakeMessaging((c, t) => t.map((_, i) => (c === 1 && i === 7 ? err('messaging/registration-token-not-registered') : ok)));
    const res = await sendToTokens(f.messaging, d, msg);
    expect(res.stale).toEqual([d[507].ref]);
    expect(res.sent).toBe(1000);
    expect(res.failed).toBe(1);
    expect(res.errors).toEqual({ 'messaging/registration-token-not-registered': 1 });
  });
  it('prunes invalid tokens but not other errors, and counts every error code', async () => {
    const d = docs(4);
    const f = fakeMessaging(() => [
      err('messaging/invalid-registration-token'),
      err('messaging/internal-error'),
      err('messaging/internal-error'),
      ok,
    ]);
    const res = await sendToTokens(f.messaging, d, msg);
    expect(res.stale).toEqual([d[0].ref]);
    expect(res).toMatchObject({ sent: 1, failed: 3 });
    expect(res.errors).toEqual({ 'messaging/invalid-registration-token': 1, 'messaging/internal-error': 2 });
  });
  it('a chunk that throws counts as failed, prunes nothing, and the loop continues', async () => {
    const d = docs(1001);
    const f = fakeMessaging((c, t) => {
      if (c === 0) throw Object.assign(new Error('boom'), { code: 'app/network-error' });
      return t.map((_, i) => (c === 2 && i === 0 ? err('messaging/registration-token-not-registered') : ok));
    });
    const res = await sendToTokens(f.messaging, d, msg);
    expect(f.calls).toHaveLength(3);
    expect(res.stale).toEqual([d[1000].ref]);
    expect(res.sent).toBe(500);
    expect(res.failed).toBe(501);
    expect(res.errors).toEqual({ 'app/network-error': 1, 'messaging/registration-token-not-registered': 1 });
  });
  it('sends nothing for an empty list', async () => {
    const f = fakeMessaging(() => []);
    expect(await sendToTokens(f.messaging, [], msg)).toEqual({ sent: 0, failed: 0, stale: [], errors: {} });
    expect(f.calls).toHaveLength(0);
  });
});

describe('notifyDevices', () => {
  function fakeDb(ids: string[]) {
    const deleted: string[] = [];
    const paths: string[] = [];
    const snapDocs = ids.map((id) => ({ id, ref: { path: `p/${id}`, delete: vi.fn(async () => { deleted.push(id); }) } }));
    return {
      deleted,
      paths,
      db: {
        collection: (path: string) => {
          paths.push(path);
          return { get: async () => ({ empty: snapDocs.length === 0, size: snapDocs.length, docs: snapDocs }) };
        },
      },
    };
  }

  it('reads the devices collection, sends, and deletes stale tokens', async () => {
    const f = fakeDb(['a', 'b']);
    const m = fakeMessaging((_c, t) => t.map((tok) => (tok === 'b' ? err('messaging/registration-token-not-registered') : ok)));
    const res = await notifyDevices(f.db as never, m.messaging, 'admin/pushTokens/devices', msg);
    expect(f.paths).toEqual(['admin/pushTokens/devices']);
    expect(m.calls[0].tokens).toEqual(['a', 'b']);
    expect(f.deleted).toEqual(['b']);
    expect(res).toEqual({ devices: 2, sent: 1, failed: 1, pruned: 1, errors: { 'messaging/registration-token-not-registered': 1 } });
  });

  it('does nothing without devices', async () => {
    const f = fakeDb([]);
    const m = fakeMessaging(() => []);
    expect(await notifyDevices(f.db as never, m.messaging, 'x/y/z', msg)).toEqual({ devices: 0, sent: 0, failed: 0, pruned: 0, errors: {} });
    expect(m.calls).toHaveLength(0);
  });
});
