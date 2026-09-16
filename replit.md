# Haven

Haven is a discreet safety and wellbeing companion for private check-ins, journaling, trusted contacts, journeys, and emotional support.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/haven/src/App.tsx` — responsive app shell, routes, feature UI, and client-side interaction states
- `artifacts/haven/src/index.css` — Haven visual tokens and global theme
- `artifacts/api-server/src/routes/haven.ts` — typed Haven API surface and safe demo service layer
- `lib/api-spec/openapi.yaml` — source of truth for generated API hooks and Zod contracts
- `artifacts/haven/public/manifest.webmanifest` and `sw.js` — installable PWA shell

## Architecture decisions

- Safety-critical capabilities are explicit: the current build does not claim automatic SMS, background tracking, emergency dispatch, or verified provider data.
- The first build uses a small in-memory demo service behind typed endpoints so the UI is functional while authentication, durable private storage, and provider integrations are configured.
- Browser geolocation is opt-in and scoped to the emergency screen; continuous sharing reports unavailable until a permitted provider is connected.
- The frontend is mobile-first and uses a deep botanical teal, oat, saffron, and clay palette to stay calm without becoming colorless.

## Product

Haven includes a calm dashboard, mood check-ins, Trusted Circle contact management, Journey Mode, location-permission messaging, a press-and-hold-inspired emergency screen, private journal CRUD, Haven Companion safety escalation copy, support resources with demo markers, timed check-ins, privacy mode, onboarding screens, and a PWA install shell.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- If the API contract changes, run `pnpm --filter @workspace/api-spec run codegen` before checking artifacts.
- Use the exact managed workflows for previewing the API and Haven web app; the app expects workflow-provided `PORT` and `BASE_PATH`.
- Replace the demo service with authenticated durable storage before treating Haven as production-ready for sensitive user data.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
