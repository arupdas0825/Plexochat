<img width="125" height="125" alt="1000220658" src="https://github.com/user-attachments/assets/1accdeb3-a42b-4fb6-ac9e-aba509a90044" />

# PlexoChat

**A privacy-focused, multilingual messenger that lets people chat naturally in their own language — while automatically translating every conversation into each other's preferred language.**

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](./LICENSE.md)
[![Status](https://img.shields.io/badge/status-MVP%20in%20development-yellow.svg)](./phases.md)
[![Encryption](https://img.shields.io/badge/encryption-E2EE-blue.svg)](./architecture.md)
[![Made with FastAPI](https://img.shields.io/badge/backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Made with Next.js](https://img.shields.io/badge/frontend-Next.js-000000.svg)](https://nextjs.org/)

---

## Table of Contents

- [What is PlexoChat?](#what-is-plexochat)
- [The Problem](#the-problem)
- [Core Features](#core-features)
- [Not in the MVP](#not-in-the-mvp)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Security & Privacy](#security--privacy)
- [Project Documentation](#project-documentation)
- [Getting Started](#getting-started)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Trademark](#trademark)
- [Contact](#contact)

---

## What is PlexoChat?

> **People should be able to speak naturally without worrying about language barriers.**

PlexoChat is a private, 1-to-1, end-to-end encrypted messenger. Users write however comes naturally to them — mixed languages, romanized script, slang, emojis — and PlexoChat automatically translates every message into the recipient's preferred language, in the background, without breaking conversational flow.

It is intentionally **not** a general-purpose social network. It is a focused messaging product, with real-time translation and end-to-end encryption as first-class citizens rather than bolted-on features.

## The Problem

Two people who want to talk often don't share a language. The usual workarounds — finding a common language or copy-pasting into a separate translator — interrupt natural conversation. PlexoChat removes that friction: type naturally, and the platform handles translation automatically, in both directions, for both participants.

## Core Features

- 💬 **1-to-1 real-time text messaging** over WebSocket (WSS)
- 🌍 **Automatic multilingual translation**, targeted at the *receiver's* preferred language
- 🔁 **Original-message reveal** — double-click/double-tap to see the source text, with an accessible "View original" alternative; the original is never overwritten
- 🔒 **End-to-end encryption** for both text and photos
- 🖼️ **Encrypted photo sharing** — the server only ever handles ciphertext
- 🤝 **Private, consent-based connections** — messaging requires an explicit request and acceptance, preventing spam and unsolicited contact
- 📱 **Responsive design** across desktop and mobile web
- 🧠 **Natural multilingual input support** — mixed languages, romanized script (e.g., Banglish), slang, and emojis, with no manual "select a language" step
- 🎓 **Language learning as a side effect** — repeated exposure to real conversations in another language (not the primary pitch, and not a built MVP feature)

## Not in the MVP

To stay focused, the following are explicitly out of scope for the initial release:

Voice calls · Video calls · Group chats · Channels · Stories/status · Public feed · Payments · Stickers as a core feature · General file sharing · Public social features · Language-partner discovery · In-app "Learn" mode · PWA packaging · Multi-device sessions

See [`prd.md`](./prd.md) for the full rationale and the post-MVP roadmap.

## How It Works

```
Sender types naturally (any language/script mix)
        ↓
Local language detection + translation (on-device)
        ↓
Local encryption (E2EE)
        ↓
Ciphertext relayed over WSS via the server
        ↓
Receiver decrypts locally
        ↓
Translated message displayed to BOTH sender and receiver
        ↓
Original always recoverable via double-click/tap or "View original"
```

The server never needs plaintext messages, plaintext photos, or private encryption keys — it operates as a coordination and encrypted-relay service only.

## Tech Stack

**Final, locked stack:**

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript |
| Backend | FastAPI + Python |
| Authentication | Firebase Authentication |
| Database | MongoDB Atlas |
| Real-time / Presence | WebSocket + Redis |
| Photo Storage | Cloudflare R2 |
| End-to-End Encryption | Browser-side Web Crypto + an established cryptographic protocol/library |

Full rationale in [`architecture.md`](./architecture.md).

## Architecture Overview

```
┌──────────────────────┐          ┌──────────────────────┐
│     User A Browser   │   WSS    │    FastAPI Backend   │
│  Local Translation    │◄────────►│  Auth · Discovery     │
│  E2EE / Web Crypto    │          │  Connection State      │
└──────────────────────┘          │  Encrypted Relay Only  │
                                    │  Delivery State         │
┌──────────────────────┐          └──────────┬────────────┘
│     User B Browser   │   WSS               │
│  Local Translation    │◄────────────────────┘
│  E2EE / Web Crypto    │
└──────────────────────┘
```

The backend is deliberately narrow in scope: authentication, user discovery, connection state, encrypted relay, and delivery state — nothing more. See [`architecture.md`](./architecture.md) for the full data model, encryption design, and the E2EE-vs-cloud-translation privacy tradeoff.

## Security & Privacy

Security is designed in from the start, not bolted on. Highlights:

- **No custom cryptography** — established, well-maintained libraries/protocols only.
- **Local-first translation** to preserve genuine end-to-end encryption (server-side plaintext translation would break the E2EE guarantee).
- **Tiered rate limiting** (auth / public / authenticated) with per-IP and per-account limits and exponential backoff — all thresholds configurable, never hardcoded.
- **Strict input validation** on every input — reject non-conforming data rather than sanitize-and-continue.
- **No hardcoded secrets** — environment variables only, verified not to leak into the frontend bundle or into git history.
- **Routine dependency audits** across frontend and backend, with tracked remediation.
- **Generic user-facing errors** — no stack traces, file paths, or raw database errors ever reach the client; full detail is logged server-side only.
- **Validated, isolated file uploads** — real content/type checks (not just extensions), size limits, storage outside the web root, no execution vector.

PlexoChat does not claim to be "100% secure," "unbreakable," or "impossible to hack." See [`security.md`](./security.md) for the full control specification and [`architecture.md`](./architecture.md) for the cryptographic design and threat-model caveats (including the web-app trust model caveat around server-delivered JavaScript).

## Project Documentation

| Document | Description |
|---|---|
| [`prd.md`](./prd.md) | Product requirements — scope, features, success criteria |
| [`design.md`](./design.md) | UX/UI design — layouts, translation interaction, accessibility |
| [`architecture.md`](./architecture.md) | Technical architecture, data model, E2EE design |
| [`phases.md`](./phases.md) | MVP development roadmap, phase by phase |
| [`security.md`](./security.md) | Full security control specification |
| [`memory.md`](./memory.md) | Durable decisions log and glossary |
| [`LICENSE.md`](./LICENSE.md) | Software license terms |
| [`TRADEMARK.md`](./TRADEMARK.md) | Trademark and brand usage policy |

## Getting Started

> ⚠️ PlexoChat is currently in active MVP development (see [`phases.md`](./phases.md)). Setup instructions below assume the standard stack described above and will be updated as implementation progresses.

### Prerequisites

- Node.js (LTS) and npm/pnpm/yarn
- Python 3.11+
- A Firebase project (Authentication enabled)
- A MongoDB Atlas cluster
- Redis
- A Cloudflare R2 bucket + API token

### Clone the repository

```bash
git clone https://github.com/[your-org]/plexochat.git
cd plexochat
```

### Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your own values — never commit real secrets
uvicorn app.main:app --reload
```

### Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in your own values
npm run dev
```

### Environment variables

All secrets are supplied via environment variables — never hardcoded. This includes: the Firebase Admin SDK service account key (backend only — distinct from the public Firebase client config used by the frontend), the MongoDB Atlas connection string, the Redis connection string, Cloudflare R2 access key/secret, and rate-limit thresholds. See `.env.example` in each directory for the required keys, and `security.md` §3 for the full secrets-handling checklist.

## Roadmap

PlexoChat is built in eight sequenced phases: UI Prototype → Accounts & Connections → Real-Time Messaging → Translation → End-to-End Encryption → Encrypted Photos → Security Testing → UX Polish. Full detail, exit criteria, and per-phase security work are documented in [`phases.md`](./phases.md).

## Contributing

Contributions are welcome under the terms of [`LICENSE.md`](./LICENSE.md). By submitting a pull request, you agree that your contribution is licensed under the same terms. Please read `LICENSE.md` and `TRADEMARK.md` before contributing, especially regarding use of the PlexoChat name and branding.

## License

PlexoChat is released under a **custom proprietary license** — see [`LICENSE.md`](./LICENSE.md) for full terms. In short: the source is available for personal evaluation and approved contributions, but commercial use, redistribution, and rebranding require written permission from the license holder.

*(If you'd prefer an open-source license instead — e.g., MIT, Apache-2.0, or AGPL-3.0 — this can be swapped out; just say the word and it'll be regenerated.)*

## Trademark

"PlexoChat"™ and the PlexoChat logo are trademarks of [Your Name / Company Name]. The software license above does not grant rights to use the PlexoChat name or brand. See [`TRADEMARK.md`](./TRADEMARK.md) for what's permitted and what requires written permission.

## Contact

For licensing, trademark, security disclosures, or general inquiries: **[your-email@example.com]**

---

<p align="center"><sub>PlexoChat™ — Speak naturally. Connect globally. Understand each other.</sub></p>
