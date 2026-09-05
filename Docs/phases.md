# PlexoChat — Development Phases & Roadmap

This roadmap sequences the MVP so that UI, accounts, real-time transport, translation, and encryption are each proven independently before layering the next. Security work (see `security.md`) is **not** a single late phase — specific controls are called out per phase, with a dedicated hardening/testing pass in Phase 7.

---

## Phase 1 — UI Prototype

**Goal:** Validate the interaction model before any real data flows.

Build:
- Landing/login interface
- Chat list
- Chat screen (static/mock data)
- Message composer
- Connection request UI
- Settings screen
- Responsive mobile layout

No real messaging, accounts, or backend integration yet. This is a design/UX validation phase (pairs with `design.md`).

**Exit criteria:** Clickable prototype covering all core screens, responsive across desktop/mobile breakpoints.

---

## Phase 2 — Accounts & Connections

**Goal:** Real identity and the connection-request trust model.

Implement:
- User accounts (registration/login) via **Firebase Authentication**
- FastAPI middleware to verify Firebase ID tokens (Admin SDK) on every protected route
- Backend `users` documents in **MongoDB Atlas**, keyed on `firebase_uid`, holding username, PlexoChat ID, display name, preferred receiving language
- Username + unique PlexoChat ID issuance (app-owned, not Firebase-owned)
- Preferred receiving language field
- User search (username / PlexoChat ID) with minimal public info exposure
- Connection requests: send / accept / decline / block
- Connection state machine: `NONE → REQUEST_SENT → PENDING → ACCEPTED → E2EE_SESSION_ESTABLISHED → ACTIVE_CHAT`

**Security work introduced here:**
- App-level rate limiting on all custom FastAPI routes (per-IP + per-account, exponential backoff) — see `security.md` §1; Firebase's own login/signup abuse protections cover its own surface only
- Strict input validation on all account/search/connection endpoints
- Correct Firebase ID token verification (signature, expiry, issuer/audience) — no custom password handling in this backend
- Secrets via environment variables from day one: Firebase Admin SDK service account key, MongoDB Atlas connection string (no hardcoded credentials, ever)

**Exit criteria:** Two accounts can find each other, request, accept/decline/block, and reach `ACCEPTED` state — with no messaging capability yet.

---

## Phase 3 — Real-Time Messaging (Transport Only)

**Goal:** Reliable real-time delivery, before translation or encryption are layered on.

Implement:
- WebSocket/WSS connection lifecycle, authenticated per session via Firebase ID token
- **Redis** for live presence and in-flight delivery-state tracking
- Message delivery (plaintext-in-transit acceptable only in this phase, pre-E2EE, for scaffolding purposes — must not ship to production without Phase 5)
- Delivery status (sent/delivered/read), durably persisted to `encrypted_messages` in **MongoDB Atlas**
- Chat history persistence and pagination (MongoDB Atlas)
- Reconnection handling (resync Redis live state against MongoDB history)

**Security work introduced here:**
- Moderate rate limiting on public/authenticated messaging endpoints
- WebSocket authorization checks (a connection can only relay messages between users with `ACCEPTED` connection state)
- Structured error handling so connection failures never leak internals to the client

**Exit criteria:** Two connected users can exchange messages in real time with correct delivery status and reconnection recovery.

---

## Phase 4 — Translation

**Goal:** Automatic, receiver-targeted translation of natural multilingual input.

Implement:
- Language detection for mixed/code-switched input (e.g., Banglish)
- Local/on-device translation pipeline (see E2EE + translation constraint in `architecture.md` §6)
- Receiver-language targeting (translation direction always follows recipient preference)
- Translation display as default view, with subtle indicator (e.g., "Translated • DE")
- Original-message reveal (double-click/double-tap + accessible "View original" control)

**Exit criteria:** A Bengali/English mixed message sent by User A renders correctly in User B's preferred language, and vice versa; original is always recoverable and never overwritten.

---

## Phase 5 — End-to-End Encryption

**Goal:** Replace the Phase 3 scaffolding transport with real E2EE.

Implement:
- Device key generation (Web Crypto API)
- Secure key exchange protocol (established library/protocol — no custom crypto)
- Encrypted message payloads (ciphertext-only over the wire)
- Session management (`ChatSession`)
- Replay protection
- Key rotation / forward secrecy where the chosen protocol supports it

**Exit criteria:** Server logs/storage inspection confirms no plaintext message content is ever visible server-side; messages remain decryptable and translatable correctly on both ends.

---

## Phase 6 — Encrypted Photos

**Goal:** Extend the E2EE model to photo sharing.

Implement:
- Local photo encryption before upload (Web Crypto)
- FastAPI-issued presigned upload URLs for **Cloudflare R2** (private bucket, no public access)
- Direct browser-to-R2 encrypted upload; `encrypted_photos` metadata + R2 object key recorded in MongoDB Atlas
- FastAPI-issued presigned download URLs, re-checked against `connections` ACCEPTED state before issuance
- Local decryption on receipt
- Secure image display

**Security work introduced here (see `security.md`):**
- File type/content validation (not extension-based), performed client-side before encryption
- File size limits, enforced both client-side and via presigned URL constraints
- R2 bucket kept private; all access via short-lived, scoped presigned URLs
- Randomized/non-predictable R2 object keys
- Guarantees that uploaded content can never be executed as code

**Exit criteria:** Photos are shared with MongoDB only ever storing R2 object references/metadata and R2 only ever holding ciphertext blobs; upload validation rejects disguised/malicious file content; presigned URLs are correctly scoped and short-lived.

---

## Phase 7 — Security Testing & Hardening

**Goal:** Dedicated adversarial pass across the full stack, using `security.md` as the checklist.

Test:
- Authentication (credential handling, session fixation, brute-force resistance)
- WebSocket authorization (cross-connection message injection attempts)
- Encryption/session handling (replay attempts, key-exchange tampering)
- XSS and CSP effectiveness
- CSRF where applicable
- Rate limiting behavior (per-IP, per-account, backoff correctness) across all endpoint classes
- Request spam / connection-request abuse
- Malformed message/schema-violation handling
- Storage security (encrypted-at-rest expectations, secrets scanning, access controls)
- Dependency vulnerability audit (frontend + backend)
- File upload safety (see Phase 6)
- Error handling / information leakage review

**Exit criteria:** All items in `security.md` verified with documented results; any findings are remediated or explicitly risk-accepted with rationale.

---

## Phase 8 — UX Polish

**Goal:** Production-readiness of the end-to-end experience.

Improve:
- Responsive design refinement
- Loading states
- Error handling (user-facing generic messages, per `security.md`)
- Offline/reconnection behavior
- Accessibility (keyboard/screen-reader coverage, non-gesture original-reveal path)
- Translation quality tuning
- Original-message interaction polish
- Photo UX (upload progress, failure states, preview)

**Exit criteria:** MVP feature-complete against `prd.md` Section 10 (Success Criteria), with no known critical security or accessibility gaps.

---

## Post-MVP / Future Phases (Not Scheduled)

Tracked in `prd.md` §8 and `memory.md`, not part of the numbered roadmap above:
- Language-learning "Learn" mode
- Language-partner discovery
- Translation quality feedback loop
- Optional translation history controls
- PWA packaging
- Multi-device secure sessions
- Improved/offline translation models
- Additional privacy controls
