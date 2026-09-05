# PlexoChat — Architecture Document

## 1. Architectural Principles

- PlexoChat is **fully web-based** (desktop and mobile browsers); a PWA may be considered later, not in MVP.
- The backend is designed to be a **coordination + encrypted relay** service. It should never need plaintext messages, plaintext photos, or private encryption keys.
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

### `encrypted_messages`
```json
{
  "_id": "ObjectId",
  "chat_id": "ObjectId",
  "sender_device_id": "string",
  "ciphertext": "binary/base64",
  "nonce_or_protocol_metadata": "object",
  "created_at": "datetime",
  "delivery_state": "SENT | DELIVERED | READ"
}
```
The server stores/relays this document without needing the plaintext.

### `encrypted_photos`
```json
{
  "_id": "ObjectId",
  "chat_id": "ObjectId",
  "sender_device_id": "string",
  "r2_object_key": "string",          // Cloudflare R2 object key, ciphertext only
  "encryption_metadata": "object",
  "created_at": "datetime"
}
```
MongoDB stores only the R2 object reference and encryption metadata — the encrypted binary itself lives in Cloudflare R2, never in MongoDB (keeps documents small and keeps blob storage/CDN concerns separate from the database, per §2).

### Indexing notes (implementation-time, non-binding)
- Unique indexes on `users.username`, `users.plexochat_id`, and `users.firebase_uid`.
- Compound index on `connection_requests` (`receiver_id`, `status`) for fast pending-request lookups.
- Compound index on `encrypted_messages` (`chat_id`, `created_at`) for chat history pagination.

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
Sender Browser
   ↓
Plaintext message
   ↓
Local translation
   ↓
Encryption
   ↓
Ciphertext
   ↓
WSS (connection authenticated via Firebase ID token)
   ↓
FastAPI Server (relay only; delivery state + presence tracked in Redis, persisted to MongoDB)
   ↓
WSS
   ↓
Receiver Browser
   ↓
Decryption
   ↓
Translated plaintext displayed
```

Key implementation concerns:
- Every WebSocket connection presents a Firebase ID token on connect; FastAPI verifies it via the Firebase Admin SDK before allowing any message relay, and re-validates on token refresh/expiry.
- Messages may only be relayed between users whose `connections` document (MongoDB) has `status = ACCEPTED` — enforced server-side per message, not just at connection time.
- Redis holds live presence and in-flight delivery-state for connected sessions; MongoDB is the durable record of `encrypted_messages` and final delivery state.
- Reconnection must resynchronize delivery state (Redis-backed) against MongoDB history without duplicating or dropping messages.

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

### Photo Encryption Flow (Cloudflare R2)

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

---

## 7. Web-Specific Trust Model Caveat

Because PlexoChat is a web application, the server controls the JavaScript delivered to the browser. This means a compromised server or deployment pipeline could theoretically serve modified client code, which is a structurally different trust model than a natively-distributed, code-signed application. This caveat must be reflected honestly in any security documentation or user-facing claims (see `prd.md` §4 item 19 and `security.md`) — never describe the system as "100% secure," "unbreakable," or "impossible to hack."

---

## 8. Privacy Philosophy

The backend should know only what is operationally necessary:

```
Authentication
User discovery
Connection requests
Connection state
Encrypted message relay
Encrypted photo relay
Delivery state
Minimal operational metadata
```

It should explicitly avoid needing:
```
Plaintext messages
Plaintext photos
Private encryption keys
```

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
