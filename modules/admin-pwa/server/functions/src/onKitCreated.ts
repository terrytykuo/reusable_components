import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, type DocumentReference, type Firestore } from 'firebase-admin/firestore';
import { getMessaging, type Messaging, type MulticastMessage } from 'firebase-admin/messaging';
import * as logger from 'firebase-functions/logger';

// Template: push every admin-PWA device when a new doc is created.
//
//   // functions/src/index.ts
//   export const onKitCreated = createOnKitCreated({
//     document: 'admin/kits/{kind}/{id}',
//     notify: ({ id }, data) => ({
//       title: '新項目',
//       body: typeof data.title === 'string' ? data.title : id,
//       link: `https://<site>.web.app/items/${id}`,
//     }),
//   });
//
// Fires on *create* only: a CI re-publish that merges into an existing doc sends nothing.

export interface PushNotification {
  title: string;
  body: string;
  /** Absolute https URL inside the PWA; opened on tap (fcmOptions.link). */
  link: string;
  /** Collapses duplicates (e.g. a redelivered event) into one notification. */
  tag?: string;
}

export interface OnKitCreatedOptions {
  /** Document pattern with wildcards, e.g. 'admin/kits/{kind}/{id}'. */
  document: string;
  /** What to say; return null to skip this doc. `params` are the wildcard values. */
  notify: (params: Record<string, string>, data: Record<string, unknown>) => PushNotification | null;
  /** Token collection (doc id = FCM token). Must match the PWA's brand.devicesPath. */
  devicesPath?: string;
  /** Notification icon path on the PWA origin. */
  icon?: string;
  region?: string;
}

export const DEFAULT_DEVICES_PATH = 'admin/pushTokens/devices';
/** FCM sendEachForMulticast accepts at most this many tokens per call. */
const MULTICAST_LIMIT = 500;
/** Body cap in characters (code points), ellipsis included. */
export const BODY_MAX = 120;
/** FCM error codes meaning the token will never work again: delete its doc. */
export const STALE_CODES = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token']);

export function truncate(s: string, max = BODY_MAX): string {
  const chars = Array.from(s);
  return chars.length <= max ? s : `${chars.slice(0, max - 1).join('')}…`;
}

/** Pure: the multicast message (minus tokens) for a notification. Data values are strings, as FCM requires. */
export function buildMessage(n: PushNotification, data: Record<string, string> = {}, icon = '/icons/icon-192.png'): Omit<MulticastMessage, 'tokens'> {
  const body = truncate(n.body);
  return {
    notification: { title: n.title, body },
    webpush: { fcmOptions: { link: n.link }, notification: { icon, ...(n.tag ? { tag: n.tag } : {}) } },
    data: { ...data, link: n.link },
  };
}

export interface SendResult { sent: number; failed: number; stale: DocumentReference[]; errors: Record<string, number> }

/**
 * Multicast `msg` to every token doc (doc id = token) in chunks of 500.
 * A chunk whose send throws counts all its tokens as failed (none pruned) and
 * the loop moves on. `errors` counts per-token error codes, plus one entry per
 * thrown chunk under the thrown error's code.
 */
export async function sendToTokens(
  messaging: Pick<Messaging, 'sendEachForMulticast'>,
  docs: Array<{ id: string; ref: DocumentReference }>,
  msg: Omit<MulticastMessage, 'tokens'>,
): Promise<SendResult> {
  const result: SendResult = { sent: 0, failed: 0, stale: [], errors: {} };
  const count = (code: string) => { result.errors[code] = (result.errors[code] ?? 0) + 1; };
  for (let start = 0; start < docs.length; start += MULTICAST_LIMIT) {
    const chunk = docs.slice(start, start + MULTICAST_LIMIT);
    try {
      const res = await messaging.sendEachForMulticast({ ...msg, tokens: chunk.map((d) => d.id) });
      result.sent += res.successCount;
      result.failed += res.failureCount;
      res.responses.forEach((r, i) => {
        if (r.success) return;
        const code = r.error?.code ?? 'unknown';
        count(code);
        if (STALE_CODES.has(code)) result.stale.push(chunk[i].ref);
      });
    } catch (e) {
      result.failed += chunk.length;
      const code = (e as { code?: unknown } | null)?.code;
      count(typeof code === 'string' ? code : 'send-threw');
    }
  }
  return result;
}

/** Sends to every device under devicesPath and deletes the stale ones. */
export async function notifyDevices(
  db: Pick<Firestore, 'collection'>,
  messaging: Pick<Messaging, 'sendEachForMulticast'>,
  devicesPath: string,
  msg: Omit<MulticastMessage, 'tokens'>,
): Promise<{ devices: number; sent: number; failed: number; pruned: number; errors: Record<string, number> }> {
  const snap = await db.collection(devicesPath).get();
  if (snap.empty) return { devices: 0, sent: 0, failed: 0, pruned: 0, errors: {} };
  const { sent, failed, stale, errors } = await sendToTokens(messaging, snap.docs, msg);
  const deletes = await Promise.allSettled(stale.map((ref) => ref.delete()));
  const pruned = deletes.filter((d) => d.status === 'fulfilled').length;
  return { devices: snap.size, sent, failed, pruned, errors };
}

/** Firestore onCreate trigger → FCM to every admin-PWA device. */
export function createOnKitCreated(options: OnKitCreatedOptions) {
  const { document, notify, devicesPath = DEFAULT_DEVICES_PATH, icon, region } = options;
  return onDocumentCreated({ document, ...(region ? { region } : {}) }, async (event) => {
    const params = event.params as Record<string, string>;
    const n = notify(params, event.data?.data() ?? {});
    if (!n) { logger.info('onKitCreated: skipped by notify()', params); return; }
    const result = await notifyDevices(getFirestore(), getMessaging(), devicesPath, buildMessage(n, params, icon));
    logger.info('onKitCreated', { ...params, ...result });
  });
}
