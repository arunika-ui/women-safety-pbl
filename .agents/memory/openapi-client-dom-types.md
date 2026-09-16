---
name: OpenAPI client DOM types
description: TypeScript compiler detail for generated fetch clients in this workspace.
---

When generated API clients use `Headers.entries()`, the consuming composite package must include both `dom` and `dom.iterable` in its TypeScript `lib` list.

**Why:** The generated client can be correct while the workspace typecheck fails if iterable DOM declarations are omitted.

**How to apply:** Keep `dom.iterable` enabled in the shared generated-client package whenever codegen emits header iteration.