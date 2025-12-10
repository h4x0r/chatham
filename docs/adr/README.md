# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for ZKKB.

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](001-e2ee-recovery-phrase.md) | E2EE with BIP39 Recovery Phrase | Accepted | 2024-12-10 |
| [ADR-002](002-semaphore-zk-proofs.md) | Semaphore ZK Proofs for Anonymous Access | Accepted | 2024-12-10 |
| [ADR-003](003-automerge-crdt.md) | Automerge CRDT for Real-time Sync | Accepted | 2024-12-10 |
| [ADR-004](004-cloudflare-infrastructure.md) | Cloudflare Workers Infrastructure | Accepted | 2024-12-10 |
| [ADR-005](005-dual-licensing.md) | Dual Licensing for Freemium Model | Accepted | 2024-12-10 |

## Template

New ADRs should follow this structure:

```markdown
# ADR-XXX: Title

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?
```
