# PlexoChat — Security Requirements Document

This document is the authoritative checklist for security controls across PlexoChat. It expands on the security architecture summary in `architecture.md` §9–10 and should be used directly during Phase 2 (auth/accounts), Phase 6 (uploads), and Phase 7 (dedicated security testing) in `phases.md`.

Guiding rule from `prd.md`/`memory.md`: never describe any of this as making the system "100% secure," "unbreakable," or "impossible to hack." These controls reduce risk; they don't eliminate it.

---

## 1. Rate Limiting

Apply tiered rate limiting appropriate to each endpoint class, backed by Redis counters (per `architecture.md` §2):

| Endpoint class | Examples | Limiting strategy |
|---|---|---|
| **Authentication routes** | login, signup, password reset | Handled primarily by **Firebase Authentication**, which applies its own abuse/brute-force protections. PlexoChat does not reimplement password-attempt rate limiting for these Firebase-owned flows. |
| **App auth-adjacent routes** | token/session bootstrap after Firebase login (e.g., "create PlexoChat profile," username/PlexoChat ID claim) | Strictest app-level limits. Combine **per-IP** and **per-account (Firebase uid)** limits. On repeated failures, apply **exponential backoff** rather than a hard lockout. |
| **Public endpoints** | user search, public profile lookup, health checks | Moderate limits — enough to prevent scraping/enumeration abuse without hurting normal usage. |
| **Authenticated user actions** | sending messages, connection requests, settings updates, R2 presigned URL issuance | Looser limits, but still bounded — e.g., protect against connection-request spam, message-flood abuse, and presigned-URL abuse (someone requesting excessive upload URLs). |

Requirements:
- All thresholds (request counts, time windows, backoff multipliers/ceilings) must be **configurable via environment variables or a config service — never hardcoded** in application logic.
- Backoff on app-owned auth-adjacent routes should scale with consecutive failures (e.g., increasing delay) and should reset on success or after a configurable cool-down window.
- Rate-limit responses should return generic messaging (see §5) and appropriate HTTP status codes (e.g., 429) without leaking whether the limiting trigger was per-IP or per-account.
- Connection-request rate limiting doubles as the primary anti-spam control referenced in `prd.md`/`architecture.md`.
- Do not assume Firebase's own protections cover anything outside its own login/signup surface — every custom FastAPI route, including ones that run immediately after a successful Firebase login, needs its own explicit rate limiting.

**Verification (Phase 7):** confirm limits trigger correctly per tier, confirm backoff increases and resets as configured, confirm thresholds are read from config/env rather than constants in code.

---

## 2. Input Validation

- Every input (API request bodies, query params, WebSocket message payloads, file metadata) must be validated against a **strict schema**: type, length, and format constraints.
- Validation must **reject** anything that doesn't conform — do not rely on sanitizing or escaping malformed input and passing it through.
- Backend: enforce via FastAPI/Pydantic models with explicit field constraints (types, `max_length`, regex/format validators) on every route and WebSocket message handler.
- Frontend: mirror validation client-side for UX responsiveness, but treat it as advisory only — the backend validation is the actual security boundary.
- Apply this equally to structured fields (usernames, PlexoChat IDs, language codes) and to message/ciphertext envelopes (correct shape, size bounds, expected metadata fields) even though message *content* itself is opaque ciphertext to the server.

**Verification (Phase 7):** submit malformed/oversized/wrong-type payloads to every endpoint and WebSocket message type; confirm rejection with generic errors (§5), not partial processing.

---

## 3. Secrets Management

- Scan the complete codebase (frontend and backend) for hardcoded API keys, tokens, passwords, or other credentials.
- All secrets must be sourced from environment variables (or a secrets manager), never committed to source control.
- **Stack-specific secrets checklist** — confirm each of these lives server-side only, never in the repo or frontend bundle:
  - Firebase Admin SDK service account key/JSON (backend only — this is distinct from the Firebase **client** config, which is expected to be public by design; do not confuse the two, but do not skip auditing that only the client config, not the Admin key, ends up in the frontend).
  - MongoDB Atlas connection string/credentials.
  - Redis connection string/credentials.
  - Cloudflare R2 access key ID and secret access key (used server-side only to mint presigned URLs — never exposed to the browser).
- Verify nothing sensitive is bundled into frontend build output — audit the built JS bundle for accidentally inlined secrets (a common risk with `NEXT_PUBLIC_*`-style environment variables in Next.js, which are exposed to the client by design).
- Add automated secret-scanning to CI (e.g., a pre-commit/CI hook that scans diffs and the full repo history for credential patterns) so this isn't a one-time manual check.
- `.env` files and equivalents must be git-ignored; provide a `.env.example` with placeholder values only.

**Verification (Phase 7, and ongoing in CI):** run a secrets scan across the full repo and git history; inspect the production frontend bundle for leaked values; confirm `.env`/credential files are excluded from version control.

---

## 4. Dependency Vulnerabilities

- Run a dependency audit across both frontend (`npm audit` or equivalent) and backend (`pip-audit` or equivalent) regularly, not just once.
- For each finding, record: package, current version, vulnerability severity, and whether a safe upgrade or replacement is available.
- Prioritize remediation by severity (critical/high first), and prefer upgrading over replacing unless the maintained upgrade path is blocked.
- Where a vulnerable dependency cannot be immediately updated (e.g., breaking change, no patch yet), document the risk acceptance and any compensating controls.
- Integrate dependency auditing into CI so new vulnerable dependencies are caught before merge, not discovered later.

**Verification (Phase 7, and ongoing in CI):** run the audit, produce a findings table (package / severity / fix available / action taken), and confirm no unaddressed critical/high findings remain unresolved without documented justification.

---

## 5. Error Handling & Information Leakage

- Users must never see stack traces, internal file paths, raw database errors, or other implementation detail in any response (HTTP or WebSocket).
- Return **generic, user-safe messages** for all error conditions (e.g., "Something went wrong. Please try again." / "We couldn't process that request.").
- Log **full error detail** server-side (stack trace, request context, correlation/request ID) for debugging, but keep that detail out of any client-facing payload.
- Use a centralized exception-handling layer in FastAPI (custom exception handlers) so this is enforced consistently rather than per-route.
- Include a correlation/request ID in the generic user-facing error so support/debugging can locate the corresponding detailed server log without exposing that detail to the user.
- This applies explicitly to third-party service errors too: raw Firebase Admin SDK errors, MongoDB Atlas driver exceptions, Redis connection errors, and Cloudflare R2/S3-compatible API error payloads must all be caught and mapped to a generic client-facing message — never passed through verbatim (these often contain internal hostnames, connection details, or resource identifiers).
- Apply the same principle to WebSocket error frames and to any auth failure responses (do not reveal whether a failed login was due to an unknown username vs. wrong password, for example — see §1's related backoff behavior).

**Verification (Phase 7):** force a range of failure conditions (DB error, validation error, auth failure, unexpected exception) and confirm client responses are generic while server logs contain full detail with a matching correlation ID.

---

## 6. File Upload Safety (Photos)

Since PlexoChat MVP scope is photo sharing only (not general file upload — see `prd.md`), apply the following to the photo upload path:

- **Type validation:** verify actual file content/magic bytes, not just the file extension or client-supplied MIME type, to confirm the upload is genuinely an image of an allowed format.
- **Size validation:** enforce a maximum upload size, configurable rather than hardcoded, consistent with the rate-limiting configurability principle in §1.
- **Content validation:** since photos are end-to-end encrypted client-side before upload (see `architecture.md` §6), the server generally handles opaque ciphertext blobs rather than raw image bytes — validation of "is this really an image" therefore needs to happen **client-side before encryption**, and the server-side checks should focus on blob size/format-envelope sanity rather than image parsing, since the server cannot and should not decrypt content.
- **Storage isolation:** encrypted blobs are stored in **Cloudflare R2**, entirely outside the web/app server — never on the FastAPI host's filesystem. The R2 bucket must be **private** (no public bucket access, no public object ACLs); all access happens through short-lived, scoped presigned URLs issued by FastAPI (see `architecture.md` §6 Photo Encryption Flow), never direct/permanent public object URLs.
- **Presigned URL scoping:** upload presigned URLs should be scoped to a single object key, size-limited, short-lived (minutes, not hours/days), and tied to the requesting user's authenticated session (Firebase-verified). Download presigned URLs must additionally be re-checked against the `connections` ACCEPTED-state authorization rule before issuance.
- **No code execution risk:** uploaded content must never be placed anywhere it could be interpreted/executed. Since storage is on R2 (not the application server), this risk is structurally reduced, but still confirm correct `Content-Type`/`Content-Disposition` handling on retrieval to prevent browser content-sniffing execution, and confirm R2 is never configured to serve content from a path reachable by the application's own runtime.
- Apply consistent naming/randomized R2 object keys for uploaded blobs to avoid path traversal or predictable-key enumeration; do not derive object keys from predictable user-visible identifiers alone.

**Verification (Phase 7, aligned with Phase 6 exit criteria in `phases.md`):** attempt to upload disguised/malicious file content, oversized files, and path-traversal-style filenames; confirm rejection, isolated storage, and no execution vector.

---

## 7. Broader Security Requirement Checklist (from product spec)

These sit alongside the six areas above and are tracked through the phases in `phases.md`:

- HTTPS everywhere; WSS for all real-time traffic.
- Secure authentication: delegated to **Firebase Authentication** (credential storage, hashing, and login/signup security are Firebase's responsibility); PlexoChat's backend is responsible for correctly verifying Firebase ID tokens (signature, expiry, issuer/audience claims) via the Firebase Admin SDK on every request.
- Secure session management: rely on Firebase's short-lived ID token + refresh token model; FastAPI should not invent a parallel long-lived session mechanism. If cookies are used to carry tokens, apply `Secure`, `HttpOnly`, `SameSite` attributes.
- Strong random key generation using cryptographically secure randomness (Web Crypto API / equivalent server-side CSPRNGs).
- Proper public/private key management (private keys never leave the device, no server-side plaintext key storage).
- Message integrity/authentication as part of the E2EE protocol (see `architecture.md` §6).
- Replay protection at the protocol level.
- Secure key exchange and key rotation / forward secrecy where the chosen protocol supports it.
- XSS protection (output encoding, React's default escaping preserved, avoid `dangerouslySetInnerHTML` on untrusted content).
- Content Security Policy (CSP) configured restrictively for the frontend.
- CSRF protection where session-cookie-based flows are used.
- Connection-request spam prevention and general abuse prevention (via the connection-acceptance state machine plus §1 rate limiting).
- Secure photo handling end-to-end (§6 above and `architecture.md` §6).
- Minimal server-side metadata retention, consistent with the privacy philosophy in `architecture.md` §8.

---

## 8. Ownership & Cadence

- Security controls above are **not** deferred entirely to a single "security phase" — each is introduced in the phase where its underlying feature is built (see per-phase "Security work introduced here" notes in `phases.md`), with Phase 7 serving as the dedicated verification/hardening pass.
- Dependency audits and secret scans should run in CI on every merge, not only during Phase 7.
- Any accepted risk (e.g., an unpatched dependency with no available fix) must be documented with rationale and revisited on a regular cadence rather than left silently unresolved.
