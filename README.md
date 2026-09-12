<div align="center">

<img width="125" height="125" alt="PlexoChat logo" src="https://github.com/user-attachments/assets/1accdeb3-a42b-4fb6-ac9e-aba509a90044" />

# PlexoChat

### Speak naturally. We handle the translation.

**A privacy-focused, multilingual messenger that lets people chat naturally in their own language — while automatically translating every conversation into each other's preferred language.**

<br/>

[![License](https://img.shields.io/badge/license-Proprietary-red.svg?style=flat-square)](./LICENSE.md)
[![Status](https://img.shields.io/badge/status-MVP%20in%20development-yellow.svg?style=flat-square)](./phases.md)
[![Encryption](https://img.shields.io/badge/encryption-E2EE-6366f1.svg?style=flat-square)](./architecture.md)
[![Trademark](https://img.shields.io/badge/trademark-PlexoChat™-black.svg?style=flat-square)](./TRADEMARK.md)

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Firebase](https://img.shields.io/badge/Firebase%20Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare%20R2-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/developer-platform/r2/)

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

It is intentionally **not** a general-purpose social network. It's a focused messaging product, with real-time translation and end-to-end encryption as first-class citizens rather than bolted-on features.

### The Problem

Two people who want to talk often don't share a language. The usual workarounds — finding a common language or copy-pasting into a separate translator — interrupt natural conversation. PlexoChat removes that friction: type naturally, and the platform handles translation automatically, in both directions, for both participants.

<br/>

## ✨ Core Features

| | |
|---|---|
| 💬 **Real-time messaging** | 1-to-1 text chat over WebSocket (WSS) |
| 🌍 **Automatic translation** | Every message is translated, targeted at the *receiver's* preferred language |
| 🔁 **Original-message reveal** | Double-click/double-tap to see the source text — plus an accessible "View original" control. The original is never overwritten |
| 🔒 **End-to-end encryption** | Applied to both text and photos |
| 🖼️ **Encrypted photo sharing** | The server only ever handles ciphertext |
| 🤝 **Consent-based connections** | Messaging requires an explicit request + acceptance — no unsolicited contact |
| 📱 **Fully responsive** | Polished on desktop and mobile web alike |
| 🧠 **Natural multilingual input** | Mixed languages, romanized script (e.g. Banglish), slang, emojis — no manual "select a language" step |
| 🎓 **Language learning, as a side effect** | A natural byproduct of real conversation exposure — not the core pitch, not a built MVP feature |

<details>
<summary><strong>🚫 Not in the MVP</strong> (click to expand)</summary>
<br/>

To stay focused, the following are explicitly out of scope for the initial release:

Voice calls · Video calls · Group chats · Channels · Stories/status · Public feed · Payments · Stickers as a core feature · General file sharing · Public social features · Language-partner discovery · In-app "Learn" mode · PWA packaging (see [roadmap](#-roadmap)) · Multi-device sessions

See [`prd.md`](./prd.md) for the full rationale and the post-MVP roadmap.

</details>

<br/>

## ⚙️ How It Works

```
Sender types naturally (any language/script mix)
        │
        ▼
Local language detection + translation   (on-device)
        │
        ▼
Local encryption                          (E2EE)
        │
        ▼
Ciphertext relayed over WSS via the server
        │
        ▼
Receiver decrypts locally
        │
        ▼
Translated message displayed to BOTH sender and receiver
        │
        ▼
Original always recoverable via double-click/tap or "View original"
```

> The server never needs plaintext messages, plaintext photos, or private encryption keys — it operates as a coordination and encrypted-relay service only.

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
| **Photo Storage** | Cloudflare R2 |
| **End-to-End Encryption** | Browser-side Web Crypto + an established cryptographic protocol/library |

</div>

> 🔒 **Final, locked stack** for implementation. Full rationale in [`architecture.md`](./architecture.md).

<br/>

## 🏗️ Architecture Overview

```
┌────────────────────────┐                ┌─────────────────────────────────────────┐
│     User A Browser     │    WSS/HTTPS   │              FastAPI Backend              │
│  React · Next.js        │◄──────────────►│  Verifies Firebase ID tokens               │
│  Local Translation       │                │  User Discovery · Connection State          │
│  E2EE / Web Crypto        │                │  Encrypted Relay · Delivery State             │
└────────────────────────┘                │  Presigned R2 Upload/Download URLs             │
                                            └───────┬─────────────┬─────────────┬─────────┘
┌────────────────────────┐                          │             │             │
│     User B Browser     │    WSS/HTTPS              ▼             ▼             ▼
│  React · Next.js        │◄──────────────┐   ┌───────────┐ ┌────────────┐ ┌────────────┐
│  Local Translation       │               │   │ Firebase   │ │  MongoDB   │ │   Redis     │
│  E2EE / Web Crypto        │               │   │ Auth       │ │  Atlas     │ │ (presence,  │
└────────────────────────┘               │   └───────────┘ │(users,conns│ │ rate limits)│
                                           │                 │ msg/photo  │ └────────────┘
                                           │                 │ metadata)  │
                                           │                 └─────┬──────┘
                                           │                       ▼
                                           │                ┌──────────────┐
                                           └───────────────►│ Cloudflare R2 │
                                                             │ (encrypted    │
                                                             │  photo blobs) │
                                                             └──────────────┘
```

The backend is deliberately narrow in scope: **verifying identity, user discovery, connection state, encrypted relay, and delivery state** — nothing more. It never needs plaintext messages, plaintext photos, or private keys.

📄 Full data model, encryption design, and the E2EE-vs-cloud-translation privacy tradeoff → [`architecture.md`](./architecture.md)

<br/>

## 🔐 Security & Privacy

Security is designed in from the start, not bolted on.

- 🔑 **No custom cryptography** — established, well-maintained libraries/protocols only
- 🌐 **Local-first translation** — preserves genuine end-to-end encryption; server-side plaintext translation would break the E2EE guarantee
- 🚦 **Tiered rate limiting** — auth / public / authenticated tiers, per-IP + per-account limits, exponential backoff, all thresholds configurable
- ✅ **Strict input validation** — reject non-conforming data rather than sanitize-and-continue
- 🙈 **No hardcoded secrets** — environment variables only, verified not to leak into the frontend bundle or git history
- 📦 **Routine dependency audits** — across frontend and backend, with tracked remediation
- 🧯 **Generic user-facing errors** — no stack traces, file paths, or raw database errors ever reach the client
- 🖼️ **Validated, isolated file uploads** — real content/type checks, size limits, private object storage, no execution vector

> PlexoChat does **not** claim to be "100% secure," "unbreakable," or "impossible to hack." Full control specification in [`security.md`](./security.md); cryptographic design and threat-model caveats in [`architecture.md`](./architecture.md).

<br/>

## 📚 Project Documentation

| Document | Description |
|:---|:---|
| 📋 [`prd.md`](./prd.md) | Product requirements — scope, features, success criteria |
| 🎨 [`design.md`](./design.md) | UX/UI design — layouts, translation interaction, accessibility |
| 🏗️ [`architecture.md`](./architecture.md) | Technical architecture, data model, E2EE design |
| 🗺️ [`phases.md`](./phases.md) | MVP development roadmap, phase by phase |
| 🔐 [`security.md`](./security.md) | Full security control specification |
| 🧠 [`memory.md`](./memory.md) | Durable decisions log and glossary |
| ⚖️ [`LICENSE.md`](./LICENSE.md) | Software license terms |
| ™️ [`TRADEMARK.md`](./TRADEMARK.md) | Trademark and brand usage policy |

<br/>

## 🚀 Getting Started

> ⚠️ PlexoChat is currently in active MVP development — see [`phases.md`](./phases.md). Setup below assumes the locked stack above and will evolve as implementation progresses.

<details>
<summary><strong>Prerequisites</strong></summary>
<br/>

- Node.js (LTS) and npm/pnpm/yarn
- Python 3.11+
- A Firebase project (Authentication enabled)
- A MongoDB Atlas cluster
- Redis
- A Cloudflare R2 bucket + API token

</details>

**1. Clone the repository**

```bash
git clone https://github.com/[your-org]/plexochat.git
cd plexochat
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

All secrets are supplied via environment variables — never hardcoded. This includes: the Firebase Admin SDK service account key (backend only — distinct from the public Firebase client config used by the frontend), the MongoDB Atlas connection string, the Redis connection string, Cloudflare R2 access key/secret, and rate-limit thresholds.

📄 See `.env.example` in each directory for required keys, and [`security.md`](./security.md) §3 for the full secrets-handling checklist.

<br/>

## 🗺️ Roadmap

<div align="center">

`1` UI Prototype → `2` Accounts & Connections → `3` Real-Time Messaging → `4` Translation → `5` End-to-End Encryption → `6` Encrypted Photos → `7` Security Testing → `8` UX Polish

</div>

Full detail, exit criteria, and per-phase security work → [`phases.md`](./phases.md)

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

For licensing, trademark, security disclosures, or general inquiries: **[arupworks.at@gmail.com]**

---

<div align="center">

<sub>© 2026 Arup Das. All rights reserved. PlexoChat is proprietary software.</sub>

**PlexoChat™** — *Speak naturally. Connect globally. Understand each other.*

</div>
