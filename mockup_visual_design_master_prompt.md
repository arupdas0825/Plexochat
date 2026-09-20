# PlexoChat — Master Prompt: Implement Mockup Visual Design (Settings, Languages, Chat, Chat Options)

Ei prompt-ta ekta shared mockup image-er visual design PlexoChat-e implement korar jonno। Beshirbhag underlying functionality **already build hoyeche** (per earlier work) — eta primarily ekta **visual/UI matching pass**, wired to real existing data, notun feature toiri na kore.

---

## 0. GLOBAL INSTRUCTION + TWO DECISIONS TO CONFIRM FIRST (age eta dao)

```
I'm attaching a mockup image showing the target visual design for four
PlexoChat screens: Settings, Languages, an active Chat, and a Chat Options
panel, plus marketing-style feature cards and a language-grid graphic
(the bottom "25 Supported Languages" grid and "Main Features to
Implement" checklist are reference/pitch material, not literal screens to
build — only the four phone-frame screens at the top are actual UI to
implement).

GROUNDING — reuse, do not rebuild: per the earlier established codebase
state, real-time messaging, Firebase auth, Olm E2EE, Redis presence, read
receipts, WebRTC voice/video calls, the 25-language translation registry
and per-chat/per-user language switching, mute/favorite/disappearing-
messages on conversations, and bio/spoken/learning-languages profile
fields are ALL already implemented. This task is about making the EXISTING
functionality look like the mockup, not building it from scratch.

BEFORE BUILDING — TWO THINGS TO CONFIRM WITH ME, DO NOT SILENTLY DECIDE:

1. BOTTOM NAVIGATION CHANGE: the mockup shows a 4-tab bottom nav — Chats,
   Calls, Community, Settings — which differs from PlexoChat's current
   navigation (Home, Explore, Chats, Calendar, Settings, per earlier UI
   work). Specifically, "Community" conflicts with a LOCKED product
   decision in /Docs/memory.md (§3, Explicitly Excluded from MVP: "Public
   social networking features"). Do NOT implement a "Community" tab or
   any public/social feed behind it. Options, report back which you
   implemented: (a) keep the existing nav structure as-is and only apply
   the mockup's VISUAL styling (colors, icon treatment, active states) to
   it, or (b) adopt a "Chats / Calls / Explore / Settings" 4-tab structure
   (dropping "Community" entirely, keeping "Explore" since that's an
   existing, already-scoped feature, and adding "Calls" as a real call-
   history tab since WebRTC calling already exists) — (b) is the
   RECOMMENDED default if a 4-tab layout is wanted, but confirm this
   interpretation in your summary rather than assuming silently.

2. BRAND ACCENT COLOR: the mockup uses a teal/mint-green accent
   throughout (toggles, selected states, sent-message bubbles, the
   PlexoChat logo mark). The app's existing established accent color is
   indigo/purple (per /Docs/design.md and the existing UI). Confirm: are
   we REPLACING the brand accent color app-wide with this teal/green, or
   should teal/green be used only within the specific screens shown in
   the mockup while the rest of the app keeps its existing indigo accent?
   Full app-wide replacement is a bigger, more consistent change but
   touches every screen's design tokens. Recommend a full, consistent
   app-wide switch if adopted at all (a split-accent app looks
   unintentional) — but confirm this decision explicitly in your summary
   rather than picking one silently, since it's a real brand decision, not
   a minor styling tweak.

Once confirmed/decided, apply the SAME resolved nav structure and accent
color consistently across the whole app, not just the four screens shown
in the mockup — an inconsistent application would look like an unfinished
redesign.
```

---

## 1. Design Tokens (match the mockup's visual language)

```
Update or confirm the app's design tokens to match the mockup's visual
character:
- Dark theme as shown (deep near-black background, e.g. #0B0F14-ish,
  card/row surfaces a slightly lighter dark gray).
- Primary accent: teal/mint-green (e.g. in the #2FBF95–#34D399 range —
  sample the exact mockup color rather than guessing) — used for: primary
  buttons (Send), active toggle states, selected list-row checkmarks,
  the sent-message bubble background, active bottom-nav icon, the
  PlexoChat wordmark accent.
- Received-message bubbles: dark neutral gray, clearly distinguishable
  from the teal sent bubbles.
- List rows throughout Settings/Chat Options: icon (muted/outline style,
  NOT colorful per-row, consistent with the earlier UI-simplification
  pass already applied to this app) + title + short gray subtitle +
  trailing chevron (for navigation rows) or a toggle switch (for boolean
  settings) — exactly the pattern shown in the mockup's Settings and Chat
  Options screens.
- Section dividers: subtle, thin, low-contrast — matching the mockup's
  restrained spacing between grouped rows.
- Maintain the app's EXISTING restrained-icon-usage rule from the earlier
  UI-simplification pass (single consistent icon set, no per-row colorful
  icon backgrounds) — the mockup's icons are all a consistent muted tone,
  which aligns with, not contradicts, that earlier work.
```

## 2. Settings Screen

```
Match the mockup's Settings screen layout and row set, wiring EVERY row
to real functionality (per the app's existing no-fake-settings rule):

Header: back arrow, "Settings" title, search icon, edit icon.
Profile block: avatar, display name, @username, tap-to-edit affordance.

Rows (icon + title + subtitle + chevron), reusing existing
functionality where it already exists, and flagging any row that would
need NEW backend work:
- Payments — ONLY include this row if PlexoChat actually has any
  payment-related functionality; per /Docs/prd.md, payments are
  explicitly out of scope for PlexoChat. DO NOT build a Payments
  screen/feature. If you include this row at all (optional, match mockup
  exactly), it must NOT be implemented — flag it as omitted, don't fake
  it, per the no-fake-settings rule. Recommend simply omitting this row
  entirely rather than shipping a dead end.
- Subscription — same treatment as Payments: no monetization exists in
  PlexoChat's current scope; omit or flag as not implemented, don't build
  a fake "explore premium benefits" screen.
- Linked devices — only build this if the app tracks multiple
  device/session state somewhere; check before building, report if this
  is new scope.
- Account — security notifications, change number: wire to real account
  data (existing Firebase-linked user record).
- Privacy — blocked accounts (reuse the existing block system), 
  disappearing messages (reuse existing feature — link into its existing
  settings location rather than duplicating).
- Languages — app language, translation settings: wire directly to the
  already-implemented 25-language registry and per-user/per-chat
  language preference system (see Section 3 below — this row should
  navigate to that screen).
- Chats — chat history, backup: "backup" ONLY if actually implemented
  (per the app's existing rule against fake settings) — otherwise omit.
- Notifications — message/call/update alerts: wire to real notification
  preferences if they exist, or flag as new scope if not.
- Appearance — chat theme, app icon, app theme: wire to the app's
  existing light/dark/system theme mechanism if one exists.
- Storage and data — manage storage, data usage: build this against
  real local storage usage (IndexedDB size, translation cache size) if
  measurable; otherwise show an honest "not yet available" state rather
  than a fake number.
- Help — help center, contact us: can link to static content/external
  links, no backend needed.

Bottom nav: per the Section 0 decision on nav structure — apply
consistently.
```

## 3. Languages Screen (dedicated, per mockup)

```
Build this as a dedicated screen (navigated to from Settings > Languages),
wired to the already-implemented 25-language registry and per-user/
per-chat preference system:

- App language row (UI chrome language — separate concept from message
  translation target, per the mockup's own distinction).
- "Chat translation" toggle (global auto-translate on/off) — wire to the
  existing translation_enabled preference.
- "Your chat language" dropdown — this maps to the user's own
  preferred_receiving_language.
- "Translate incoming messages to" dropdown — per the mockup this appears
  to duplicate the above; clarify/confirm with the existing per-chat
  override concept from the earlier translation-settings work (per-chat
  preference -> global user preference -> app default) rather than
  introducing a third, redundant language setting. Reconcile the
  mockup's two dropdowns into the ALREADY-DEFINED priority system, don't
  add a new one.
- "Popular languages (25)" list: scrollable list of the 25-language
  registry entries, each with a flag icon, native name, and a checkmark
  on the currently-selected one — pull flag/name data from the registry
  (Section 1 of the earlier translation master prompt), don't hardcode a
  second list here.
```

## 4. Chat Screen — Translated Message Bubble Treatment

```
Match the mockup's message-bubble translation display: a small,
lightweight caption line ABOVE the translated text reading "(Translated
to {language})" in a muted/smaller font, then the translated message text
in the normal bubble style below it. Sent bubbles in the resolved accent
color (Section 0/1), received bubbles in dark neutral gray. Reuse the
EXISTING translation-display and original-reveal mechanism (double-click/
tap + accessible "View original" control, per earlier design work) —
only the visual caption style should change to match this mockup, not the
underlying interaction logic.

Composer: match the mockup's icon set — emoji, attachment/plus (only if a
real attachment feature exists; per the locked decision, photo sharing is
descoped, so this icon should be omitted or repurposed, not left as a
dead button), a translate-toggle icon inline in the composer (quick
per-message translate on/off, if that's genuinely a distinct control from
the chat-level toggle — confirm this isn't redundant with the Chat
Options "Translation settings" entry before adding a third place to
control the same thing), mic (voice message — only if implemented,
otherwise omit), send button in the resolved accent color.

Chat header: avatar, name, online status (reuse existing Redis presence),
video call and voice call icon buttons (reuse existing WebRTC calling,
only shown when eligible per the existing rule), more-options (opens Chat
Options per Section 5).
```

## 5. Chat Options Panel

```
This maps directly onto the ALREADY-BUILT Chat Info / Chat Options panel
from earlier work — extend/restyle it to match the mockup's row set and
visual treatment, don't rebuild it:

- View contact (existing)
- Search in chat (existing — client-side only, per the store-and-forward
  architecture, already correctly scoped in earlier work)
- Media, links and docs — per the locked decision, photo sharing is
  descoped, so this section has no media to show; if you include this
  row at all, it must show an honest empty state, never fake content;
  consider omitting the row entirely until/unless media sharing is ever
  reconsidered.
- Mute notifications toggle (existing `muted` field — reuse)
- Disappearing messages (existing — reuse, don't duplicate)
- Chat lock — this is NEW scope (no existing implementation found in
  earlier analysis). If building this now, design it explicitly: what
  does "locking" a chat do (hide from chat list behind biometric/PIN? Just
  hide message previews?) — propose the simplest interpretation
  (hide chat content behind a re-auth prompt) and confirm before/while
  building rather than guessing silently.
- Translation settings (existing — this row should open/link to the same
  per-chat language override described in Section 3, not a separate
  control)
- Wallpaper — NEW scope, a simple per-chat or global background-image/
  color setting; confirm this is wanted as real, working scope before
  building (it's a nice-to-have, not core to PlexoChat's chat/translation
  focus).
- Clear chat (existing — reuse, local-only per store-and-forward
  architecture, already correctly worded in earlier work)
- Export chat — NEW scope; if building, clarify what's exported (locally
  stored decrypted messages? as what format?) and confirm this doesn't
  create a privacy/security gap (exporting decrypted chat history to a
  file is a meaningful data-handling decision, not a trivial UI toggle) —
  propose an approach before implementing.
- Block (existing — reuse)
- Report — NEW scope if no reporting/moderation pipeline currently
  exists; if there's nowhere for a report to go (no admin/moderation
  system), either build a minimal real destination (e.g. an email/webhook
  to the Owner) or clearly avoid shipping a report button that goes
  nowhere — confirm before building.
```

## 6. Feature Cards / Marketing Material (bottom of the mockup image)

```
The "Real-time Translation / 25 Major Languages / End-to-End Encryption /
Voice & Video Call" feature cards and the "25 Supported Languages" grid
and "Main Features to Implement" checklist at the bottom of the attached
image are PITCH/REFERENCE material, not screens to build into the app.
If a marketing landing page is wanted using this visual style, treat that
as a SEPARATE task (reuse the earlier landing-page master prompt's
structure/rules) rather than building it as part of this in-app screen
work — confirm with me before building any public marketing page from
this reference.
```

---

REQUIRED (standard checklist, per all earlier prompts in this project):
inspect existing code first, reuse existing functionality (translation,
E2EE, presence, calls, mute/disappearing/block, language registry) rather
than rebuilding it, never break currently-working real-time messaging,
preserve auth, no fake/non-functional settings rows (Payments,
Subscription, Media in particular — flag rather than fake), migrations
for any genuinely new backend field (Chat lock, Wallpaper, Export, Report
if built), updated types, production build + mobile/PWA verification, and
a report covering: (1) which of the two Section 0 decisions were resolved
and how, (2) which mockup rows map to existing features vs. new scope,
(3) files changed, (4) any rows you recommend omitting rather than
building as fake placeholders.
```

---

## Kivabe use korbe

1. **Section 0-er duita decision** age Antigravity ke answer korte dao (nav structure ar accent color) — eigulo report na kore shuru korle scope silently change hoye jete pare, specially "Community" tab-ta locked decision-er sathe directly conflict kore.
2. Baki sections (1-6) ekshathe paste koro — beshirbhag jaigay "reuse, don't rebuild" bola ache karon functionality already ache, eta primarily visual matching pass.
3. **Payments, Subscription, Media, Wallpaper, Export chat, Report, Chat lock** — ei row-gulo mockup-e dekha jacche kintu PlexoChat-er current scope-e nei. Prompt-e explicit bola ache: fake/dead button hisebe na rakhte, ba to real build koro noyto omit koro — eta khub important, karon app-er nijer "no fake settings" rule already established ache.
