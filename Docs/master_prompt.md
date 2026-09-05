# PlexoChat — Master UI/UX Prompt (for Antigravity + 21st.dev)

Ei document ta directly copy-paste kore Antigravity (ba je kono AI coding agent) ke dite paro. Prompt ta design.md/architecture.md er sathe consistent, ar প্রতিটা page-er জন্য আলাদা section deya আছে।

---

## 0. GLOBAL INSTRUCTION (Antigravity ke sob page-er age eta bolo)

```
You are acting as a UI/UX Pro Max design engineer for a product called PlexoChat —
a privacy-focused, end-to-end encrypted, 1-to-1 multilingual messenger with automatic
translation. Use your top-tier UI/UX skill mode for everything you design.

DESIGN SYSTEM SOURCE:
- Use 21st.dev as the primary component/design inspiration and component library
  source for all UI you generate. Pull layout patterns, component structure, and
  interaction patterns from 21st.dev's best-in-class examples (chat apps, landing
  pages, auth flows, profile/settings UIs, dashboards) rather than generic defaults.
- Where 21st.dev has a matching pattern (hero sections, chat bubbles, sidebar nav,
  auth forms, profile cards, empty states, skeleton loaders), adapt it — don't
  reinvent from scratch.
- Combine 21st.dev patterns with shadcn/ui primitives and Tailwind CSS utility
  classes. Keep the component structure clean, composable, and typed (TypeScript
  + React + Next.js).

DESIGN PRINCIPLES (non-negotiable):
1. Feel like a modern, premium, private messenger (think: the polish of a
   top-tier messaging app), NOT a generic template or admin dashboard.
2. Translation must feel invisible and native — never present as a "tool bolted
   onto the side."
3. Every interactive element must have an accessible fallback (no feature can be
   gesture-only, e.g., double-click/double-tap to reveal original text must also
   have a visible "View original" control).
4. Full responsive support: desktop two-column layouts collapse into a clean
   single-screen mobile navigation pattern.
5. Consistent design tokens: one type scale, one spacing scale, one color system
   (support light + dark mode), one icon set (lucide-react preferred).
6. Micro-interactions and motion should be subtle, purposeful, and fast — never
   gratuitous. Use these to reinforce state changes (message sent, connection
   accepted, translation toggle) not for decoration.
7. Never use absolute/overclaiming security language in UI copy (no "100% secure",
   "unbreakable", "unhackable").
8. Accessibility: WCAG AA contrast minimum, full keyboard navigation, proper
   aria-labels, visible focus states.

DELIVERABLE FORMAT:
- Production-ready React + TypeScript + Tailwind components.
- Include responsive breakpoints (mobile-first, then tablet/desktop).
- Include empty states, loading/skeleton states, and error states for every screen.
- Include dark mode variants using Tailwind's dark: classes / CSS variables.
- Reference 21st.dev component names/patterns you drew from in code comments,
  so the design lineage is traceable.

Now build the following pages/screens using this system, one at a time, in this
order: (1) Welcome, (2) Landing, (3) Home/Chat List, (4) Chat Box, (5) Profile.
```

---

## 1. WELCOME PAGE — Master Prompt

```
Design the PlexoChat WELCOME screen — the very first screen a new visitor sees
before signup/login. This is NOT the marketing landing page (that's separate,
see Section 2) — this is the lightweight in-app welcome/auth entry screen.

GOAL: In under 3 seconds, communicate "this is a private, multilingual messenger"
and get the user into signup or login with zero friction.

MUST INCLUDE:
- PlexoChat logo/wordmark, centered or top-aligned.
- One-line value proposition: "Chat naturally. We handle the translation."
- Two clear primary actions: "Create Account" (primary button) and
  "Log In" (secondary/text button).
- A subtle visual motif suggesting multilingual chat — e.g., a soft animated
  or static illustration of chat bubbles morphing between scripts/languages
  (Bengali → English → German), without being gimmicky.
- Trust signals presented HONESTLY: a small line like "End-to-end encrypted •
  Private by design" — never "100% secure" or "unbreakable" language.
- Language selector for the welcome screen itself (the UI chrome language,
  separate from the eventual "preferred receiving language" setting).
- Fully responsive: single centered column on both desktop and mobile, generous
  whitespace, no clutter.

REFERENCE FROM 21st.dev:
- Pull from 21st.dev's minimal SaaS/auth-entry landing patterns and messaging-app
  welcome screens — clean centered hero + dual CTA pattern.

STATES: default, loading (checking existing session), and a graceful redirect
state if the user is already authenticated.
```

---

## 2. LANDING PAGE (Marketing) — Master Prompt

```
Design the PlexoChat public MARKETING LANDING PAGE (plexochat.com) — this is
for visitors who are not yet users, aimed at conversion to signup.

STRUCTURE (in order):
1. Navbar — logo, nav links (Features, Security, How it works), Log In,
   primary "Get Started" CTA button. Sticky on scroll, transparent-to-solid
   transition.
2. Hero section — headline: "Speak your language. They'll hear theirs."
   Subheadline explaining automatic translation + E2EE privacy in one sentence.
   Primary CTA ("Get Started Free") + secondary CTA ("See how it works").
   Visual: a live-feeling animated chat mockup showing one message typed in
   one language (e.g., mixed Bengali/English) appearing translated in real
   time on the other side — this IS the core product hook, make it prominent.
3. "How it works" section — 3-4 step visual explainer (Type naturally →
   Auto-translated → End-to-end encrypted → Delivered), using icons/illustration,
   not just text.
4. Feature grid — cards for: Automatic Translation, End-to-End Encryption,
   Private Connections (request/accept model), Original Message Reveal,
   Encrypted Photo Sharing, Responsive on any device. Use icon + short headline
   + 1-sentence description per card.
5. "Why privacy matters" / Security section — explain the local-translation +
   E2EE architecture in plain language, HONEST framing (no absolute security
   claims), link out to a security/trust page.
6. Social proof / testimonial or use-case section (placeholder content OK) —
   e.g., a cross-language friendship story format.
7. Final CTA band — big "Create your account" button, minimal distraction.
8. Footer — links (Product, Security, Legal/License, Trademark, Contact),
   copyright, PlexoChat™ trademark notice.

VISUAL DIRECTION:
- Premium, calm, trustworthy — think privacy-first fintech/messaging brand
  aesthetic, not playful/toy-like.
- Strong but restrained color accent (pick ONE brand accent color + neutral
  grays), full dark mode support.
- Real animated or interactive chat-translation demo component is the hero
  centerpiece — prioritize building this well over any other single element.

REFERENCE FROM 21st.dev:
- Pull hero section, feature-grid, and footer patterns from 21st.dev's top
  SaaS landing page examples. Pull the animated chat-bubble demo pattern from
  21st.dev messaging/chat component examples, adapted to show translation.

STATES: default, mobile nav (hamburger → full-screen menu), scroll-triggered
section animations (subtle, on-view fade/slide only).
```

---

## 3. HOME / CHAT LIST PAGE — Master Prompt

```
Design the PlexoChat HOME screen — the authenticated main screen showing the
user's chat list, connections, and settings entry point. Reference architecture:
desktop = two-column layout (left rail + active conversation), mobile = single-
screen stack navigation between Chats / Connections / Settings.

DESKTOP LAYOUT:
- Left sidebar (fixed width ~280-320px): PlexoChat logo/wordmark at top,
  search bar ("Search chats or start new"), "+ New Chat" button, then three
  tabs/sections: Chats (default), Connections (with unread request badge),
  Settings (icon, bottom of sidebar).
- Chat list items: avatar, display name, last message preview (translated
  text, truncated), timestamp, unread badge, small "Translated" indicator
  if last message was translated for this user.
- Right pane: shows the active conversation (see Section 4), or an empty
  state ("Select a chat to start messaging" with an illustration) when no
  chat is selected.

MOBILE LAYOUT:
- Single full-screen view with a bottom tab bar or top segmented control:
  Chats / Connections / Settings.
- Tapping a chat pushes a full-screen conversation view (Section 4) with a
  back button.
- "+ New Chat" as a floating action button or top-right icon button.

NEW CHAT / CONNECTIONS FLOW:
- "New Chat" opens a search modal/sheet: search by username or PlexoChat ID,
  results show avatar + display name + username only (minimal public info).
  "Send Request" button per result, with a "Request sent" confirmed state.
- Connections tab: incoming requests list (Accept / Decline / Block actions
  per row), and an "Active Connections" list.

EMPTY STATES:
- No chats yet: friendly illustration + "Connect with someone to start
  chatting" + CTA to New Chat.
- No connection requests: simple friendly empty state.

REFERENCE FROM 21st.dev:
- Pull the two-pane messenger layout pattern (sidebar + chat list + detail
  pane) from 21st.dev's chat/messaging app templates. Pull search/command-
  palette style pattern for the "New Chat" search modal.

STATES: loading skeletons for chat list on initial load, real-time new-message
indicator (list item re-orders/highlights on new incoming message), offline/
reconnecting banner at the top when WebSocket drops.
```

---

## 4. CHAT BOX (Conversation View) — Master Prompt

```
Design the PlexoChat CHAT BOX — the core conversation screen. This is the
single most important screen in the product; the translation UX must feel
completely seamless here.

HEADER:
- Back button (mobile only), recipient avatar + display name, a subtle
  presence/status indicator, and an overflow menu (View profile, Block,
  Clear chat — no destructive action without confirmation).

MESSAGE LIST:
- Standard chat-bubble pattern, sender-aligned right, recipient-aligned left.
- DEFAULT STATE of every bubble = the TRANSLATED text (for both sender and
  receiver — this is a core, easy-to-get-wrong product rule, implement it
  exactly this way).
- Small, unobtrusive indicator under/beside translated bubbles: "Translated • DE"
  (language code of the target language).
- Reveal-original interaction:
  - Desktop: double-click a bubble → smoothly cross-fades/reveals the
    original text in place; double-click again → returns to translated.
  - Mobile: double-tap performs the same toggle.
  - MANDATORY accessible alternative: a per-message context menu (long-press
    on mobile, right-click or a "..." icon on desktop) with a "View original"
    option — must work without relying on the double-click/tap gesture.
  - Add a brief visual cue while showing the original (e.g., a subtle
    border-color shift or a small "Original" tag) so users always know which
    mode they're viewing.
- Message metadata: timestamp, delivery state (sent/delivered/read ticks).
- Emoji rendering must be crisp and preserved through translation display.
- Support for photo message bubbles: blurred/skeleton placeholder while
  decrypting, then full image with tap-to-expand/lightbox view.

COMPOSER (bottom, pinned):
- Text input (auto-expanding textarea, placeholder: "Type a message..."),
  attach/photo button (+), emoji picker button, Send button.
- Typing indicator for the other user.
- Encrypting/sending micro-state shown briefly on send (e.g., a subtle
  spinner-to-checkmark transition on the message bubble) — reinforces the
  "this is being encrypted" trust signal without being alarmist or overstated.

STATES TO DESIGN:
- Empty conversation (no messages yet — friendly prompt to say hello).
- Connection pending (if somehow reached before ACCEPTED — should show a
  "waiting for [name] to accept" state instead of a composer).
- Reconnecting/offline banner with queued/pending message indicators.
- Failed-to-send message state with a retry action (generic error copy only
  — no technical error detail ever shown to the user).
- Blocked-user state (composer disabled, explanatory message).

REFERENCE FROM 21st.dev:
- Pull the chat-bubble, composer, and typing-indicator patterns from 21st.dev's
  messaging/chat UI component collection. Adapt the "message actions on
  hover/long-press" pattern for the View-original control.

ACCESSIBILITY: every message must be reachable and actionable via keyboard
and screen reader, including the original/translation toggle.
```

---

## 5. PROFILE PAGE — Master Prompt

```
Design the PlexoChat PROFILE / SETTINGS screen. This covers the user's own
profile plus account and privacy settings (see design.md Section 6 for the
required settings surface).

LAYOUT:
- Desktop: can be a modal/panel overlay on top of Home, or a dedicated route
  with the same left-sidebar shell as Home for navigation consistency.
- Mobile: full-screen view, pushed from the Settings tab, with a back button.

SECTIONS (in order):
1. Profile header — large avatar (with "change photo" affordance), display
   name (editable inline), username (@handle, editable with availability
   check), PlexoChat ID (read-only, copyable, with a small "copy" icon
   button).
2. Preferred receiving language — a clear, prominent selector (searchable
   dropdown/combobox), since this is the single most important personalization
   setting in the product. Show a one-line explanation: "All messages you
   receive will be translated into this language."
3. Privacy & Security — a card summarizing "Your messages and photos are
   end-to-end encrypted" (honest framing, link to a fuller security/trust
   explainer page), plus session management (active sessions / sign out of
   this device), and a link to blocked users.
4. Blocked users — list with avatar, name, and "Unblock" action per row;
   empty state if none.
5. Account — email/phone (if used), password change / security key
   management, delete account (destructive, requires confirmation flow with
   clear consequences stated).
6. App preferences — theme (light/dark/system), notification preferences,
   UI language (chrome language, separate from preferred receiving language).
7. Sign out — clearly separated, secondary-styled action at the bottom.
8. Legal footer links — License, Trademark, Privacy Policy, Terms.

INTERACTION DETAILS:
- Inline-editable fields should have clear edit/save/cancel affordances, with
  optimistic UI + graceful error rollback (generic error messaging only).
- Destructive actions (delete account, sign out of all devices) require an
  explicit confirmation dialog.
- Avatar upload should show a crop/preview step before confirming, and must
  go through the same client-side validation rules described in security.md
  (real content/type check, size limit) before any encrypted upload occurs.

REFERENCE FROM 21st.dev:
- Pull the settings-page layout (grouped cards/sections, inline-editable
  profile header) pattern from 21st.dev's account-settings / profile page
  examples. Pull the confirmation-dialog pattern from their modal/dialog
  component examples.

STATES: loading skeleton on first load, save-in-progress micro-states per
field, error state per field (inline, generic message), success toast on
save.
```

---

## How to Use This With Antigravity

1. Paste **Section 0 (Global Instruction)** first, in its own message/turn, so Antigravity locks in the design system and 21st.dev sourcing rule for the whole session.
2. Then paste **Section 1–5** one at a time, in order, each as its own prompt — this keeps output quality high and lets you review/iterate per screen before moving on.
3. After each screen, you can add a short follow-up like: *"Now show me 2 alternate visual directions for the hero/chat-bubble style, both still sourced from 21st.dev patterns"* if you want to compare options before locking a direction.
4. Keep this file (`master_prompt.md`) alongside `design.md`, `architecture.md`, and `phases.md` in the repo so the design system stays traceable to the product decisions already made.
