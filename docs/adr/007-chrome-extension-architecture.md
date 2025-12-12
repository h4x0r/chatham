# ADR-007: Chrome Extension Architecture

## Status

Accepted

## Context

The public `chatham` repository needs a local-only Chrome extension that:
1. Demonstrates the MIT-licensed packages in action
2. Provides production-ready local kanban functionality
3. Prepares architecture for future cloud sync in chatham-pro
4. Follows modern React and testing best practices

Key constraints:
- Must work entirely offline (local-only)
- Must encrypt all data client-side
- Must be extensible for cloud features without major refactoring
- Target users: Security teams tracking vulnerabilities and risk registers

## Decision

We will build a Chrome extension using:

### Architecture: Clean Architecture (Hybrid with Chrome-specific)

**Layers:**
- **Domain:** Pure business logic (Automerge operations)
- **Infrastructure:** External integrations (crypto, storage, sync hooks)
- **UI:** React components (sidepanel + fullpage)

**Rationale:**
- Domain layer is testable without mocks (pure functions)
- Infrastructure isolates external dependencies
- Easy to swap local-only → cloud sync (just change infrastructure)

### State Management: TanStack Query + Zustand

**TanStack Query for data:**
- Industry standard for async state (2024-2025)
- Perfect for future sync (caching, optimistic updates, refetching)
- Better than Context for data fetching

**Zustand for UI state:**
- Lightweight, modern
- Simple API (easier than Redux)
- Good DevTools support

**Alternatives considered:**
- Redux Toolkit: Too much boilerplate for extension
- Context only: No built-in async handling
- Jotai: More React-ish but Zustand is more popular

### UI Pattern: Sidepanel + Fullpage Combo

**Both views:**
- Sidepanel for quick access (compact, always available)
- Fullpage for deep work (full kanban experience)

**Rationale:**
- Security teams need both quick updates and deep analysis
- Sidepanel: Add quick note about vulnerability
- Fullpage: Detailed risk register management

**Alternative considered:**
- Popup only: Too limited for kanban
- Fullpage only: Loses quick-access benefit

### Routing: Wouter

**Over React Router:**
- 40x smaller bundle (1.6KB vs 45KB)
- Same familiar API patterns
- Perfect for extensions (lightweight)

### Drag-and-Drop: dnd-kit

**Over react-beautiful-dnd:**
- Actively maintained (rbd is archived)
- Built for modern React
- Better accessibility (WCAG compliant)
- Required for security/compliance teams

### Data Model: Automerge CRDT (from @chatham/automerge)

**Use existing package:**
- Already built and tested
- Designed for sync (smooth cloud transition)
- Time-travel/undo for free
- No migration needed when cloud comes

**Alternative considered:**
- Plain objects: Would need rebuild as Automerge later

### File Attachments: IndexedDB Blobs

**Over FileSystem API:**
- No permission prompts (better UX)
- 10GB browser quota (sufficient)
- Clean cloud migration (IndexedDB → R2)
- Simpler to implement

### Recovery Phrase: Evaluation Mode (24h OR 10 cards)

**Security + friction balance:**
- Low friction: "Skip for now" option for evaluation
- Prevents data loss: Forces phrase after 24h OR 10 cards
- Security teams understand: They're professionals, can evaluate safely

**Alternative considered:**
- Force phrase immediately: Too much friction for evaluation
- No limits: Risk of accidental data loss

## Consequences

### Positive

**Clean architecture:**
- Domain layer is pure (100% testable without mocks)
- Infrastructure swappable (local → cloud)
- UI layer thin (just presentation)

**Modern stack:**
- TanStack Query: Industry standard for async state
- dnd-kit: Maintained, accessible
- Wouter: Small bundle, fast

**Smooth cloud transition:**
- Sync hooks already defined (no-op for local)
- Automerge from day 1 (no data migration)
- Infrastructure swap only (UI unchanged)

**TDD-friendly:**
- Pure domain functions (fast unit tests)
- Component tests with RTL
- Integration tests with mocked Chrome APIs

### Negative

**Complexity:**
- More layers than simple extension
- Clean architecture overkill for some?
- Justified by: Need production-ready + future sync

**Bundle size:**
- React + TanStack Query + Zustand + dnd-kit + shadcn
- ~500KB total (acceptable for extension)
- Trade-off: Modern DX vs size

**Testing overhead:**
- Must mock Chrome APIs for tests
- E2E requires actual extension loading
- Worth it: Confident in quality

## Implementation

### Directory Structure

```
apps/extension/
  src/
    domain/              # Pure business logic
    infrastructure/      # External integrations
    ui/
      sidepanel/
      fullpage/
      shared/
    background/
  tests/
    unit/
    component/
    integration/
    e2e/
```

### Tech Stack

- React 18 + TypeScript
- Vite + @crxjs/vite-plugin
- TanStack Query + Zustand
- Wouter + dnd-kit
- shadcn/ui + Tailwind
- Vitest + Playwright

### TDD Workflow

1. Write failing test (unit/component/integration)
2. Watch it fail (verify RED)
3. Write minimal code to pass
4. Watch it pass (verify GREEN)
5. Refactor (stay green)
6. Repeat

## References

- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://github.com/pmndrs/zustand)
- [dnd-kit](https://dndkit.com/)
- [Wouter](https://github.com/molefrog/wouter)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
