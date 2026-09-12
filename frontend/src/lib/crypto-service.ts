/**
 * End-to-End Encryption (E2EE) Cryptographic Service for PlexoChat
 *
 * PROTOCOL & SECURITY SPECIFICATIONS:
 * - Library: @matrix-org/olm (Signal Double-Ratchet protocol implementation by Matrix.org Foundation).
 * - Identity Keys: Curve25519 (for Diffie-Hellman key agreement) + Ed25519 (for digital signatures).
 * - Forward Secrecy & Break-in Recovery: Per-message ratchet advancing with every sent/received frame.
 * - Store-and-Forward Compatibility: PreKey messages (message_type 0) allow sending to offline peers
 *   using one-time prekeys registered on the backend.
 * - Zero Knowledge: Private keys NEVER leave IndexedDB. The backend only ever relays and stores
 *   opaque ciphertext blobs.
 */

import * as Olm from "@matrix-org/olm";
import { saveCryptoKey, getCryptoKey } from "./chat-storage";
import { getBackendUrl } from "./auth-context";

let olmInitialized = false;
let olmInitPromise: Promise<void> | null = null;

export function getOlm(): any {
  if (typeof window !== "undefined" && (window as any).Olm?.Account) {
    return (window as any).Olm;
  }
  if ((Olm as any)?.default?.Account) {
    return (Olm as any).default;
  }
  return Olm;
}

/**
 * Initializes the Olm WebAssembly module in the browser sandbox lazily.
 */
export async function initOlm(): Promise<void> {
  if (typeof window === "undefined") return;
  if (olmInitialized) return;

  if (!olmInitPromise) {
    const olmLib = getOlm();
    const initFn = olmLib.init || (Olm as any).init;
    olmInitPromise = initFn({
      locateFile: () => "/olm.wasm",
    }).then(() => {
      olmInitialized = true;
      console.info("[CryptoService] Olm WASM initialized successfully");
    });
  }

  return olmInitPromise || Promise.resolve();
}

function getPickleKey(userId: string): string {
  return `plexo_e2ee_${userId}`;
}

export interface EncryptedEnvelope {
  ciphertext: string;
  messageType: number; // 0 = PreKey (session setup), 1 = Message (ratchet)
}

export interface DecryptedPayload {
  original_text: string;
  translated_text: string;
  source_lang: string;
  target_lang: string;
  client_message_id?: string;
  timestamp?: string;
  is_photo?: boolean;
  photo_url?: string;
}

// In-memory cache of initialized Olm accounts per user to avoid re-unpickling on every frame
const accountCache: Map<string, Olm.Account> = new Map();
// In-memory cache of active sessions per peer
const sessionCache: Map<string, Olm.Session> = new Map();

/**
 * Loads or initializes the user's Olm.Account on this device.
 * If creating for the first time, generates 50 one-time keys and uploads public bundle to backend.
 */
export async function getOrCreateAccount(
  userId: string,
  getIdToken: () => Promise<string>
): Promise<Olm.Account> {
  await initOlm();

  if (accountCache.has(userId)) {
    return accountCache.get(userId)!;
  }

  const pickleKey = getPickleKey(userId);
  const storedPickle = await getCryptoKey<string>(`olm_account_${userId}`);

  const OlmLib = getOlm();
  const account = new OlmLib.Account();

  if (storedPickle) {
    try {
      account.unpickle(pickleKey, storedPickle);
      accountCache.set(userId, account);
      return account;
    } catch (err) {
      console.warn("[CryptoService] Could not unpickle Olm account, generating fresh:", err);
    }
  }

  // Generate fresh Olm Account
  account.create();
  account.generate_one_time_keys(50);

  const identityKeys = JSON.parse(account.identity_keys()); // { curve25519, ed25519 }
  const oneTimeKeysCurve = JSON.parse(account.one_time_keys()).curve25519 || {};

  // Register public keys on backend
  try {
    const token = await getIdToken();
    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/api/v1/devices/keys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_identifier: "browser-main",
        identity_keys: identityKeys,
        one_time_keys: oneTimeKeysCurve,
      }),
    });

    if (!res.ok) {
      console.warn(`[CryptoService] Backend key registration returned status ${res.status}`);
    } else {
      console.info("[CryptoService] Olm device public keys successfully registered with backend");
    }
  } catch (netErr) {
    console.warn("[CryptoService] Failed to upload public device keys to backend:", netErr);
  }

  account.mark_keys_as_published();

  // Persist pickled account
  const newPickle = account.pickle(pickleKey);
  await saveCryptoKey(`olm_account_${userId}`, newPickle);

  accountCache.set(userId, account);
  return account;
}

/**
 * Gets or establishes an outbound Olm session with a peer.
 */
async function getOrInitOutboundSession(
  myUserId: string,
  peerUserId: string,
  account: Olm.Account,
  getIdToken: () => Promise<string>
): Promise<Olm.Session> {
  const sessionKey = `${myUserId}_${peerUserId}`;
  if (sessionCache.has(sessionKey)) {
    return sessionCache.get(sessionKey)!;
  }

  const pickleKey = getPickleKey(myUserId);
  const storedSessionPickle = await getCryptoKey<string>(`olm_session_${sessionKey}`);

  if (storedSessionPickle) {
    try {
      const session = new Olm.Session();
      session.unpickle(pickleKey, storedSessionPickle);
      sessionCache.set(sessionKey, session);
      return session;
    } catch (err) {
      console.warn("[CryptoService] Could not unpickle session, establishing new:", err);
    }
  }

  // Fetch peer public device keys from backend
  const token = await getIdToken();
  const backendUrl = getBackendUrl();
  const res = await fetch(`${backendUrl}/api/v1/devices/keys/${peerUserId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to retrieve peer device keys (status ${res.status})`);
  }

  const peerData = await res.json();
  const peerIdentityCurve = peerData?.identity_keys?.curve25519;
  const peerOtk = peerData?.one_time_key?.key;

  if (!peerIdentityCurve || !peerOtk) {
    throw new Error("Incomplete peer key bundle returned by backend");
  }

  const OlmLib = getOlm();
  const newSession = new OlmLib.Session();
  newSession.create_outbound(account, peerIdentityCurve, peerOtk);

  // Persist session
  await saveCryptoKey(`olm_session_${sessionKey}`, newSession.pickle(pickleKey));
  // Persist updated account
  await saveCryptoKey(`olm_account_${myUserId}`, account.pickle(pickleKey));

  sessionCache.set(sessionKey, newSession);
  return newSession;
}

/**
 * Encrypts a message payload using Olm Double-Ratchet.
 */
export async function encryptMessage(
  myUserId: string,
  peerUserId: string,
  payload: DecryptedPayload,
  getIdToken: () => Promise<string>
): Promise<EncryptedEnvelope> {
  await initOlm();
  const account = await getOrCreateAccount(myUserId, getIdToken);
  const session = await getOrInitOutboundSession(myUserId, peerUserId, account, getIdToken);

  const plaintext = JSON.stringify(payload);
  const encrypted = session.encrypt(plaintext);

  // Persist ratcheted session
  const pickleKey = getPickleKey(myUserId);
  const sessionKey = `${myUserId}_${peerUserId}`;
  await saveCryptoKey(`olm_session_${sessionKey}`, session.pickle(pickleKey));

  return {
    ciphertext: encrypted.body,
    messageType: encrypted.type,
  };
}

/**
 * Decrypts an incoming message envelope from a peer.
 */
export async function decryptMessage(
  myUserId: string,
  peerUserId: string,
  ciphertext: string,
  messageType: number,
  getIdToken: () => Promise<string>
): Promise<DecryptedPayload> {
  await initOlm();
  const account = await getOrCreateAccount(myUserId, getIdToken);
  const pickleKey = getPickleKey(myUserId);
  const sessionKey = `${myUserId}_${peerUserId}`;
  const OlmLib = getOlm();

  // 1. If message is a PreKey message (messageType === 0), it initiates or resets an Olm session
  if (messageType === 0) {
    const session = new OlmLib.Session();
    session.create_inbound(account, ciphertext);
    account.remove_one_time_keys(session);

    const plaintext = session.decrypt(messageType, ciphertext);

    // Save session & updated account
    await saveCryptoKey(`olm_session_${sessionKey}`, session.pickle(pickleKey));
    await saveCryptoKey(`olm_account_${myUserId}`, account.pickle(pickleKey));

    sessionCache.set(sessionKey, session);
    return JSON.parse(plaintext);
  }

  // 2. Normal ratcheted message (messageType === 1)
  let session = sessionCache.get(sessionKey);
  if (!session) {
    const storedPickle = await getCryptoKey<string>(`olm_session_${sessionKey}`);
    if (storedPickle) {
      const restoredSession = new OlmLib.Session();
      restoredSession.unpickle(pickleKey, storedPickle);
      sessionCache.set(sessionKey, restoredSession);
      session = restoredSession;
    }
  }

  if (!session) {
    // If no existing session exists, attempt inbound creation
    const inboundSession = new OlmLib.Session();
    inboundSession.create_inbound(account, ciphertext);
    account.remove_one_time_keys(inboundSession);
    const plaintext = inboundSession.decrypt(messageType, ciphertext);

    await saveCryptoKey(`olm_session_${sessionKey}`, inboundSession.pickle(pickleKey));
    await saveCryptoKey(`olm_account_${myUserId}`, account.pickle(pickleKey));

    sessionCache.set(sessionKey, inboundSession);
    return JSON.parse(plaintext);
  }

  // Decrypt with existing ratcheted session
  const plaintext = session.decrypt(messageType, ciphertext);
  await saveCryptoKey(`olm_session_${sessionKey}`, session.pickle(pickleKey));

  return JSON.parse(plaintext);
}
