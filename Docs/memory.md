# PlexoChat — Project Memory

Purpose of this document: a compact, durable reference of decisions, constraints, and terminology so that anyone (or any AI assistant) picking up this project later doesn't have to re-derive them from scratch. Treat this as the **source of truth for "what has already been decided"** — if a future conversation or contributor proposes something that contradicts an entry here, flag the conflict explicitly rather than silently overriding it.

---

## 1. Identity

- **Product name:** PlexoChat
- **One-line description:** A privacy-focused multilingual messenger that lets people chat naturally in their own language while automatically translating conversations into each other's preferred language.
- **Not:** a general-purpose social network, a standalone translation app, or a group-chat platform.

---

## 2. Locked Product Decisions (do not silently change)

1. Fully web-based (desktop + mobile browsers); no native app in MVP.
2. 1-to-1 private messaging only.
3. Text + photo only — no other file types.
4. Translation is automatic and always on — never an opt-in manual action.
5. Translation target = **receiver's** preferred language, not the sender's.
6. **Sender also sees the translated version by default** — this is counterintuitive and easy to get wrong; do not default to showing the sender their own raw input.
7. Original message is never overwritten — it is always retrievable.
8. Reveal interaction: double-click (desktop) / double-tap (mobile), **plus** a mandatory accessible non-gesture alternative ("View original").
9. Mixed-language/romanized/code-switched input (e.g., Banglish) must work without the user picking a "language" per message.
10. Messaging requires an explicit connection request **and** acceptance — no unsolicited messaging, ever.
11. E2EE applies to both text and photos.
12. Client-side/local translation is the preferred architecture specifically because it preserves the E2EE privacy claim — if this is ever revisited in favor of a cloud translation API, the E2EE/privacy claims must be re-qualified everywhere (marketing, `architecture.md`, `security.md`, UI copy).
13. The server is designed as a **temporary** encrypted relay + coordination layer — it should never need plaintext messages, plaintext photos, or private keys.
13a. **Store-and-forward messaging (WhatsApp/Signal-style) — locked.** The backend is NOT a permanent chat-history database. Messages/photos are queued as ciphertext only until delivered-and-acknowledged or until a configurable retention TTL expires, then deleted server-side. Real conversation history lives in **encrypted local device storage** (IndexedDB), not in MongoDB. If a future request proposes "just store messages in Mongo for simplicity," that contradicts this locked decision — flag it explicitly rather than silently implementing it.
14. No custom cryptography, under any circumstances — established libraries/protocols only.
15. Never make absolute security claims ("100% secure," "unbreakable," "impossible to hack") in any user-facing or marketing surface.

---

## 3. Explicitly Excluded from MVP

Voice calls, video calls, group chats, channels, stories/status, public feed, payments, stickers-as-core-feature, general file sharing, public social features, language-partner discovery, in-app "Learn" mode, PWA packaging, multi-device sessions.

If any of these come up as a request mid-build, the default answer is: **defer to post-MVP** unless there is an explicit, deliberate decision to pull it forward (and that decision should be recorded back into this file).

---

## 4. Canonical Terminology / Glossary

| Term | Meaning |
|---|---|
| **PlexoChat ID** | Unique identifier for a user, usable alongside username for search/discovery. |
| **Preferred receiving language** | The language a user wants all incoming messages translated into. Drives translation direction. |
| **Original message** | The as-typed source text from the sender, in whatever language/script mix they used. Never deleted or overwritten. |
| **Translated message** | The default-rendered version of a message, targeted at the receiver's preferred language, shown to both participants by default. |
| **Connection** | A mutually-accepted relationship between two users that unlocks messaging. |
| **Connection Request** | A pending, one-directional request to form a Connection; must be Accepted, Declined, or the sender Blocked. |
| **ChatSession** | The secure (E2EE) session tied to an active, accepted Connection. |
| **DeviceKey** | Per-device public key material registered to a user; private keys never leave the device. |
| **Encrypted relay** | The server's core role — moving ciphertext between clients without needing to read it. |
| **Banglish** | Romanized/mixed Bengali-English input, used as the canonical example of the messy real-world input translation must handle gracefully. |

---

## 5. Key Non-Obvious Architectural Facts

- The **E2EE + translation constraint** is the single most important architectural tension in this product: server-side plaintext translation (via a cloud API) is fundamentally incompatible with a genuine E2EE claim. This is why local/on-device translation is the default architectural choice, not a preference.
- Because this is a **web app**, the server delivers the client JavaScript. This means the trust model differs from a natively distributed app — a compromised deploy pipeline could theoretically alter client crypto code. This caveat must always be reflected honestly in security messaging.
- The connection-acceptance state machine (`NONE → REQUEST_SENT → PENDING → ACCEPTED → E2EE_SESSION_ESTABLISHED → ACTIVE_CHAT`) is simultaneously a UX flow **and** the primary anti-spam/anti-abuse control. Don't treat it as "just onboarding UX" — it's load-bearing for security.

---

## 6. Stack Snapshot — FINAL, LOCKED FOR IMPLEMENTATION START

This stack replaces the earlier PostgreSQL-based draft and is the confirmed starting point:

```
Frontend               Next.js + TypeScript
Backend                FastAPI + Python
Authentication         Firebase Authentication
Database               MongoDB Atlas
Real-time / Presence   WebSocket + Redis
Photo Storage          Cloudflare R2
End-to-End Encryption  @matrix-org/olm (Signal Double-Ratchet protocol by Matrix.org)
Translation Provider   Client-side Google Translate (Option B) before encryption, with MyMemory fallback
```

Key implications of this specific stack (record these so they aren't re-derived/re-argued later):
- **Firebase Authentication owns passwords/credentials.** FastAPI never stores or hashes passwords itself — it only verifies Firebase-issued ID tokens via the Admin SDK. PlexoChat's own backend still owns username, PlexoChat ID, display name, preferred receiving language, connections, and device keys.
- **MongoDB Atlas replaces PostgreSQL** as the durable store. Data model is document-based (see `architecture.md` §4), keyed off `firebase_uid` for user identity linkage.
- **Redis** is unchanged in role: real-time presence + rate-limit counters + in-flight delivery/session state.
- **Cloudflare R2 replaces the earlier generic "isolated object storage"** placeholder for encrypted photo blobs. Access pattern is FastAPI-issued short-lived presigned URLs, browser-to-R2 direct upload/download — R2 bucket stays private.
- **Firebase client config vs. Admin SDK key:** the Firebase client-side config (API key, project ID) is expected to be public by Firebase's own design — don't mistake this for a leak. The Admin SDK **service account key** is the actual secret and must never reach the frontend or repo.
- **E2EE Library Selection (LOCKED):** `@matrix-org/olm` (v3.2.15). Signal Double-Ratchet implementation with Curve25519 identity keys, Ed25519 signing keys, and ephemeral one-time prekeys. Private keys remain exclusively in client IndexedDB. Device public keys are published via `POST /api/v1/devices/keys`.
- **Translation Architecture Decision (LOCKED - Option B):** Client-side translation runs directly in the browser *before* Olm encryption. Plaintext is never seen by PlexoChat's servers. Third-party translation disclosure is explicitly declared in Settings UI: *"Messages are translated using a third-party translation service before encryption. Google Translate may process message text for translation purposes. PlexoChat's own servers never see message content."*

---

## 6a. Production Status Snapshot (as of this update)

**PlexoChat is now LIVE in production**, not just planned. Record deviations/additions from the original plan here so future prompts build on reality, not the original draft.

**Live deployment:**
- Frontend: Vercel Edge Network — `https://plexochat.vercel.app`
- Backend: Render Cloud Web Service — `https://plexochat-backend.onrender.com` (Root Directory: `backend`, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`)
- Note: Render/Vercel were not part of the original architecture draft (which was silent on hosting) — this is the confirmed hosting decision going forward. Cloudflare R2, Firebase Auth, and MongoDB Atlas remain as planned.

**Connection state machine — actual implemented version differs slightly from the original draft:**
- Implemented: `NONE → REQUEST_SENT / REQUEST_RECEIVED → ACCEPTED` plus a bidirectional `BLOCKED` state.
- This is a simpler 5-state model than the originally drafted `NONE → REQUEST_SENT → PENDING → ACCEPTED → E2EE_SESSION_ESTABLISHED → ACTIVE_CHAT` chain — `PENDING` was effectively merged into `REQUEST_RECEIVED` (the receiver's-side view of a sent request), and `E2EE_SESSION_ESTABLISHED`/`ACTIVE_CHAT` haven't been implemented as separate tracked states yet (E2EE itself is still an open Phase 5 item). Treat the 5-state model as current reality; revisit whether the finer-grained states are still needed once E2EE lands.
- `DECLINED` is not currently a persisted terminal state in the summary above — confirm/record actual behavior here once verified (does declining just return to `NONE`, allowing a new request?).

**Store-and-forward messaging — confirmed implemented as designed:**
- `pending_messages` collection with a 48-hour MongoDB TTL index is live, matching the locked store-and-forward decision (§13a above). Good — no drift here.

**Rate limiting — implementation detail differs from the original plan:**
- Implemented as an **in-memory sliding window** rate limiter (`backend/app/services/rate_limiter.py`), not the originally-planned Redis-backed limiter. This works for a single backend instance but will need to move to Redis (already present as an optional client — `backend/app/db/redis_client.py`) if/when the backend scales to multiple instances, since in-memory limits don't share state across instances. Flag this before any horizontal scaling work.

**Auth — one addition beyond the original plan:**
- Dual-mode Firebase token verification was added: Firebase Admin SDK when a service account is configured, falling back to direct cryptographic verification against Google's public OAuth2 certificates (`google.oauth2.id_token.verify_firebase_token`) when it isn't. This lets the backend run securely on Render without a static credential file. Also added: auto-provisioning — a verified Firebase user with no MongoDB document yet is created on the fly instead of getting a premature 401. Both are reasonable production hardening, not scope creep — recorded here for traceability.

**Known resolved production issues (for context, don't re-fix):**
- CORS: `https://plexochat.vercel.app` (and any `*.vercel.app` preview) must remain in the allowed-origins regex on the backend — this broke search in production once already (Root Cause B in the project evolution doc) because `ENVIRONMENT` defaulted to `"development"`.
- User search must strip a leading `@` from queries and match both the `@`-prefixed and bare forms (Root Cause C) — don't regress this in any future search-related change.
- Frontend must never fall back to a private/LAN IP for the backend URL when running on a public domain (Chrome Private Network Access warning, Milestone 7) — `isPrivateOrLocalHost()` in `auth-context.tsx` is the guard; keep it intact.

---

## 7. Document Map

| File | Purpose |
|---|---|
| `prd.md` | What we're building and why; scope, requirements, success criteria. |
| `design.md` | UX/UI structure, layouts, interaction patterns, accessibility. |
| `architecture.md` | Technical architecture, data model, E2EE design, security architecture summary. |
| `phases.md` | Sequenced MVP roadmap with per-phase exit criteria. |
| `security.md` | Full security control specification (rate limiting, validation, secrets, dependencies, error handling, file uploads) plus the broader security requirement checklist. |
| `memory.md` | This file — durable decisions, glossary, and open items. |

---

## 8. Open Questions / Not Yet Decided

- [Resolved 2026-09] Exact E2EE protocol/library selection: `@matrix-org/olm` (Double-Ratchet).
- Whether/when passwordless auth (e.g., passkeys) is considered vs. traditional password + hashing.
- Object storage provider/approach for encrypted photo blobs.
- Specific rate-limit thresholds (deliberately left configurable, not hardcoded — see `security.md`).
- Long-term data retention policy for ciphertext and metadata.

Update this section as decisions are made; move resolved items into Section 2 or 6 with the decision and date.
