# PlexoChat — Design Document (UX/UI)

## 1. Design Philosophy

PlexoChat should feel like a **modern, private messenger** first, and a translation tool second. Translation is meant to disappear into the background of the conversation — the product philosophy is:

> People should be able to speak naturally without worrying about language barriers.

Design goals:
- Familiar messaging UX (chat list + conversation view) so users don't need to learn a new mental model.
- Translation is presented as the *default* voice of the conversation, not an add-on feature bolted to the side.
- Original text is one interaction away, never hidden behind a complex flow.
- No visual clutter from language-detection mechanics, confidence scores, or technical translation metadata.

---

## 2. Layout — Desktop (Two-Column)

```
┌────────────────────────────────────────────────────┐
│ PlexoChat                                           │
├───────────────┬────────────────────────────────────┤
│               │                                    │
│ Chats         │       Active Conversation          │
│               │                                    │
│ User 1        │       translated message           │
│ User 2        │       translated message           │
│ User 3        │                                    │
│               │                                    │
│ Connections   │                                    │
│ Settings      │                                    │
│               │                                    │
│               ├────────────────────────────────────┤
│               │  +   Type a message...       Send │
└───────────────┴────────────────────────────────────┘
```

- **Left rail:** Chats list, Connections, Settings — persistent navigation.
- **Right pane:** active conversation with message composer pinned to the bottom.
- **Composer:** text input plus an attachment control (`+`) for photo sharing, and a Send action.

## 3. Layout — Mobile Web (Single-Screen Navigation)

- Single-screen, stack-based navigation between three primary destinations: **Chats**, **Connections**, **Settings**.
- Tapping a chat pushes the conversation view full-screen with a back affordance to return to the chat list.
- Composer pinned to the bottom with the same `+` (photo) and Send controls as desktop, sized for touch targets.
- Conversation view should feel like a standard modern private messenger (bubble-style messages, sender-aligned right/left).

---

## 4. Translation UI

**Default state:** every message renders as the translated text — this is true for both sender and receiver.

**Subtle language indicator:** a small, unobtrusive label under or beside translated messages, e.g.:

```
Translated • DE
```

This communicates that translation occurred without overwhelming the message bubble.

**Revealing the original:**
- **Desktop:** double-click a translated message bubble → shows the original text in place. Double-click again → returns to translated text.
- **Mobile web:** double-tap performs the identical toggle.
- **Accessible alternative (required):** a message context menu or visible control offering **"View original"**, so the feature does not depend solely on a discoverable gesture. This should be reachable via keyboard/screen-reader-friendly interaction patterns (e.g., a focusable button, `aria-label`, and appropriate `role`).
- Toggling is per-message and local to the view; it does not mutate any stored data — the original is never overwritten (see `prd.md` §5.3 and `architecture.md` message model).

**Visual treatment while toggled:** consider a brief, subtle visual cue (e.g., a border color shift or small "Original" tag) so users always know which mode they're viewing, especially important for accessibility and to avoid confusion mid-conversation.

---

## 5. Connections & New Chat Flow

- **New Chat** entry point (e.g., a button in the Chats rail/screen) opens a search field.
- Search accepts username or PlexoChat ID and returns **minimal public info only**: display name, username, avatar (no email, no language preference exposure beyond what's needed for identification, no additional metadata).
- Sending a request transitions state to `REQUEST_SENT`; the UI should reflect pending state clearly (e.g., "Request sent" badge) rather than opening a live chat.
- Recipients see incoming requests in a dedicated **Connections** area with **Accept / Decline / Block** actions.
- Only after **Accept** does the conversation become available in the Chats list — no message history or composer should be visible before acceptance.

---

## 6. Settings

Minimum settings surface for MVP:
- Preferred receiving language selector.
- Profile: display name, username (if changeable), avatar.
- Blocked users list with unblock control.
- Session/account management (sign out, active sessions if supported).
- Security/privacy info panel — accurate, non-absolute language about encryption (see `security.md` and `architecture.md`).

---

## 7. Visual & Interaction Principles

- **Clarity over decoration:** the chat surface should not be visually noisy; translation indicators and original/translation toggles must remain secondary to the message content itself.
- **Consistent iconography** for send, attach, and reveal-original actions across desktop and mobile.
- **Responsive breakpoints:** two-column layout collapses to single-screen navigation below a defined width breakpoint (mobile web target).
- **Loading and offline states:** show clear, non-alarming states for connecting/reconnecting WebSocket sessions and for messages pending encryption/delivery.
- **Error states:** user-facing errors must be generic and non-technical (e.g., "Message couldn't be sent — retrying…") — see `security.md` for the error-handling/information-leakage requirement.
- **Emoji and casual tone support:** rendering must preserve emojis faithfully through translation and display.

---

## 8. Accessibility Requirements

- All interactive elements (send, attach, accept/decline/block, view original, settings controls) must be keyboard-navigable and screen-reader labeled.
- The original/translation toggle must have a non-gesture path (see §4).
- Color contrast for message bubbles, indicators, and status badges should meet WCAG AA at minimum.
- Touch targets on mobile should meet standard minimum sizes (~44x44px) for composer controls and per-message action menus.

---

## 9. Content & Tone Guidance

- UI copy should be simple, warm, and non-technical.
- Never present translation as flawless; avoid language implying guaranteed accuracy.
- Never present security/encryption claims in absolute terms (no "unbreakable," "100% secure," "impossible to hack") anywhere in the UI, onboarding, or marketing copy — align with `prd.md` §4 item 19 and `security.md`.
