# PlexoChat — Architecture Document

## 1. Architectural Principles

- PlexoChat is **fully web-based** (desktop and mobile browsers); a PWA may be considered later, not in MVP.
- The backend is designed to be a **coordination + temporary encrypted relay** service. It should never need plaintext messages, plaintext photos, or private encryption keys.
- **Store-and-forward, not permanent storage (WhatsApp/Signal-style):** the backend is NOT the system of record for chat history. Messages and photos are relayed as ciphertext, held only transiently (queued for undelivered recipients, per a defined retention policy), and removed once delivered/acknowledged or once the retention window expires. Conversation history lives in **encrypted local storage on the user's device**, not in MongoDB. This is a locked architectural decision — see §5 and `memory.md`.
- Translation, where privacy-critical, happens **client-side**, before encryption, so plaintext never reaches the server.
- No custom cryptography — only established protocols and maintained, audited libraries.
- Security is a first-class architectural concern, not an afterthought bolted on in a later phase (see `security.md` for the detailed control set).

---

## 2. Technology Stack

**Status: FINAL — locked for implementation start.** This supersedes any earlier stack draft. Record any future change here and in `memory.md` §6.

```
Frontend
Next.js + TypeScript
        ↓
Backend
FastAPI + Python
        ↓
Authentication
Firebase Authentication
        ↓
Database
MongoDB Atlas
        ↓
Real-time / Presence
WebSocket + Redis
        ↓
Photo Storage
Cloudflare R2
        ↓
End-to-End Encryption
Browser-side Web Crypto
+ Established cryptographic protocol/library
```

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Python
- FastAPI
- Uvicorn
- WebSocket / WSS for real-time messaging

### Authentication
- **Firebase Authentication** — handles credential storage, password hashing, login/signup flows, email/phone verification, and session/ID-token issuance.
- FastAPI verifies Firebase-issued ID tokens (via the Firebase Admin SDK) on every authenticated HTTP and WebSocket request — the backend does not implement its own password storage/hashing.
- PlexoChat's own backend still owns: username, PlexoChat ID, display name, preferred receiving language, connection state, and device keys — these live in MongoDB, keyed off the Firebase `uid`.

### Data Layer
- **MongoDB Atlas** — durable storage (users, connections/connection requests, device keys, encrypted message/photo metadata and ciphertext references). Document model fits PlexoChat's per-user and per-chat data well (see §4 for collection shapes).
- **Redis** — ephemeral/real-time state: WebSocket presence, rate-limit counters, short-lived session/backoff state (see §9 and `security.md`).

### Photo Storage
- **Cloudflare R2** — object storage for encrypted photo blobs. The backend issues short-lived, scoped upload/download URLs (presigned) rather than proxying binary content through FastAPI where avoidable. R2 only ever stores ciphertext blobs — see §6.

### Browser-Side Storage & Crypto
- IndexedDB for local key material and cached ciphertext/state where appropriate
- Web Crypto API
- Established E2EE/crypto libraries (selected carefully at implementation time — see §6)

---

## 3. High-Level System Architecture

```
┌──────────────────────┐
│     User A Browser   │
│  React / Next.js     │
│  Local Translation   │
│  E2EE / Web Crypto   │
└──────────┬───────────┘
           │
     WSS + HTTPS
           │
           ▼
┌────────────────────────────────────────────┐
│              FastAPI Backend                │
│  Verifies Firebase ID tokens (Admin SDK)    │
│  User Discovery · Connection State           │
│  Encrypted Message Relay · Delivery State    │
│  Presigned R2 upload/download URL issuance   │
└───┬───────────────┬───────────────┬─────────┘
    │                │               │
    ▼                ▼               ▼
┌─────────┐   ┌──────────────┐  ┌───────────────┐
│ Firebase │   │ MongoDB Atlas │  │  Redis         │
│ Auth     │   │ (users, conns,│  │ (presence,     │
│ (identity│   │  device keys, │  │  rate limits,  │
│ + tokens)│   │  msg/photo    │  │  ws state)     │
└─────────┘   │  metadata)    │  └───────────────┘
              └──────────────┘
                     │
                     ▼
              ┌───────────────┐
              │ Cloudflare R2  │
              │ (encrypted     │
              │  photo blobs)  │
              └───────────────┘
           ▲
           │
     WSS + HTTPS
           │
┌──────────┴───────────┐
│     User B Browser   │
│  React / Next.js     │
│  Local Translation   │
│  E2EE / Web Crypto   │
└──────────────────────┘
```

The backend's responsibilities are intentionally narrow:

```
Verifying Firebase-issued identity (not storing passwords itself)
User discovery
Connection requests
Connection state
Encrypted message relay
Encrypted photo relay (via R2 presigned URLs)
Delivery state
Minimal operational metadata
```

It must **not** require:

```
Plaintext messages
Plaintext photos
Private encryption keys
Passwords (owned by Firebase Authentication, not this backend)
```

---

## 4. Data Model (Conceptual — MongoDB Atlas Collections)

Documents below are conceptual shapes for MongoDB collections. `firebase_uid` is the join key back to Firebase Authentication — the backend never stores a password or credential itself.

### `users`
```json
{
  "_id": "ObjectId",
  "firebase_uid": "string",           // links to Firebase Authentication
  "username": "string",
  "plexochat_id": "string",           // unique, publicly searchable
  "display_name": "string",
  "profile_photo_reference": "string",// Cloudflare R2 object reference
  "preferred_receiving_language": "string",
  "created_at": "datetime"
}
```

### `connection_requests`
```json
{
  "_id": "ObjectId",
  "sender_id": "ObjectId",            // ref: users._id
  "receiver_id": "ObjectId",          // ref: users._id
  "status": "REQUEST_SENT | PENDING | ACCEPTED | DECLINED | BLOCKED",
  "created_at": "datetime"
}
```

### `connections`
```json
{
  "_id": "ObjectId",
  "user_a_id": "ObjectId",
  "user_b_id": "ObjectId",
  "status": "string",
  "created_at": "datetime"
}
```

### `device_keys`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "device_identifier": "string",
  "public_key": "string",
  "key_metadata": "object",
  "created_at": "datetime"
}
```
Private keys never leave the originating device and are never stored server-side as plaintext secrets. MongoDB only ever holds public key material.

### `chat_sessions`
Represents the secure session established between connected users/devices after key exchange.

### `message_queue` — TEMPORARY relay store only (NOT chat history)
```json
{
  "_id": "ObjectId",
  "chat_id": "ObjectId",
  "sender_device_id": "string",
  "recipient_id": "ObjectId",
  "ciphertext": "binary/base64",
  "nonce_or_protocol_metadata": "object",
  "created_at": "datetime",
  "expires_at": "datetime",           // TTL index field — MongoDB auto-purges past this
  "delivery_state": "QUEUED | DELIVERED"
}
```
This document exists only until the recipient's device confirms delivery, or until `expires_at` (retention policy) is reached, whichever comes first — at which point it is deleted. This is **not** a chat-history table; the server holds no long-term record of message content. Real conversation history lives in the recipient's/sender's local encrypted device storage (IndexedDB), never here.

### `encrypted_photos` — ⚠️ DESCOPED, NOT PART OF THE BUILD

> **Photo sharing has been removed from PlexoChat's scope** (see `memory.md` item 13c and `prd.md` §5.5). This subsection is kept for historical/reference purposes only — do not implement it. PlexoChat's focus is text-based multilingual chat and language learning.

<details>
<summary>Original design (not implemented — reference only)</summary>

```json
{
  "_id": "ObjectId",
  "chat_id": "ObjectId",
  "sender_device_id": "string",
  "recipient_id": "ObjectId",
  "r2_object_key": "string",          // Cloudflare R2 object key, ciphertext only
  "encryption_metadata": "object",
  "created_at": "datetime",
  "expires_at": "datetime",           // TTL index field, matches R2 object lifecycle
  "delivery_state": "QUEUED | DELIVERED"
}
```
Same store-and-forward model as messages: MongoDB holds only the temporary R2 object reference, never the binary. Once delivery is acknowledged (or the retention window expires), both this metadata document **and** the underlying R2 object are deleted — see §6 for the retention/cleanup flow. Decrypted photos, if the user wants to keep them, are saved to the receiving device's own local (encrypted) storage — the server is not where photo history lives.

</details>

### Indexing notes (implementation-time, non-binding)
- Unique indexes on `users.username`, `users.plexochat_id`, and `users.firebase_uid`.
- Compound index on `connection_requests` (`receiver_id`, `status`) for fast pending-request lookups.
- **TTL index on `message_queue.expires_at`** and **TTL index on `encrypted_photos.expires_at`** — this is how the retention policy is enforced at the database level (MongoDB automatically deletes expired documents), as a backstop in addition to explicit deletion on delivery acknowledgement.
- Compound index on `message_queue` (`recipient_id`, `delivery_state`) for fast "drain my queue on reconnect" lookups.

### Client-Side Conceptual Message Representation
On the client only (never transmitted as plaintext), a message is represented as:
```json
{
  "original": "Ami ajke আসতে parbo na because amar class ache.",
  "translated": "Ich kann heute nicht kommen, weil ich Unterricht habe.",
  "targetLanguage": "de"
}
```
The network payload itself is always the encrypted ciphertext — this JSON shape is a local, in-memory/IndexedDB concept, not a wire format.

---

## 5. Real-Time Messaging Flow

```
User A (Sender)
   ↓
Write message naturally
   ↓
Local translation
   ↓
E2EE encryption
   ↓
Secure WebSocket (authenticated via Firebase ID token)
   ↓
FastAPI temporary relay (message_queue — NOT permanent storage)
   ↓
User B (Receiver, online) — delivered immediately, relay copy deleted on ack
      — OR —
User B (Receiver, offline) — held in message_queue until delivered or retention expires
   ↓
E2EE decryption (on receiver's device)
   ↓
Local encrypted storage (IndexedDB — this is the real chat history)
   ↓
Display translated message
```

**This is a store-and-forward relay, WhatsApp/Signal-style — not a chat database.** Key implementation concerns:

- Every WebSocket connection presents a Firebase ID token on connect; FastAPI verifies it via the Firebase Admin SDK before allowing any message relay, and re-validates on token refresh/expiry.
- Messages may only be relayed between users whose `connections` document (MongoDB) has `status = ACCEPTED` — enforced server-side per message, not just at connection time.
- **If the recipient is online:** the server relays the ciphertext directly over their live WebSocket connection. Once the recipient's client sends a delivery acknowledgement, the server deletes its temporary copy immediately — it does not keep a durable record of the message content.
- **If the recipient is offline:** the ciphertext is held in a `message_queue` collection (MongoDB, used here as a temporary durable queue, not a chat archive) with a **retention policy** (a configurable TTL — e.g., days, not indefinite) via a MongoDB TTL index, so undelivered messages are automatically purged if never collected. On reconnect, the client drains its queue, decrypts and stores each message locally, acknowledges receipt, and the server deletes the queued copy.
- Redis holds live presence and in-flight WebSocket routing state (which server/connection a user is currently attached to) — it is not a message store either.
- **The client's local encrypted storage (IndexedDB) is the actual system of record for conversation history.** The backend has no "get chat history" endpoint that returns past message content — history sync only ever concerns undelivered items still sitting in the queue, never a full historical log.
- Delivery/read acknowledgements are still tracked (see §9), but only as lightweight status signals — acknowledging a message is also the trigger that lets the server discard the queued ciphertext.

---

## 6. End-to-End Encryption Architecture

**Non-negotiable constraint:** do not invent custom cryptography. Use established, well-maintained protocols/libraries (the specific library/protocol choice — e.g., a Signal-protocol-style double ratchet, or a vetted alternative — should be finalized during implementation, with a documented rationale).

Required properties, where supported by the chosen protocol:
- Confidentiality
- Message authentication / integrity
- Secure key exchange
- Replay protection
- Secure randomness
- Key rotation
- Forward secrecy

### E2EE + Translation Constraint (Important)

True E2EE and server-side plaintext translation are in direct conflict:

```
User → Server → Translation API   (breaks E2EE guarantee)
```

To preserve a genuine end-to-end privacy claim:

```
User's device
   ↓
Translate locally
   ↓
Encrypt locally
   ↓
Send ciphertext
```

If a third-party cloud translation provider is ever introduced instead of on-device/local translation, the product's privacy and security claims **must be explicitly qualified** to disclose that plaintext is shared with that provider. PlexoChat must never claim to be "fully E2EE" if plaintext leaves the device for translation.

### Photo Encryption Flow — ⚠️ DESCOPED, NOT PART OF THE BUILD

> **Photo sharing is out of scope** (see `memory.md` item 13c). Kept below for historical reference only.

<details>
<summary>Original design (not implemented — reference only)</summary>


```
Sender selects photo
        ↓
Photo encrypted locally (Web Crypto)
        ↓
FastAPI issues a short-lived, scoped presigned upload URL for R2
        ↓
Browser uploads ciphertext blob directly to Cloudflare R2
        ↓
FastAPI records the R2 object key + encryption metadata in MongoDB
        ↓
Receiver requests the message → FastAPI issues a short-lived presigned
        download URL, scoped to the ACCEPTED connection only
        ↓
Receiver's browser downloads ciphertext directly from R2
        ↓
Receiver decrypts locally
        ↓
Photo displayed
```

Notes:
- Uploads/downloads go directly browser-to-R2 using presigned URLs where possible, rather than proxying binary content through FastAPI, to reduce backend load and blast radius.
- Presigned URLs must be short-lived and scoped to the specific object/connection — never long-lived or globally valid.
- R2 bucket access must be private by default (no public bucket listing or unauthenticated object access); all access goes through FastAPI-issued presigned URLs.
- See `security.md` §6 for upload validation requirements (this still applies to the client-side pre-encryption validation step, and to presigned-URL scoping/size limits enforced by FastAPI).

**Retention & deletion (store-and-forward, matches message handling):**
- The R2 object and its `encrypted_photos` MongoDB metadata document both exist only temporarily.
- Once the receiver's client confirms it has downloaded and decrypted the photo (an explicit acknowledgement, same mechanism as message delivery acks), FastAPI deletes both the R2 object and the MongoDB metadata document.
- If the receiver never comes online to collect it, a retention policy (configurable TTL, enforced via the MongoDB TTL index on `expires_at` plus a scheduled/background cleanup job that also deletes the corresponding R2 object — MongoDB's TTL index alone won't clean up R2, so this needs an explicit worker/cron) purges both after the retention window.
- The server is never a long-term photo archive. If a user wants to keep a received photo, that's a local, on-device save — same principle as chat history living on-device, not server-side.

</details>

---

## 7. Web-Specific Trust Model Caveat

Because PlexoChat is a web application, the server controls the JavaScript delivered to the browser. This means a compromised server or deployment pipeline could theoretically serve modified client code, which is a structurally different trust model than a natively-distributed, code-signed application. This caveat must be reflected honestly in any security documentation or user-facing claims (see `prd.md` §4 item 19 and `security.md`) — never describe the system as "100% secure," "unbreakable," or "impossible to hack."

---

## 8. Privacy Philosophy & Backend Responsibilities

**Core principle:** PlexoChat provides WhatsApp/Signal-style private messaging — the server delivers encrypted messages but does not act as a permanent chat-history database. Conversation history belongs to the users' encrypted devices.

The backend should handle only what is necessary for communication:

```
Authentication / authorization
User and connection management
WebSocket communication
Temporary encrypted message delivery (store-and-forward, not archival)
Temporary encrypted photo delivery (via R2, same store-and-forward model)
Delivery / read acknowledgements
Online / offline presence
Rate limiting and abuse prevention
```

MongoDB stores user, profile, connection, device/public-key data, and necessary **transient** delivery metadata — but explicitly **NOT**:
```
Permanent plaintext chat messages
Permanent ciphertext chat history (queued messages are deleted on delivery/expiry, not retained)
Plaintext translations
Plaintext photos, or photos retained beyond the delivery/retention window
Private encryption keys
```

Conversation history is reconstructed and kept entirely on the user's device, in encrypted local storage (IndexedDB) — the backend cannot reproduce a user's chat history even if compelled to, because it was never durably stored there in the first place. This is a stronger privacy posture than "the server could read it but chooses to relay only" — it's "the server structurally does not retain it."

---

## 9. Security Architecture (Summary — full detail in `security.md`)

The following controls are architectural requirements, not optional hardening, and must be designed in from Phase 2 onward:

- **Rate limiting:** tiered per endpoint class (auth / public / authenticated), combining per-IP and per-account limits with exponential backoff on auth routes; all thresholds externally configurable (env/config, not hardcoded). Backed by Redis counters. Note: Firebase Authentication applies its own brute-force protections on the auth surface it owns (login/signup), but PlexoChat's own endpoints (e.g., username/PlexoChat ID search, connection requests, any custom auth-adjacent route) still need app-level rate limiting independently.
- **Input validation:** strict schema validation (type, length, format) on every input, with rejection (not silent sanitization) of anything non-conforming — enforced via FastAPI/Pydantic models on the backend and equivalent schema validation on the frontend.
- **Secrets management:** Firebase Admin SDK service account credentials, MongoDB Atlas connection strings, Redis credentials, and Cloudflare R2 access keys/secrets all live in environment variables/secret managers on the backend only — never in source, never committed to git. The Firebase **client-side** config (API key, project ID, etc.) is expected to be public by design per Firebase's own model, but this must be explicitly distinguished from the Admin SDK service account key, which must never be exposed to the frontend or committed to the repo.
- **Dependency hygiene:** routine dependency auditing (e.g., `pip-audit`/`npm audit` or equivalents) across both frontend and backend, with tracked remediation for known vulnerabilities.
- **Error handling:** generic user-facing error messages; full error detail (stack traces, DB errors, internal paths, Firebase/MongoDB/R2 error payloads) logged server-side only, never returned to the client.
- **File upload safety (photos):** validate actual file content/type (not just extension) and size client-side before encryption; Cloudflare R2 bucket kept private with access only via short-lived presigned URLs issued by FastAPI; ensure uploaded content can never be executed as code.

See `security.md` for the fully specified requirements, thresholds, and verification steps.

---

## 10. Other Security-Relevant Architectural Requirements (from source spec)

- HTTPS everywhere; WSS for all real-time traffic.
- Secure authentication: Firebase Authentication owns credential storage, password hashing, and login/signup security — PlexoChat's backend must correctly verify Firebase ID tokens on every request (HTTP and WebSocket) and must never re-implement its own password storage.
- Secure session management: rely on Firebase's token issuance/refresh model; FastAPI enforces short-lived token verification rather than maintaining its own long-lived session secret.
- Strong random key generation; proper public/private key lifecycle management.
- XSS protection and Content Security Policy (CSP).
- Connection-request spam prevention and general abuse prevention (enforced via the connection-acceptance state machine plus rate limiting).
- Secure photo handling end-to-end (see §6 and `security.md`).
- Minimal server-side metadata retention, consistent with §8.
