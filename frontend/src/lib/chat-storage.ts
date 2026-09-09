/**
 * IndexedDB Persistent Storage for Decrypted Chat History & Olm Cryptographic Material
 *
 * ARCHITECTURAL INTEGRITY:
 * - Server stores only temporary opaque ciphertext in pending_messages (48h TTL) for offline peers.
 * - Source of truth for conversation history and Olm keys is strictly on-device (IndexedDB).
 * - Private keys and ratchet states never leave the local browser sandbox.
 */

import { ChatMessage, ChatThread } from "./mock-chat-data";

const DB_NAME = "plexochat_db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB is not supported in this environment"));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("crypto_keys")) {
        db.createObjectStore("crypto_keys", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("messages")) {
        const msgStore = db.createObjectStore("messages", { keyPath: "id" });
        msgStore.createIndex("threadId", "threadId", { unique: false });
        msgStore.createIndex("timestamp", "message.timestamp", { unique: false });
      }

      if (!db.objectStoreNames.contains("threads")) {
        db.createObjectStore("threads", { keyPath: "userId" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// ---------------------------------------------------------------------------
// Cryptographic Material Storage (Olm Account & Sessions)
// ---------------------------------------------------------------------------

export async function saveCryptoKey(id: string, data: unknown): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("crypto_keys", "readwrite");
      const store = tx.objectStore("crypto_keys");
      const req = store.put({ id, data, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[ChatStorage] IndexedDB unavailable for crypto key, using localStorage fallback:", err);
    if (typeof window !== "undefined") {
      localStorage.setItem(`plexochat_crypto_${id}`, JSON.stringify({ id, data }));
    }
  }
}

export async function getCryptoKey<T = unknown>(id: string): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("crypto_keys", "readonly");
      const store = tx.objectStore("crypto_keys");
      const req = store.get(id);
      req.onsuccess = () => {
        resolve(req.result ? (req.result.data as T) : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(`plexochat_crypto_${id}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          return parsed.data;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}

export async function deleteCryptoKey(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("crypto_keys", "readwrite");
      const store = tx.objectStore("crypto_keys");
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`plexochat_crypto_${id}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Thread Messages Storage
// ---------------------------------------------------------------------------

export async function saveMessage(threadId: string, message: ChatMessage): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("messages", "readwrite");
      const store = tx.objectStore("messages");
      const req = store.put({ id: message.id, threadId, message });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[ChatStorage] Failed to persist message to IndexedDB:", err);
  }
}

export async function getThreadMessages(threadId: string): Promise<ChatMessage[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("messages", "readonly");
      const store = tx.objectStore("messages");
      const index = store.index("threadId");
      const req = index.getAll(threadId);
      req.onsuccess = () => {
        const records = (req.result || []) as Array<{ message: ChatMessage }>;
        // Sort ascending by timestamp
        const messages = records.map((r) => r.message);
        messages.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        resolve(messages);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Cached Threads Storage
// ---------------------------------------------------------------------------

export async function saveUserThreads(userId: string, threads: ChatThread[]): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("threads", "readwrite");
      const store = tx.objectStore("threads");
      const req = store.put({ userId, threads, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`plexochat_threads_${userId}`, JSON.stringify(threads));
      } catch {
        // ignore quota error
      }
    }
  }
}

export async function getUserThreads(userId: string): Promise<ChatThread[] | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("threads", "readonly");
      const store = tx.objectStore("threads");
      const req = store.get(userId);
      req.onsuccess = () => {
        resolve(req.result ? req.result.threads : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(`plexochat_threads_${userId}`);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
