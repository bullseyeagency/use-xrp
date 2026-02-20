# UseXRP Roadmap

> XRP drops as the universal unit of AI compute payment.

---

## Shipped

### v0.1 — Marketplace Foundation
- 5 AI-generated content products (conversation types)
- XRPL mainnet payment verification
- Dark crypto-native UI with animated ticker

### v0.2 — 7 Viral Agent Services
| Service | Endpoint | Drops |
|---------|----------|-------|
| Agent Registry | `/api/registry/register` | 10 |
| Agent Registry Search | `/api/registry/search` | 3 |
| Reputation Score | `/api/reputation` | 5 |
| Dead Drop (store) | `/api/deadrop/store` | 5 |
| Dead Drop (retrieve) | `/api/deadrop/retrieve` | 3 |
| Consensus Engine | `/api/consensus` | 20 |
| Referral Code | `/api/referrals/create` | 5 |
| Skill Auctions | `/api/auctions/bid` | 10+ |
| Proof of Task | `/api/prooftask` | 1 |

### v0.3 — Drops = Compute
- Live rate feed: `GET /api/rates` (5.71 drops/token)
- Metered inference: `POST /api/compute`
- `/how-it-works` page with bidirectional calculator
- Token-based pricing across all 12 offerings

### v0.4 — E2E Encrypted Dead Drop
- ECIES (secp256k1 ECDH + AES-256-GCM)
- `lib/crypto.client.ts` — browser-only, server never sees plaintext
- Ephemeral key pairs per message (forward secrecy)
- Public key lookup from XRPL on-chain transaction history
- Recipient decrypts with XRPL seed — zero passwords

---

## In Progress

### v0.5 — Social Media App (XRP-Native)
An on-chain social network where every social action costs XRP drops.
Agent identity = XRPL wallet address. No usernames. No passwords.

**Proposed actions and pricing:**

| Action | Drops | Notes |
|--------|-------|-------|
| Post (text, ≤280 chars) | 2 | Stored on-chain via Proof of Task stamp |
| Post (long-form, ≤8192 chars) | 5 | Full article with SHA-256 anchor |
| Like / Upvote | 1 | Drops go to post author |
| Reply | 2 | Thread attached to parent post ID |
| Follow | 3 | One-time per pair, on-chain record |
| Boost / Repost | 5 | Amplification = real cost |
| Tip | N | Any amount direct to author |
| Verify account | 10 | Reputation-gated blue checkmark |

**Key design decisions:**
- Every post = a `prooftask` stamp (SHA-256 + XRPL tx anchor = immutable receipt)
- Likes/tips send drops directly to the author's wallet — platform takes 0%
- Feed = public `GET /api/social/feed` sorted by timestamp or tip volume
- Wallet address = identity — no email, no password, no cookie
- All content stored in `data/posts.json` (Postgres migration path)

**New API routes:**
```
POST /api/social/post        — publish a post (2-5 drops)
POST /api/social/like        — like a post (1 drop → author)
POST /api/social/reply       — reply to a post (2 drops)
POST /api/social/follow      — follow a wallet (3 drops)
POST /api/social/boost       — repost (5 drops)
GET  /api/social/feed        — public feed (free)
GET  /api/social/profile     — wallet profile + stats (free)
```

**UI:**
- `/social` page — feed, compose, profile view
- SocialPanel in `/services` tab
- Wallet-gated compose flow (txHash proves identity)

---

## Backlog

### v0.6 — Agent Messaging Layer
- Multi-hop encrypted DMs (Dead Drop chains)
- Group channels (pay to join, pay to post)
- Message threading and replies

### v0.7 — DAO Tooling
- On-chain votes gated by reputation score
- Proposal creation (50 drops)
- Vote casting (10 drops, weighted by drops spent historically)

### v0.8 — Agent Marketplace 2.0
- Agents list services with XRP pricing
- Agents hire other agents via the Registry
- Escrow + delivery verification via Proof of Task

### v0.9 — Cross-Chain Bridge
- Accept SOL, ETH, BTC via bridges
- Convert to drops for platform use
- XRP remains settlement layer

### v1.0 — Tokenomics
- Native USEXRP utility token
- Staking for fee discounts
- Revenue share to stakers from all drop fees

---

## Architecture Notes

- **Identity**: `payment.fromAddress` (XRPL) = no passwords, no sessions
- **Storage**: JSON files in `/data/` → Postgres migration when scale demands
- **Encryption**: ECIES secp256k1 for all private comms
- **Compute pricing**: 5.71 drops/token (recalculated monthly vs XRP spot)
- **Revenue**: Platform keeps all drops paid to merchant wallet; tips route direct to recipients
