# PlexoChat — Product Requirements Document (PRD)

## 1. Summary

**Product:** PlexoChat
**One-liner:** A privacy-focused, multilingual messenger that lets people chat naturally in their own language while automatically translating conversations into each other's preferred language.

**Short pitch:** PlexoChat breaks language barriers in everyday conversations by combining natural multilingual messaging, automatic translation, private connections, and end-to-end encrypted communication — while turning real conversations into a natural language-learning experience.

PlexoChat is intentionally focused. It is not a general-purpose social network, and the MVP explicitly excludes voice/video calls, group chats, stories, public feeds, channels, payments, stickers-as-a-core-feature, and general file sharing.

---

## 2. Problem Statement

People want to talk to friends, classmates, and international contacts, but language differences interrupt natural conversation. Today, users must either:

1. Share a common language, or
2. Manually copy/paste text into a separate translator app.

Both options break conversational flow. PlexoChat removes this friction by translating automatically, in the background, as part of the messaging experience itself.

---

## 3. Target Users

- People with friends, classmates, or online contacts who speak a different language.
- Casual, informal communicators who mix languages naturally (e.g., Banglish, code-switching, slang, emojis).
- Privacy-conscious users who want encrypted 1-to-1 conversations rather than a public social platform.
- Incidentally: people who want to pick up a new language through real conversation exposure (secondary benefit, not the core pitch).

---

## 4. Core Product Principles (Source of Truth)

These decisions are locked unless intentionally revisited:

1. Product name: **PlexoChat**.
2. Fully web-based application (desktop + mobile web, responsive).
3. 1-to-1 private messaging only — no groups in MVP.
4. Text + photo communication only.
5. Automatic translation of every message — no manual "translate" action required.
6. Translation target is always the **receiver's** preferred language, not the sender's.
7. The **sender also sees the translated version by default**, not their own original text.
8. The original message is never overwritten or destroyed — translation is a presentation layer only.
9. Double-click (desktop) / double-tap (mobile) toggles between translated and original view.
10. An accessible, non-gesture alternative ("View original") must also exist.
11. Natural mixed-language input (romanized script, code-switching, slang, emojis) must be supported without forcing users to pick a "writing language."
12. Connections require an explicit request + acceptance — no unsolicited messaging.
13. End-to-end encryption (E2EE) applies to both text and photos.
14. Client-side/local translation is preferred to preserve strict E2EE privacy guarantees.
15. The server acts primarily as an **encrypted relay** plus coordination service (auth, discovery, connection state, delivery state).
16. No voice, video, group chat, or public social features in the MVP.
17. Language learning is a secondary, emergent benefit — not the primary pitch.
18. No custom cryptography — only established protocols and maintained libraries.
19. Marketing/product copy must avoid absolute security claims ("100% secure," "unbreakable," "impossible to hack").

---

## 5. Core User Experience

### 5.1 Sending and receiving with translation

Each user sets a **preferred receiving language** in their profile.

Example:
- User A (English) sends: *"Ami ajke আসতে parbo na because amar class ache."*
- User B (German) receives: *"Ich kann heute nicht kommen, weil ich Unterricht habe."*
- User A also sees the German-to-English (or their own preferred) translated rendering by default, not their raw typed text.

Translation direction is always driven by the **recipient's** preferred language, and this applies symmetrically in both directions of a conversation.

### 5.2 Natural multilingual input

Users must be able to type naturally without selecting a source language per message. Supported input patterns include:
- Native scripts (e.g., Bengali)
- Romanized/transliterated text (e.g., Banglish)
- Mixed-language ("Hinglish"/"Banglish"-style) sentences
- Slang, casual tone, emojis

Translation output should preserve meaning, tone, informality, and emojis, and should avoid unnecessarily formal phrasing when the source is casual. Conversation context should inform translation quality where possible.

### 5.3 Revealing the original message

- Desktop: double-click a translated message to reveal the original; double-click again to return to translation.
- Mobile web: double-tap performs the same toggle.
- Accessibility requirement: a non-gesture alternative (e.g., a "View original" menu item or button) must always be available — double-click/tap cannot be the only path.
- A subtle UI indicator (e.g., "Translated • DE") should signal that a message is a translation.

### 5.4 Connections (identity & discovery)

Users have: display name, unique username, unique PlexoChat ID, optional profile photo, preferred receiving language, and account/device cryptographic keys.

To start a conversation, a user searches by username or PlexoChat ID (search results expose only minimal public identification info) and sends a connection request.

**Connection state machine:**
```
NONE → REQUEST_SENT → PENDING → ACCEPTED → E2EE_SESSION_ESTABLISHED → ACTIVE_CHAT
```

The receiving user can **Accept**, **Decline**, or **Block**. Messaging is only possible after acceptance — this is the core anti-spam / anti-abuse mechanism for the MVP.

### 5.5 Photo sharing

- Sender selects a photo → it is encrypted locally → encrypted blob sent over WSS → server stores/relays ciphertext only → receiver downloads ciphertext → receiver decrypts locally → photo is displayed.
- The server should never need access to plaintext photo content.
- No general-purpose file sharing (documents, videos, arbitrary file types) is in scope for MVP — photos only.

---

## 6. Explicitly Out of Scope for MVP

- Voice calls
- Video calls
- Group chats / channels
- Stories / status updates
- Public feed or discovery feed
- Payments
- Stickers as a core feature
- General-purpose file sharing
- Public social networking features (followers, public profiles, etc.)
- Language-partner discovery ("I speak X / want to learn Y" matching)
- In-app language-learning mode (word/phrase explanations, pronunciation)
- PWA packaging
- Multi-device secure sessions

These may be considered post-MVP (see Section 8).

---

## 7. Functional Requirements

| # | Requirement | Priority |
|---|---|---|
| F1 | User registration/login with secure credential handling | Must |
| F2 | Profile: display name, username, PlexoChat ID, avatar, preferred receiving language | Must |
| F3 | User search by username / PlexoChat ID, returning minimal public info | Must |
| F4 | Connection request lifecycle: send, accept, decline, block | Must |
| F5 | Real-time 1-to-1 text messaging over WebSocket (WSS) | Must |
| F6 | Automatic language detection + translation of every sent message | Must |
| F7 | Receiver-language-targeted translation, symmetric for both participants | Must |
| F8 | Original-message preservation and reveal (gesture + accessible alternative) | Must |
| F9 | Encrypted 1-to-1 photo sharing | Must |
| F10 | End-to-end encryption for text and photos | Must |
| F11 | Message delivery status (sent/delivered/read where feasible) | Should |
| F12 | Chat history persistence (ciphertext at rest server-side) | Must |
| F13 | Reconnection handling for dropped WebSocket connections | Should |
| F14 | Responsive layouts for desktop and mobile web | Must |
| F15 | Settings: language preference, blocked users, account/session management | Must |

---

## 8. Future / Post-MVP Features

- Language-learning "Learn" mode (word/phrase/pronunciation explanations)
- Language-partner discovery ("I speak / I want to learn" matching)
- Translation quality feedback loop
- Optional translation history controls
- Progressive Web App (PWA) packaging
- Multi-device secure sessions
- Improved/offline on-device translation models
- Additional privacy controls

These must not distract from MVP delivery and should be tracked separately from the phase roadmap in `phases.md`.

---

## 9. Non-Functional Requirements

- **Privacy:** server should operate on the minimum data necessary (auth, discovery, connection state, encrypted relay, delivery state). It should not require plaintext messages, plaintext photos, or private keys.
- **Security:** see `security.md` for the full requirement set (rate limiting, input validation, secrets handling, dependency hygiene, error handling, file upload safety) plus the cryptographic requirements in `architecture.md`.
- **Availability/Reliability:** graceful reconnection and delivery-state recovery after network interruption.
- **Performance:** translation and message round-trip should feel near-instant in normal conditions; no artificial multi-second delays in the core chat loop.
- **Accessibility:** all core interactions (including original/translation toggle) must have a non-gesture equivalent.
- **Honesty in claims:** all security/privacy messaging must be accurate about the threat model — never claim absolute security.

---

## 10. Success Criteria (MVP)

- Two users with different preferred languages can create a connection and exchange messages, each seeing the conversation in their own preferred language by default.
- Either user can reliably view the original message via gesture or accessible control.
- Messages and photos are encrypted client-side before transmission; the server never sees plaintext content.
- Unsolicited messaging is impossible — connection acceptance is enforced server-side.
- The application is fully usable on both desktop and mobile web.
