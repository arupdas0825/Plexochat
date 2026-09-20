# PlexoChat — Master Prompt: 25-Language Translation Foundation + Full Settings + Chat Info

Ei prompt-e tomar full spec-ta preserve kora hoyeche, kintu **existing codebase-er reality soho grounded** — age-er deep-analysis-e ja already implemented paoya gecha (bio/spoken/learning languages, mute/favorite, read receipts, disappearing messages) seta explicit note kora ache jate Antigravity notun kore na banay, existing-er upor build kore.

---

## 0. GLOBAL INSTRUCTION (age eta dao)

```
You are building the next PlexoChat phase: a scalable 25-language
translation foundation, live per-user language switching, a complete
Settings experience, and a rich Chat Info panel. Use your UI/UX Pro Max
skill mode for all visual work, and reuse 21st.dev-inspired restraint
(minimal, modern, premium, no unnecessary emoji/color clutter) consistent
with the earlier UI-simplification pass already applied to this app.

READ FIRST: /Docs/architecture.md, /Docs/security.md, /Docs/memory.md
(especially the locked decisions list and the production status
snapshot), /Docs/prd.md. Do not contradict locked decisions there without
flagging it back to me explicitly.

GROUNDING — WHAT ALREADY EXISTS in this codebase (confirmed by direct
inspection in an earlier analysis pass — verify current state yourself,
but start from this baseline rather than assuming a blank slate):
- frontend/src/lib/translation-service.ts already exists as a dedicated
  module — inspect its current implementation before rewriting it. If it
  is still a passthrough or otherwise incomplete, extend/fix it into the
  TranslationService abstraction described below rather than creating a
  second, parallel translation module.
- backend/app/models/user.py already has bio, spoken_languages,
  learning_languages, and interests fields (added in an earlier pass) —
  reuse these for the Chat Info profile display, do not re-add them.
- backend/app/models/conversation.py already has muted and favorite
  fields, and disappearing-message support exists in both
  backend/app/routers/conversations.py and
  frontend/src/components/chat/chat-info-panel.tsx — inspect and extend
  this existing chat-info-panel.tsx component rather than building a new
  one from scratch.
- Read receipts (IncomingReadFrame/OutgoingReadRelayFrame), Redis-backed
  presence, and real E2EE (Olm double ratchet, @matrix-org/olm) are
  already implemented — reuse all of this; this phase's job is
  translation + settings + chat info, not re-deriving messaging/crypto
  infrastructure that already works.
- Real-time WebSocket messaging (backend/app/api/v1/ws.py,
  frontend/src/lib/chat-context.tsx) is live in production — treat it as
  a stable foundation to extend, never to be broken by this work.
- Photo sharing / Cloudflare R2 is explicitly DESCOPED per
  /Docs/memory.md item 13c — do NOT implement it in this phase or any
  other, per that locked decision (this matches your own instruction
  below, just confirming it's consistent with what's already decided).

BRANDING: do not copy WhatsApp branding, logos, exact UI, or proprietary
assets. Use the provided reference (if any) only for information
architecture (grouped settings rows, icons, title+subtitle, chevrons,
switches) — PlexoChat keeps its own distinct visual identity throughout.

Work through the numbered sections below in order. After each major
section, build, verify no regressions to existing messaging/E2EE/presence/
calls, and report before continuing.
```

---

## 1. Language Registry (25 languages, built to scale to 200+)

```
Create ONE centralized language registry (e.g.
frontend/src/lib/languages/registry.ts, mirrored or referenced from the
backend where needed for validation) containing these 25 initial
languages: English, Mandarin Chinese, Hindi, Spanish, Arabic, French,
Bengali, Portuguese, Russian, Urdu, Indonesian, German, Japanese,
Punjabi, Marathi, Telugu, Turkish, Vietnamese, Korean, Italian, Persian,
Tamil, Gujarati, Thai, Dutch — PLUS a 26th entry, Banglish (Bengali,
romanized/informal), code bn-Latn. This is not a fake standalone ISO 639
code — it's a BCP-47-style compound code (base language `bn` + ISO 15924
script subtag `Latn`), since Banglish is a script/style variant of
Bengali, not a separate language. Mark it `status: experimental` and
`translation_availability: requires_special_routing` in the registry (see
the dedicated note below) rather than treating it identically to the
other 25 entries in the translation pipeline.

IMPORTANT — Banglish needs special provider routing, not just a target-
code swap: most standard translation APIs can translate to Bengali
script reliably, but not to a casual ROMANIZED style on their own.
Implement one of: (a) translate to Bengali normally, then apply a
transliteration step (script romanization) as a second pipeline stage, or
(b) if the TranslationService's provider is (or can be) an LLM-based
translator, prompt it directly to output "Bengali in casual romanized
Latin script (Banglish), informal tone" as a single step — option (b) is
the recommended default since PlexoChat's translation quality bar is
already about natural/casual output (not formal MT), so an LLM-capable
provider route likely already exists or is the right direction anyway.
Whichever you implement, this establishes the reusable pattern for any
future romanized-variant language (Hinglish = hi-Latn, Arabizi = ar-Latn,
etc.) — document the chosen approach in the registry entry's
provider_model_route field so it's consistent for future additions.

Each entry: id, ISO/language code (or BCP-47 compound code for script
variants like Banglish), English name, native name, script,
translation availability, status (experimental/supported/tested/validated),
provider/model route.

Never scatter language-specific logic across components — every place
that needs a language list, a language selector, or a language-code
validator must read from this one registry. Adding language #27 must be
a configuration change to this registry (plus provider coverage), never a
rewrite of UI or logic elsewhere. Validate this explicitly: after adding
the registry, do a codebase search for any hardcoded language lists/
selectors and replace them with registry reads.

Backend: add server-side validation of preferred_receiving_language (and
any per-chat language override) against this same registry's valid codes
— reject invalid codes with a generic validation error, per the existing
strict-input-validation pattern already used elsewhere in this backend.
```

## 2. Per-User Language Preference + Live Switching

```
Each user has an independent preferred_receiving_language (field already
exists on the User model — confirm/reuse it, do not duplicate).

Rules to implement exactly:
- User A prefers Bengali, User B prefers German: A sends -> B sees German
  translation; B sends -> A sees Bengali translation. The sender also
  sees the translated presentation, per PlexoChat's existing default-
  shows-translated behavior (already established elsewhere in the app —
  reuse that exact rule here, don't reinvent it).
- NEVER overwrite or destroy the original message text.
- Old/already-received messages must NOT silently re-translate or change
  when a user changes their language preference afterward — only NEW
  messages use the latest preference.
- Language changes must work without logout or page reload, and must
  NEVER cause a WebSocket reconnect — the connection must stay live
  through a preference change (this is a specific, testable requirement,
  not just a nice-to-have).
- Persist the preference to the backend immediately, and cache it safely
  client-side for fast app startup (don't block initial render on a
  round-trip fetch of this value if a cached copy is available).
- Sync across active devices where the existing multi-connection/presence
  infrastructure already supports it (reuse, don't build new
  multi-device sync machinery for this alone).

Settings must expose: app language (UI chrome language), preferred
receiving language, translation ON/OFF, auto-detect incoming language,
per-chat translation language override, and a show-translation/view-
original toggle.

Priority resolution order, exactly: per-chat preference -> global user
preference -> application default. Implement this as a single resolution
function used everywhere translation-target language is determined — not
duplicated logic in multiple components.
```

## 3. Translation Architecture

```
Build (or complete, per the Grounding note in Section 0 — inspect
translation-service.ts first) a TranslationService abstraction:

  translate(text, sourceLanguage, targetLanguage) -> Promise<result>

The UI must never call a translation provider (Google/DeepL/NLLB/etc.)
directly — it always goes through this service, and the service internally
uses a translation ROUTER so the underlying provider/model can be swapped
later without touching UI code.

PRIVACY REQUIREMENT (per /Docs/architecture.md's already-resolved E2EE +
translation tradeoff — do not re-litigate this, just implement it
correctly): prefer local/on-device translation where feasible; if cloud
translation is used, plaintext leaves the device for that API call, and
the privacy/E2EE claim in the UI must be qualified accordingly (reuse
whatever disclosure copy already exists in Settings per the earlier
translation work — verify it's still accurate and visible, update it if
this phase changes the provider/architecture in a way that changes what's
true).

Never falsely claim strict E2EE if plaintext is sent to a third-party
translator for that call. Never log message plaintext or translation
plaintext anywhere (client console in production builds, or backend logs
if any translation-adjacent backend endpoint exists, e.g. a token-minting
endpoint — the endpoint itself must never see or log message content).
```

## 4. Settings Panel — full information architecture

```
Build a dedicated, mobile-first Settings experience (grouped rows: icon,
title, short subtitle, chevron for deeper pages, switches for toggles),
with PlexoChat's own distinct visual identity — informed by structure
only from any reference material, never copying WhatsApp's exact visuals/
branding.

Sections and rows (build ONLY what's real and functional — see the
Production Cleanup requirement in Section 11, no fake/non-functional
settings):

- Profile header: avatar, display name, username/PlexoChat ID, edit
  profile.
- Account: profile, username/PlexoChat ID, account/security info, linked
  devices (only if multi-device is genuinely tracked somewhere — check
  before building this row).
- Privacy: online/last-seen visibility, read receipts (toggle for the
  ALREADY-IMPLEMENTED read-receipt system), typing indicator,
  discoverability, blocked users, disappearing messages (links to the
  ALREADY-IMPLEMENTED feature), chat lock (only if you're building this
  now — flag if it's new scope), location/discoverability.
- Languages: app language, preferred receiving language, translation
  enabled, translation behavior, supported languages (links to the
  registry from Section 1), language detection.
- Chats: chat appearance, enter-to-send, local encrypted storage info,
  clear chat, backup controls ONLY if actually implemented (do not add a
  backup toggle that does nothing).
- Notifications: message notifications, call notifications, connection
  requests, sound/vibration, notification preview.
- Appearance: light/dark/system, chat theme, display preferences.
- Calls: voice-call settings, video-call settings, microphone/camera
  permissions, call notifications (ties into the already-implemented
  WebRTC calling feature).
- Storage & Data: local storage usage, clear local cache, data usage,
  translation cache management.
- Security & E2EE: encryption status (must reflect the REAL Olm E2EE
  state, never a fake/aspirational claim — this app already fixed a false
  E2EE claim once, do not reintroduce one here), device/session
  information, security verification where implemented.
- Help: help center, support, about PlexoChat, privacy policy, terms.
- Account actions: logout, delete account.

Hard rule, repeated because it matters: only display functionality that
actually exists and works. Do not create settings rows/toggles that don't
do anything — this directly violates the app's existing no-mock-data
principle.

Desktop: responsive sidebar/detail layout, integrated with PlexoChat's
existing global navigation (reuse the existing Settings page's panel
pattern per earlier work — don't invent a new layout convention).

Mobile: should feel native and smooth — full-screen pages per section
with a clean back transition, consistent with the app's existing mobile
navigation pattern.
```

## 5. Chat Info / Chat Settings Panel

```
Per the Grounding note in Section 0, chat-info-panel.tsx already exists
with disappearing-messages and mute/favorite support — EXTEND this
component, do not rebuild it from scratch.

Opened via clicking the contact name/profile or a chat menu. Include:
view contact, search in chat (client-side only, per the store-and-forward
architecture — there is no durable server-side history to search, per
the earlier connection-system/chat-info work already done on this
exact point), translation settings (per-chat override, wired to Section
2's priority resolution), notifications/mute (reuse the existing `muted`
field), disappearing messages (reuse existing support), chat lock (flag
if new), media/links/docs section ONLY if media exists (it currently
doesn't, since photo sharing is descoped — show an accurate empty state,
never fake media), block, report.

Contact profile section: avatar, display name, username/PlexoChat ID,
online/offline status (reuse existing Redis-backed presence), spoken
languages, learning languages, bio/interests (all already on the User
model per Section 0's grounding — reuse), connection status, E2EE/session
status (real, per the existing Olm implementation), voice call, video
call (reuse existing WebRTC calling — only show these buttons if calling
is available and the connection is ACCEPTED, per the earlier calls-
feature master prompt's own rule), block/report.
```

## 6. Message UI — Translation Display & Timestamps

```
Translated messages should clearly indicate translation without clutter
— e.g. a subtle "Translated from Bengali" label under the message, not a
heavy badge. Per-message actions: view original, copy, react, reply,
delete for me, delete for everyone (only if actually implemented —
otherwise omit, per the no-fake-features rule).

Timestamps: reuse the EXISTING formatMessageTime() shared utility (already
implemented per earlier work — 12-hour format, no raw ISO strings) and
existing date separators. Never show raw ISO timestamps anywhere in the
normal chat UI — if you find any remaining raw-timestamp rendering during
this pass, fix it using the existing utility rather than writing a new
one.
```

## 7. Real-Time Requirements & Testing

```
Keep the existing Firebase-authenticated FastAPI WebSocket architecture
exactly as-is — this phase must not modify the core messaging transport,
only what rides on top of it (translation target resolution, settings-
driven behavior).

Confirm/preserve: production WSS, real-time 1-to-1 messaging, delivery
acknowledgement, read acknowledgement (already implemented), online/
offline presence (already implemented via Redis), reconnect after network
loss, refresh-safe session restore, temporary encrypted relay only (no
permanent plaintext backend chat storage — locked architecture, do not
change).

TEST with two real Firebase accounts/devices, this exact sequence:
1. A -> B
2. B -> A
3. A changes language
4. B sends another message
5. B changes language
6. A sends another message
7. Disconnect/reconnect
8. Refresh
9. Offline -> online delivery

Changing language must NEVER break the WebSocket session — verify this
explicitly by inspecting the WS connection state (not just the UI) during
step 3 and step 5 of the test above. Show me the actual test output/logs,
not just a description of expected behavior.
```

## 8. Backend/Data

```
MongoDB may store: preferred_receiving_language (exists), spoken_languages
(exists), learning_languages (exists), app_language, translation_enabled,
translation_preferences, privacy_preferences, notification_preferences,
appearance_preferences, call_preferences, chat-level settings metadata
(muted/favorite/disappearing already exist on the conversation model —
extend that document rather than creating parallel per-setting
collections where reasonable).

Do NOT store permanent plaintext messages — this is a locked architectural
decision (/Docs/memory.md §13a), unaffected by this phase's settings work.

Validate every settings value server-side (strict schema, reject
non-conforming input — per the existing input-validation pattern already
used elsewhere in this backend). Authorize every chat/settings action —
never trust a client-provided user ID or permission claim; always derive
identity from the verified Firebase token, exactly as the existing routes
already do.
```

## 9. Performance

```
Restore the Firebase session quickly; load critical profile/preferences
early; lazy-load large settings sub-pages; avoid duplicate API calls;
cache safe (non-sensitive) preferences locally; do not block chat
rendering on non-critical settings; debounce rapid preference updates
(e.g. a user toggling something repeatedly); use optimistic UI where
safe, with rollback on failure (show the new state immediately, revert
with a clear error if the backend call fails).
```

## 10. Security

```
Do not claim "100% secure" or "unbreakable" anywhere in new UI copy — this
app already had to correct a false security claim once; do not
reintroduce that pattern here in different words.

Use established cryptographic primitives/protocols only (this phase
shouldn't need new crypto work, since E2EE already exists — flag it if
it somehow does). Keep private encryption keys client-side (already the
case — don't regress this). Never log plaintext messages or translation
plaintext. Protect Firebase service-account secrets (already handled per
existing config pattern — don't introduce a new leak vector). Validate
connection ownership and authorize every action (reuse existing
ACCEPTED-connection checks). Rate-limit sensitive endpoints (reuse the
existing tiered rate-limiting pattern). Sanitize user-generated profile
text (bio, interests — validate length/content per strict schema, not
just client-side). Do not expose exact location if any location-adjacent
feature (e.g. Explore's discovery map) is touched by this work — reuse
the existing "approximate clusters only" privacy pattern already in place
there, per the earlier UI work on the Explore page.
```

## 11. Production Cleanup — Remove Fake Data

```
Remove ALL: fake users, fake conversations, fake language statistics,
fake online users, fake map activity, fake settings values, demo
messages, placeholder profile data — anywhere they still exist in the
codebase touched by this phase.

Every displayed value must come from real session/backend/local encrypted
state. If no data exists for something (e.g. no shared media, since photo
sharing is descoped; no linked devices, if multi-device isn't tracked),
show a proper, honest empty state — never a fake placeholder value.

As part of this, revisit the mock-chat-data.ts file flagged in the
earlier analysis pass (it currently exports shared TypeScript types, not
actual mock content, which is fine functionally but the name is
misleading) — rename it to something accurate (e.g. chat-types.ts) as
part of this cleanup pass, updating all imports accordingly.
```

## 12. Acceptance Criteria

```
Complete only when:
- All 25 languages exist in the real centralized registry.
- A and B can independently select languages.
- Language changes work without reload and without breaking the
  WebSocket session (verified via actual connection-state inspection,
  not assumption).
- New messages use the latest preference; old messages remain unchanged.
- Originals remain recoverable via the existing reveal mechanism.
- Translation can be toggled per chat.
- Settings works on mobile and desktop, with only real, functional rows.
- Chat Info / Chat Settings works, extending the existing panel.
- No fake data remains anywhere touched by this phase.
- Two real Firebase users can complete the full 9-step test sequence in
  Section 7, with actual output shown.
- UI is production-clean, responsive, and visually consistent with the
  app's existing restrained/professional style (no new emoji/color
  clutter introduced).
- The language-registry architecture can expand from 25 to 100 to 200+
  languages via configuration only.

Do NOT implement Cloudflare R2 / photo sharing in this phase (or any
future phase, per the locked decision in /Docs/memory.md §13c). Do NOT
add fake features just to make the UI look complete.
```

---

## Kivabe use korbe

1. Section 0 age dao — eta sobcheye important, karon eta Antigravity ke bole dey **ja already implemented ache** (translation-service.ts, bio/languages fields, mute/favorite, read receipts, E2EE, presence) — nahole eigulo abar notun kore banate giye duplicate/conflicting code toiri hote pare.
2. Section 1-12 ekshathe ba 2-3 batch-e paste koro — eta already tomar nijer likha excellent structure, ami shudhu grounding ar cross-reference add korechi.
3. **Section 7-er 9-step test** — eta explicitly output/log dekhate bola ache, "language change WebSocket bhangbe na" eta assumption na kore verify kora hoyeche eta confirm koro.
4. **Section 11 (Production Cleanup)** — eta khub important, ei phase-er shesh-e pura app ekbar audit hobe kono fake/mock data reh gelo kina.
