---
name: Safety integration boundaries
description: Product safety rule for emergency, location, messaging, and provider integrations.
---

Haven must make any unavailable safety-critical integration explicit in the interface. It must not imply that it can dispatch emergency services, send SMS, verify a provider, or track in the background until that capability is actually configured and permitted.

**Why:** Users may rely on this product during a stressful or dangerous situation; overstating capabilities can create direct harm.

**How to apply:** Keep provider-dependent actions behind honest unavailable states, and describe browser permission and current session limits whenever location is involved.