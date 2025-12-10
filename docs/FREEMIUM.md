# ZKKB Freemium Model

## Overview

ZKKB uses a freemium model where core functionality is free and open source, while collaboration and cloud features require a paid subscription.

## Feature Matrix

```mermaid
quadrantChart
    title Feature Value vs Infrastructure Cost
    x-axis Low Cost --> High Cost
    y-axis Low Value --> High Value
    quadrant-1 Premium Features
    quadrant-2 Core Differentiators
    quadrant-3 Basic Features
    quadrant-4 Cost Centers

    Local Boards: [0.1, 0.6]
    E2EE Encryption: [0.1, 0.9]
    Recovery Phrase: [0.1, 0.7]
    Cloud Sync: [0.7, 0.85]
    Real-time Collab: [0.9, 0.95]
    Board Sharing: [0.6, 0.8]
    Attachments: [0.8, 0.5]
    Priority Support: [0.5, 0.4]
```

## Free Tier

**Target Users**: Individuals, students, solo developers

**Features**:
- Unlimited local boards stored in browser IndexedDB
- Full E2EE encryption (AES-256-GCM)
- 24-word BIP39 recovery phrase
- Single-user experience
- Export boards as encrypted JSON backup
- No account required for local-only use

**Infrastructure Cost**: $0 (no server resources used)

**Why Free**:
- Zero marginal cost per user
- Builds trust in encryption claims (auditable)
- Grows user base for conversion

## Pro Tier

**Target Users**: Teams, small businesses, power users

**Price Point**: $8/user/month or $80/user/year

**Features** (in addition to Free):
- Real-time sync across devices
- Board sharing with ZK-verified members
- Collaborative editing with Automerge CRDT
- Cloud backup (encrypted R2 storage)
- Attachment storage (up to 10GB per board)
- Priority email support
- 99.9% uptime SLA

**Infrastructure Cost**: ~$5-15/month base + usage

**Why Paid**:
- Requires Cloudflare Durable Objects ($5/mo minimum)
- R2 storage costs scale with usage
- Support overhead
- Ongoing maintenance

## Enterprise Tier

**Target Users**: Large organizations, compliance-focused teams

**Price Point**: Custom pricing (contact sales)

**Features** (in addition to Pro):
- Self-hosted option
- SSO/SAML integration
- Audit logging
- Dedicated support
- Custom retention policies
- Volume discounts

## Conversion Strategy

```mermaid
journey
    title User Journey to Conversion
    section Discovery
      Find ZKKB: 5: User
      Install Extension: 4: User
      Create Local Board: 5: User
    section Activation
      Use Daily for 1 Week: 4: User
      Hit Device Limit: 2: User
      Want to Share Board: 3: User
    section Conversion
      See Pro Prompt: 3: User
      Start Trial: 4: User
      Experience Sync: 5: User
      Convert to Paid: 5: User
```

### Trigger Points

1. **Multi-device**: User tries to access from second device
2. **Collaboration**: User clicks "Share Board" button
3. **Storage**: Local storage exceeds 50MB
4. **Backup**: User wants cloud backup assurance

### Friction Reduction

- 14-day free trial of Pro features
- No credit card for trial
- Seamless upgrade (boards auto-sync)
- Downgrade keeps local access

## Revenue Projections

| Scenario | Users | Conversion | MRR |
|----------|-------|------------|-----|
| Conservative | 1,000 | 2% | $160 |
| Moderate | 10,000 | 3% | $2,400 |
| Optimistic | 50,000 | 5% | $20,000 |

## Implementation Notes

### Feature Gating

```typescript
// src/lib/features.ts
export const FEATURES = {
  FREE: {
    localBoards: true,
    encryption: true,
    recoveryPhrase: true,
    maxLocalStorage: 50 * 1024 * 1024, // 50MB
  },
  PRO: {
    cloudSync: true,
    collaboration: true,
    attachments: true,
    maxAttachmentStorage: 10 * 1024 * 1024 * 1024, // 10GB
  },
}

export function requiresPro(feature: string): boolean {
  return feature in FEATURES.PRO
}
```

### Upgrade Prompts

Non-intrusive prompts shown when:
- User attempts Pro feature
- After 7 days of active Free usage
- When storage approaches limit

Never:
- Block core functionality
- Nag repeatedly
- Dark patterns
