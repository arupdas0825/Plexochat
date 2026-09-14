# PlexoChat — End-to-End Encryption (E2EE) Security Model

This document specifies the cryptographic architecture, trust boundaries, guarantees, and operational procedures for End-to-End Encryption in PlexoChat.

---

## 1. Cryptographic Protocol & Primitives

PlexoChat utilizes the audited, open-source **Olm** implementation of the Double Ratchet Protocol (developed and maintained by the Matrix.org Foundation, package: `@matrix-org/olm`, WASM runtime).

### 1.1 Primitives
- **Identity & Key Agreement**: Curve25519 for Elliptic Curve Diffie-Hellman (ECDH) key exchange.
- **Digital Signatures**: Ed25519 for device identity authentication and key bundle signing.
- **Message Authenticated Encryption**: AES-256-CBC with HMAC-SHA-256 for envelope payload protection.
- **Ratchet Mechanism**: Symmetric-key ratchet combined with a Diffie-Hellman ratchet, advancing per sent and received message.

---

## 2. Key Lifecycle & Storage

### 2.1 Client-Side Device Keys
1. **Account Creation**: Upon first user login or chat initialization, the client generates an Olm `Account` containing:
   - Long-term Ed25519 identity key.
   - Long-term Curve25519 identity key.
   - A batch of 50 Curve25519 One-Time Prekeys (OTKs).
2. **Private Key Storage**: Private keys NEVER leave the user's browser device. They are pickled with a per-device key and persisted exclusively in the browser's **IndexedDB** (`chat-storage.ts`).
3. **Public Key Publication**: Public keys (Curve25519 identity key, Ed25519 identity key, and public OTKs) are uploaded to the backend via `POST /api/v1/devices/keys`.

### 2.2 Session Negotiation (Store-and-Forward)
1. **Peer Key Discovery**: Before sending a message to an accepted connection, User A requests User B's public bundle via `GET /api/v1/devices/keys/{user_b_id}`.
2. **OTK Consumption**: The backend atomically claims and removes an unused OTK from User B's bundle to prevent reuse.
3. **Outbound Session**: User A creates an outbound Olm session using User B's Curve25519 identity key and the claimed OTK.
4. **PreKey Frame**: The first message envelope is sent with `message_type: 0` (PreKey message). Upon receipt, User B initiates an inbound session and discards the corresponding private OTK. Subsequent messages transition to `message_type: 1` (ratcheted messages).

---

## 3. Threat Model & Data Visibility

### 3.1 What the PlexoChat Server CAN See (Routing Metadata)
- `from_user_id`: The sender's user ID.
- `to_user_id`: The recipient's user ID.
- `client_message_id`: Client-generated message tracking UUID.
- `message_type`: Protocol frame type (`0` for PreKey session handshake, `1` for ratcheted message).
- `created_at` / `timestamp`: Network routing timestamp.
- **Ciphertext Size**: The length/byte count of the base64-encoded encrypted envelope.

### 3.2 What the PlexoChat Server CANNOT See
- **Message Content**: Neither original user input nor translated text is ever sent in plaintext.
- **Private Keys**: Ephemeral and identity private keys remain exclusively in client IndexedDB.
- **Decryption Session State**: Ratchet counters, chain keys, and message keys exist solely in memory and local encrypted storage on client devices.

---

## 4. Translation & Privacy (Option B)

1. **Client-Side Processing**: Translation executes directly in the user's browser **before** Olm encryption takes place.
2. **Bundle Encryption**: The translated text, original input, detected source language, and target language code are serialized into a single JSON payload:
   ```json
   {
     "original_text": "...",
     "translated_text": "...",
     "source_lang": "...",
     "target_lang": "...",
     "client_message_id": "...",
     "timestamp": "..."
   }
   ```
3. **Olm Envelope**: The entire JSON payload is encrypted as a single opaque ciphertext string by Olm before any network transmission occurs.
4. **Third-Party Disclosures**: While PlexoChat servers never see message content, external client-side translation queries (e.g., Google Translate API endpoint) process text solely during the translation lookup. This disclosure is explicitly surfaced in User Settings (`settings-page-view.tsx`).

---

## 5. Offline Queue & Store-and-Forward Lifecycle

1. **Undelivered Messages**: If the recipient is offline, the server holds the frame in MongoDB `pending_messages`.
2. **Ciphertext Only**: The backend models enforce that `pending_messages` stores only `ciphertext` and routing metadata. No plaintext field exists in `pending_messages`.
3. **48-Hour TTL**: MongoDB TTL indexes automatically expire and delete any undelivered messages after 48 hours.
4. **Flush and Delete**: When the recipient reconnects, pending messages are transmitted over WebSocket and immediately deleted from the database.

---

## 6. Web Application Trust Model & Caveats

- **Web Delivery**: Because PlexoChat is delivered as a client-side web application over HTTPS, the security of the client crypto implementation relies on the integrity of the web host (Vercel/TLS) and modern browser sandboxing.
- **No Absolute Guarantees**: In accordance with project policy, PlexoChat does not claim "100% unbreakable" security. The implementation provides strong end-to-end cryptographic confidentiality against network eavesdroppers and server compromises, subject to standard web platform threat models.

---

## 7. Deferred & Out-of-Scope Capabilities

The current version deliberately defers:
- **Multi-device synchronization**: Sessions are 1-to-1 between specific browser instances.
- **Automated background OTK replenishment**: Users replenish keys upon device registration.
- **Social recovery / backup**: Loss of local IndexedDB data resets the cryptographic session.
