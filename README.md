<div align="center">

<img width="125" height="125" alt="PlexoChat logo" src="https://github.com/user-attachments/assets/1accdeb3-a42b-4fb6-ac9e-aba509a90044" />

# PlexoChat

### Speak naturally. We handle the translation.

**A privacy-focused, multilingual messenger that lets people chat naturally in their own language — while automatically translating every conversation into each other's preferred language.**

<br/>

[![License](https://img.shields.io/badge/license-Proprietary-red.svg?style=flat-square)](./LICENSE.md)
[![Status](https://img.shields.io/badge/status-Live%20in%20Production-brightgreen.svg?style=flat-square)](https://plexochat.vercel.app)
[![Encryption](https://img.shields.io/badge/encryption-E2EE%20(Olm%2FSignal)-6366f1.svg?style=flat-square)](./Docs/architecture.md)
[![Trademark](https://img.shields.io/badge/trademark-PlexoChat™-black.svg?style=flat-square)](./TRADEMARK.md)

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Firebase](https://img.shields.io/badge/Firebase%20Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)

<br/>

**[Overview](#-what-is-plexochat)** ·
**[Features](#-core-features)** ·
**[Architecture](#-architecture-overview)** ·
**[Security](#-security--privacy)** ·
**[Docs](#-project-documentation)** ·
**[Getting Started](#-getting-started)** ·
**[License](#-license)**

</div>

<br/>

---

## 📖 What is PlexoChat?

> *"People should be able to speak naturally without worrying about language barriers."*

PlexoChat is a private, 1-to-1, end-to-end encrypted messenger. Users write however comes naturally to them — mixed languages, romanized script, slang, emojis — and PlexoChat automatically translates every message into the recipient's preferred language, in the background, without breaking conversational flow.

PlexoChat is deliberately focused: it's a multilingual chat product built around real, natural conversation — with the language exposure that comes from it as a genuine (if secondary) benefit. It is **not** a general-purpose social network, and it deliberately does not carry file/photo sharing, group chats, or public feeds — see [`Docs/prd.md`](./Docs/prd.md) for the full scope rationale.

<br/>

## ✨ Core Features

| | |
|---|---|
| 💬 **Real-time messaging** | 1-to-1 text chat over an authenticated WebSocket connection |
| 🌍 **Automatic translation** | Every message is translated, targeted at the *receiver's* preferred language |
| 🔁 **Original-message reveal** | Double-click/double-tap to see the source text — plus an accessible "View original" control. The original is never overwritten |
| 🔒 **Real end-to-end encryption** | Signal-style double-ratchet E2EE via the audited Olm protocol (`@matrix-org/olm`) — private keys never leave the device |
| ✅ **Read receipts** | WhatsApp-style delivery/read ticks, colored on read |
| 🟢 **Live presence** | Redis-backed online/offline status, resilient across reconnects |
| 📞 **Voice & video calls** | 1-to-1 WebRTC calls, signaled through the existing WebSocket layer — media never touches the backend |
| 🤝 **Consent-based connections** | Messaging requires an explicit request + acceptance — no unsolicited contact |
| 👤 **Rich profiles** | Bio, spoken/learning languages, and interests, surfaced in a dedicated Chat Info panel |
| ⏳ **Disappearing messages** | Optional per-conversation auto-expiry |
| 📱 **Fully responsive** | Polished on desktop and mobile web alike |
| 🧠 **Natural multilingual input** | Mixed languages, romanized script (e.g. Banglish), slang, emojis — no manual "select a language" step |

<details>
<summary><strong>🚫 Deliberately out of scope</strong> (click to expand)</summary>
<br/>

Photo/file sharing, group chats, channels, stories/status, public feed, payments, stickers as a core feature, public social features, language-partner discovery, an in-app "Learn" mode, PWA packaging, and multi-device sessions are all intentionally out of scope. PlexoChat's focus is real, natural, private 1-to-1 conversation — not a broader social platform. See [`Docs/prd.md`](./Docs/prd.md) and [`Docs/memory.md`](./Docs/memory.md) for the full rationale, including why photo sharing was specifically considered and then removed from scope.

</details>

<br/>

## ⚙️ How It Works

```
Sender types naturally (any language/script mix)
        │
        ▼
Local translation, targeted at the recipient's preferred language
        │
        ▼
Local end-to-end encryption (Olm double ratchet)
        │
        ▼
Ciphertext relayed over an authenticated WebSocket
        │
        ▼
Recipient decrypts locally
        │
        ▼
Translated message displayed to BOTH sender and receiver
        │
        ▼
Original always recoverable via double-click/tap or "View original"
```

> The backend never needs plaintext messages or private encryption keys — it authenticates, relays ciphertext, and coordinates presence/connections. It is not a permanent chat-history archive: undelivered messages are held only temporarily and deleted once delivered or once a retention window expires. Real conversation history lives in encrypted storage on your own device.

<br/>

## 🧱 Tech Stack

<div align="center">

| Layer | Technology |
|:---|:---|
| **Frontend** | Next.js + TypeScript |
| **Backend** | FastAPI + Python |
| **Authentication** | Firebase Authentication |
| **Database** | MongoDB Atlas |
| **Real-time / Presence** | WebSocket + Redis |
| **End-to-End Encryption** | Olm (Signal-style double ratchet) via `@matrix-org/olm`, Web Crypto, IndexedDB for local key storage |
| **Calling** | WebRTC (DTLS-SRTP media, STUN/TURN), signaled over the existing WebSocket |

</div>

Full rationale in [`Docs/architecture.md`](./Docs/architecture.md).

<br/>

## 🏗️ Architecture Overview

```
┌────────────────────────┐                ┌─────────────────────────────────────────┐
│     User A Browser     │  WSS (auth'd)  │              FastAPI Backend              │
│  Local Translation       │◄──────────────►│  Verifies Firebase ID tokens               │
│  Olm E2EE / Web Crypto     │               │  User Discovery · Connection State          │
│  WebRTC (calls)              │             │  Encrypted Relay · Read Receipts · Presence   │
└────────────────────────┘                │  WebRTC Signaling Only (no media)               │
                                            └───────┬─────────────┬─────────────┬─────────┘
┌────────────────────────┐                          │             │             │
│     User B Browser     │  WSS (auth'd)             ▼             ▼             ▼
│  Local Translation       │◄──────────────┐   ┌───────────┐ ┌────────────┐ ┌────────────┐
│  Olm E2EE / Web Crypto     │              │   │ Firebase   │ │  MongoDB   │ │   Redis     │
│  WebRTC (calls)              │            │   │ Auth       │ │  Atlas     │ │ (presence,  │
└────────────────────────┘               │   └───────────┘ │(users,conns│ │ rate limits)│
                                           │                 │ device keys│ └────────────┘
                                           └─────────────────│ pending msg│
                                                              └────────────┘
```

The backend is deliberately narrow in scope: **verifying identity, user discovery, connection state, encrypted relay, presence, and WebRTC signaling** — nothing more. It never needs plaintext messages, plaintext media, or private encryption keys.

📄 Full data model, encryption design, and messaging architecture → [`Docs/architecture.md`](./Docs/architecture.md)

<br/>

## 🔐 Security & Privacy

Security is designed in from the start, not bolted on.

- 🔑 **Real E2EE** — Signal-style double-ratchet encryption via the audited Olm protocol, not a placeholder. Identity keys and one-time prekeys are exchanged through the backend (public key material only); private keys are generated and stored exclusively on-device in IndexedDB and never leave it.
- 🌐 **Local-first translation** — translation happens before encryption, on the client, to preserve the E2EE guarantee.
- 📵 **Store-and-forward, not a chat archive** — the backend holds undelivered ciphertext only temporarily (deleted on delivery or after a retention TTL); it is not a permanent message database.
- 🚦 **Tiered rate limiting** — stricter limits on auth-adjacent routes, moderate on public/search endpoints, looser on authenticated actions.
- ✅ **Strict input validation** — reject non-conforming data rather than sanitize-and-continue.
- 🙈 **No hardcoded secrets** — environment variables only, verified not to leak into the frontend bundle or git history.
- 🧯 **Generic user-facing errors** — no stack traces, file paths, or raw database errors ever reach the client.
- 📞 **Calls never touch the backend** — WebRTC media flows peer-to-peer (or via TURN relay when needed); the backend only ever carries signaling messages (offer/answer/ICE/call state).

> PlexoChat does **not** claim to be "100% secure," "unbreakable," or "impossible to hack." Full control specification in [`Docs/security.md`](./Docs/security.md); cryptographic design and threat-model caveats in [`Docs/architecture.md`](./Docs/architecture.md).

<br/>

## 📚 Project Documentation

| Document | Description |
|:---|:---|
| 📋 [`Docs/prd.md`](./Docs/prd.md) | Product requirements — scope, features, success criteria |
| 🎨 [`Docs/design.md`](./Docs/design.md) | UX/UI design — layouts, translation interaction, accessibility |
| 🏗️ [`Docs/architecture.md`](./Docs/architecture.md) | Technical architecture, data model, E2EE design |
| 🗺️ [`Docs/phases.md`](./Docs/phases.md) | Development roadmap, phase by phase |
| 🔐 [`Docs/security.md`](./Docs/security.md) | Full security control specification |
| 🧠 [`Docs/memory.md`](./Docs/memory.md) | Durable decisions log, glossary, and production status |
| ⚖️ [`LICENSE.md`](./LICENSE.md) | Software license terms |
| ™️ [`TRADEMARK.md`](./TRADEMARK.md) | Trademark and brand usage policy |

<br/>

## 🚀 Getting Started

> PlexoChat is live in production. The instructions below are for running it locally.

<details>
<summary><strong>Prerequisites</strong></summary>
<br/>

- Node.js (LTS) and npm
- Python 3.11+
- A Firebase project (Authentication enabled)
- A MongoDB Atlas cluster
- Redis (local or hosted)

</details>

**1. Clone the repository**

```bash
git clone https://github.com/arupdas0825/Plexochat.git
cd Plexochat
```

**2. Backend setup**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your own values — never commit real secrets
uvicorn app.main:app --reload
```

**3. Frontend setup**

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in your own values
npm run dev
```

**4. Environment variables**

All secrets are supplied via environment variables — never hardcoded. This includes the Firebase Admin SDK service account key (backend only — distinct from the public Firebase client config used by the frontend), the MongoDB Atlas connection string, the Redis connection string, and rate-limit thresholds. See `.env.example` in each directory for the required keys, and [`Docs/security.md`](./Docs/security.md) §3 for the full secrets-handling checklist.

<br/>

## 🌐 Deployment

| | |
|:---|:---|
| **Frontend** | [Vercel](https://plexochat.vercel.app) |
| **Backend** | Render (FastAPI, `uvicorn`) |
| **Database** | MongoDB Atlas |

<br/>

## 🗺️ Roadmap

Built incrementally: UI foundations → Accounts & Connections → Real-Time Messaging → Translation → End-to-End Encryption → Presence & Read Receipts → Voice/Video Calls → Security Hardening → UX Polish. Full detail and per-phase notes → [`Docs/phases.md`](./Docs/phases.md)

<br/>

## 🤝 Contributing

Contributions are welcome under the terms of [`LICENSE.md`](./LICENSE.md). By submitting a pull request, you agree that your contribution is licensed under the same terms. Please read `LICENSE.md` and `TRADEMARK.md` before contributing, especially regarding use of the PlexoChat name and branding.

<br/>

## ⚖️ License

**© 2026 Arup Das. All Rights Reserved.**

PlexoChat is **proprietary, closed-source software**. It is not licensed under MIT, Apache-2.0, GPL, BSD, ISC, or any other open-source license. See [`LICENSE.md`](./LICENSE.md) for full terms.

> Copying, redistribution, modification, sublicensing, resale, commercial use, or creation of derivative works — in whole or in part — is prohibited without Arup Das's explicit prior written permission. This also covers the PlexoChat name, logo, branding, UI/UX designs, visual assets, product identity, and original documentation. Unauthorized use may be pursued as a violation of applicable intellectual property law.

## ™️ Trademark

"PlexoChat"™ and the PlexoChat logo are trademarks of **Arup Das**. The software license above does not grant rights to use the PlexoChat name or brand. See [`TRADEMARK.md`](./TRADEMARK.md) for what's permitted and what requires written permission.

<br/>

## 📬 Contact

For licensing, trademark, security disclosures, or general inquiries, contact **Arup Das**.

---

<div align="center">

<sub>© 2026 Arup Das. All rights reserved. PlexoChat is proprietary software.</sub>

**PlexoChat™** — *Speak naturally. Connect globally. Understand each other.*

</div>
