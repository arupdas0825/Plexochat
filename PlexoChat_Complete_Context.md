# PlexoChat — Complete Product & Technical Context

## 1. Project Overview

**Project name:** PlexoChat

PlexoChat is a private, multilingual, web-based messaging platform designed to help people communicate across language barriers while naturally supporting language learning.

The core idea is simple:

> Users write messages naturally in their own language. PlexoChat automatically translates each message into the receiving user's preferred language, so both participants can communicate comfortably even when they do not share the same language.

The platform is intentionally focused and does not attempt to become a general-purpose social network.

### Core communication features

- 1-to-1 text messaging
- Secure photo sharing
- Automatic multilingual translation
- Original-message reveal
- End-to-end encryption (E2EE)
- Private user-to-user connections
- Responsive desktop and mobile web experience

The MVP should NOT include:
- Voice calls
- Video calls
- Group chats
- Stories/status
- Public feed
- Channels
- Payments
- Stickers as a core feature
- General file sharing
- Public social networking features

---

## 2. Main Problem

People around the world want to communicate with friends, classmates, online contacts, communities, and international connections, but language differences often make communication difficult.

Traditional messaging apps generally require users to:
1. Know a common language, or
2. Copy/paste messages into a translator.

This interrupts natural conversation.

PlexoChat aims to remove that friction.

Instead of manually translating messages, users simply type naturally. The platform handles the translation automatically.

---

## 3. Core User Experience

Each user has a preferred **receiving language**.

For example:

### User A
- Preferred receiving language: English

### User B
- Preferred receiving language: German

User A writes:

> "Ami ajke আসতে parbo na because amar class ache."

User A's input can contain:
- Bengali script
- English
- Romanized Bengali / Banglish
- Mixed-language sentences
- Slang
- Emojis
- Casual conversational language

The system translates the message into the recipient's preferred language.

If User A sends the above message to User B, User B receives:

> "Ich kann heute nicht kommen, weil ich Unterricht habe."

Importantly, **User A also sees the translated version by default**, rather than seeing their own original message.

Both User A and User B can double-click the translated message on desktop web, or double-tap on mobile web, to reveal the original message.

Double-click/tap again returns to the translated version.

### Critical rule

The original message is NEVER overwritten or destroyed.

Translation is a presentation layer.

Conceptually:

```text
Original message
       ↓
Translation
       ↓
Displayed translated message
       ↓
Double-click / double-tap
       ↓
Original message
```

---

## 4. Reverse Conversation

Translation always depends on the **receiver's preferred language**, not the sender's language.

Example:

User B writes in German:

> "Ich komme morgen vielleicht etwas später."

User A's preferred receiving language is English.

User A sees:

> "I might be a little late tomorrow."

User B also sees the English translated version by default.

Both can reveal the original German message.

Therefore:

```text
Sender's input language
        ↓
Automatic language detection
        ↓
Receiver's preferred language
        ↓
Translation
        ↓
Translated message displayed to BOTH users
```

---

## 5. Natural Multilingual Input

PlexoChat must NOT force users to manually select their writing language for every message.

Users should be able to type naturally.

Examples:

```text
Ami ajke college jabo but weather ta khub kharap.

Ami ajke আসতে parbo na because amar class ache.

Bro ami maybe 10 min late hobo 😂

I think ajke দেখা করা possible hobe na.

Kal class ache so maybe tomorrow.
```

The system should detect the language composition and translate the semantic meaning into the target language.

The translation system should preserve:
- Meaning
- Conversational tone
- Informality
- Emojis
- Appropriate slang where possible
- Context from the conversation

The system should avoid unnecessarily formal translations when the original message is casual.

---

## 6. Language Learning Benefit

Language learning is a natural secondary benefit of PlexoChat.

Users repeatedly see real-world conversations in another language.

For example, a user who normally speaks Bengali may repeatedly see:

```text
German:
Ich komme morgen etwas später.
```

Over time, the user may naturally become familiar with:
- Vocabulary
- Common phrases
- Sentence structures
- Conversational patterns

A future feature may add a **Learn** interaction that explains:
- Individual words
- Useful phrases
- Sentence structure
- Pronunciation
- Contextual meaning

However, this should NOT be part of the initial MVP unless needed.

The primary product remains a messaging platform.

---

## 7. User Identity & Connection System

PlexoChat is based on intentional private connections.

Users have:

- Display name
- Unique username
- Unique PlexoChat ID
- Optional profile photo
- Preferred receiving language
- Account/device cryptographic keys

A user can select **New Chat** and search another user using:
- Username
- Unique PlexoChat ID

The search result should expose only minimal public information necessary for identification.

The user can then send a connection request.

### Connection flow

```text
NONE
  ↓
REQUEST_SENT
  ↓
PENDING
  ↓
ACCEPTED
  ↓
E2EE_SESSION_ESTABLISHED
  ↓
ACTIVE_CHAT
```

The receiving user can:
- Accept
- Decline
- Block

Only after acceptance should the private communication session become active.

This prevents random unwanted messaging and reduces spam.

---

## 8. Future Language Partner Discovery

A future version may support language-learning-oriented discovery.

For example:

```text
I speak:
Bengali

I want to learn:
German
```

Another user might have:

```text
I speak:
German

I want to learn:
Bengali
```

PlexoChat could suggest these users as potential language partners.

However, explicit connection request + acceptance should remain the core privacy model.

This feature is NOT required for MVP.

---

## 9. Photo Sharing

PlexoChat supports private photo transfer between connected users.

Photo flow:

```text
Sender selects photo
        ↓
Photo encrypted locally
        ↓
Encrypted photo sent through WSS
        ↓
Server stores/relays ciphertext
        ↓
Receiver downloads ciphertext
        ↓
Receiver decrypts locally
        ↓
Photo displayed
```

The server should not need access to the plaintext photo.

No general-purpose file-sharing system is required for MVP.

---

## 10. End-to-End Encryption

Privacy is a core requirement.

Both text messages and photos should use end-to-end encryption.

### Preferred architecture

Encryption should happen on the client/device before data is transmitted to the server.

Therefore:

```text
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
WSS
   ↓
FastAPI Server
   ↓
WSS
   ↓
Receiver Browser
   ↓
Decryption
   ↓
Translated plaintext displayed
```

The server should primarily operate as an encrypted relay.

It should NOT require plaintext message contents or plaintext photos.

### Important security principle

Do NOT invent custom cryptographic algorithms.

Use established cryptographic protocols and well-maintained libraries.

The implementation should provide, where supported:
- Confidentiality
- Message authentication/integrity
- Secure key exchange
- Replay protection
- Secure randomness
- Key rotation
- Forward secrecy

The exact protocol/library should be selected carefully during implementation.

---

## 11. Important E2EE + Translation Constraint

True E2EE and server-side plaintext translation create a privacy conflict.

If a cloud translation API receives the plaintext message:

```text
User → Server → Translation API
```

then the message is not fully private from the infrastructure handling that plaintext.

Therefore, for a strict E2EE architecture:

```text
User's device
   ↓
Translate locally
   ↓
Encrypt locally
   ↓
Send ciphertext
```

This keeps the plaintext away from the server.

If a third-party cloud translation service is ever used, the privacy/security claim must be explicitly qualified.

Do not claim that the system is completely E2EE if plaintext is sent to an external translation provider.

---

## 12. Web Application Architecture

PlexoChat is intentionally **fully web-based**.

It should work on:
- Desktop browsers
- Laptop browsers
- Mobile browsers

A PWA can be considered later.

### Recommended frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Recommended backend

- Python
- FastAPI
- Uvicorn
- WebSocket / WSS

### Data layer

- PostgreSQL
- Redis when needed for real-time presence, temporary state, rate limiting, etc.

### Browser storage

- IndexedDB where appropriate
- Web Crypto API
- Established E2EE/crypto libraries as appropriate

---

## 13. Real-Time Communication Architecture

Conceptual architecture:

```text
┌──────────────────────┐
│     User A Browser   │
│  React / Next.js     │
│  Local Translation   │
│  E2EE / Web Crypto   │
└──────────┬───────────┘
           │
          WSS
           │
           ▼
┌──────────────────────┐
│    FastAPI Backend   │
│ Authentication       │
│ User Discovery       │
│ Connection State     │
│ Encrypted Relay      │
│ Delivery State       │
└──────────┬───────────┘
           │
          WSS
           │
           ▼
┌──────────────────────┐
│     User B Browser   │
│  React / Next.js     │
│  Local Translation   │
│  E2EE / Web Crypto   │
└──────────────────────┘
```

The backend should function primarily as a secure message/photo relay and coordination service.

---

## 14. Backend Data Model

Conceptual entities:

### User

```text
id
username
display_name
profile_photo_reference
preferred_receiving_language
created_at
```

### ConnectionRequest

```text
id
sender_id
receiver_id
status
created_at
```

### Connection

```text
id
user_a_id
user_b_id
status
created_at
```

### DeviceKey

```text
id
user_id
device_identifier
public_key
key_metadata
created_at
```

Private keys must remain on the user's device and should never be stored as plaintext server-side secrets.

### ChatSession

Represents the secure session between connected users/devices.

### EncryptedMessage

Conceptually:

```text
message_id
chat_id
sender_device_id
ciphertext
nonce_or_protocol_metadata
created_at
delivery_state
```

The server should not need the plaintext message.

### EncryptedPhoto

Conceptually:

```text
photo_id
chat_id
sender_device_id
encrypted_blob_reference
encryption_metadata
created_at
```

---

## 15. Message Representation

A message should conceptually have:

```text
Original plaintext
Translated plaintext
Encryption payload
Metadata
```

But the server should primarily handle the encrypted payload.

On the client, translation should be treated as a representation of the original message.

Example:

```json
{
  "original": "Ami ajke আসতে parbo na because amar class ache.",
  "translated": "Ich kann heute nicht kommen, weil ich Unterricht habe.",
  "targetLanguage": "de"
}
```

This is a conceptual client-side representation only.

The actual network payload should be encrypted.

---

## 16. UI / UX

### Desktop

Recommended two-column structure:

```text
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

### Mobile

Use a single-screen navigation pattern.

The user can move between:
- Chats
- Connections
- Settings

The chat interface should feel like a modern private messenger.

---

## 17. Translation UI

The translated message is the default representation.

Optional subtle indicator:

```text
Translated • DE
```

The original should be accessible without cluttering the interface.

Desktop:
- Double-click translated message → show original
- Double-click again → show translation

Mobile:
- Double-tap translated message → show original
- Double-tap again → show translation

### Accessibility requirement

Double-click/double-tap should NOT be the only method.

Provide an accessible alternative such as:

```text
View original
```

or a message context menu.

---

## 18. Core Product Philosophy

PlexoChat is NOT simply an AI translator.

It is a communication platform where translation happens naturally in the background.

The product philosophy:

> **People should be able to speak naturally without worrying about language barriers.**

The long-term vision is:

```text
Speak naturally
      ↓
Connect globally
      ↓
Understand each other
      ↓
Learn naturally
```

---

## 19. Security Requirements

Security should be considered from the beginning.

Important requirements:

- HTTPS
- WSS
- Secure authentication
- Secure password handling if passwords are used
- Secure session management
- Strong random key generation
- Public/private key management
- Message integrity/authentication
- Replay protection
- Secure key exchange
- Key rotation
- Forward secrecy where supported
- XSS protection
- Content Security Policy (CSP)
- Dependency security
- Input validation
- Rate limiting
- Connection-request spam prevention
- Abuse prevention
- Secure photo handling
- Minimal server-side metadata

### Web-specific E2EE consideration

A web application has an additional trust issue:

The server controls the JavaScript delivered to browsers.

Therefore, a compromised server/deployment pipeline could theoretically deliver modified client code.

Do NOT describe PlexoChat as:
- "100% secure"
- "unbreakable"
- "impossible to hack"

Security claims should accurately describe the threat model and implementation.

---

## 20. Privacy Philosophy

The server should know only what is necessary to operate the service.

Ideally the backend can handle:

```text
Authentication
User discovery
Connection requests
Connection state
Encrypted message relay
Encrypted photo relay
Delivery state
Minimal operational metadata
```

It should not need:

```text
Plaintext messages
Plaintext photos
Private encryption keys
```

---

## 21. MVP Development Roadmap

### Phase 1 — UI Prototype

Build:
- Landing/login interface
- Chat list
- Chat screen
- Message composer
- Connection request UI
- Settings
- Responsive mobile layout

No real messaging initially.

### Phase 2 — Accounts & Connections

Implement:
- User accounts
- Username
- PlexoChat ID
- Preferred receiving language
- User search
- Connection requests
- Accept/Decline/Block

### Phase 3 — Real-Time Messaging

Implement:
- WebSocket/WSS
- Message delivery
- Delivery status
- Chat history
- Reconnection handling

### Phase 4 — Translation

Implement:
- Language detection
- Mixed-language input handling
- Local/on-device translation
- Receiver-language targeting
- Translation display
- Original-message reveal

### Phase 5 — E2EE

Implement:
- Device key generation
- Secure key exchange
- Encrypted message payloads
- Session management
- Replay protection
- Key rotation/forward secrecy where supported

### Phase 6 — Encrypted Photos

Implement:
- Local photo encryption
- Encrypted upload/relay
- Local decryption
- Secure image display

### Phase 7 — Security Testing

Test:
- Authentication
- WebSocket authorization
- Encryption/session handling
- XSS
- CSRF where applicable
- Rate limiting
- Request spam
- Malformed messages
- Replay attempts
- Storage security
- Dependency vulnerabilities

### Phase 8 — UX Polish

Improve:
- Responsive design
- Loading states
- Error handling
- Offline/reconnection behavior
- Accessibility
- Translation quality
- Original-message interaction
- Photo UX

---

## 22. Future Features

Possible future additions:

- Language-learning mode
- Vocabulary explanations
- Phrase explanations
- Pronunciation support
- Language partner discovery
- "I speak / I want to learn" profiles
- Translation quality feedback
- Optional translation history controls
- PWA
- Multi-device secure sessions
- Better offline translation
- Additional privacy controls

These should not distract from the MVP.

---

## 23. Important Product Decisions

These decisions should be treated as the current source of truth unless intentionally changed later:

1. Product name: **PlexoChat**
2. Fully web-based application
3. 1-to-1 private messaging
4. Text + photo communication only
5. Automatic translation
6. Translation target = receiver's preferred language
7. Sender also sees the translated version by default
8. Original message remains available
9. Double-click/tap toggles original/translation
10. Accessible "View original" alternative should exist
11. Natural mixed-language/Banglish input is supported
12. Explicit connection request + acceptance
13. E2EE for text and photos
14. Client-side/local translation is preferred for strict privacy
15. Server acts primarily as encrypted relay
16. No voice/video/group chat/public social features in MVP
17. Language learning is a secondary benefit, not the primary product
18. No custom cryptography
19. Avoid absolute security claims

---

## 24. One-Sentence Description

> **PlexoChat is a privacy-focused multilingual messenger that lets people chat naturally in their own language while automatically translating conversations into each other's preferred language.**

---

## 25. Short Pitch

> **PlexoChat breaks language barriers in everyday conversations by combining natural multilingual messaging, automatic translation, private connections, and end-to-end encrypted communication—while turning real conversations into a natural language-learning experience.**
