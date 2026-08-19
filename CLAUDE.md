# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Orcha Portal — a visual workflow automation platform (React Router v7 SSR app) that connects services and orchestrates event-driven flows via a node-based canvas (`@xyflow/react`).

## Commands

Package manager is **bun**.

```bash
bun install              # install deps
bun run dev               # dev server (custom Express + Vite middleware), http://localhost:3000
bun run build              # production build (node ./build.mjs)
bun run start               # run production build (cross-env NODE_ENV=production node ./server.mjs)
bun run typecheck            # react-router typegen && tsc (no emit)
bun run lint                  # eslint over {app,lib}/**/*.{ts,tsx}
bun run lint:fix
bun run format                # prettier --write, excludes **/locales/**
bun run format:check
bun run check                  # format && lint && typecheck — run this before considering work done
```

There is no test suite/framework configured in this repo (no jest/vitest/playwright and no `test` script) — don't invent one or assume test commands exist.

`lefthook` runs `eslint --fix` and `prettier --write` on staged `*.{js,jsx,ts,tsx,json}` files as a pre-commit hook (auto-adds fixes).

Required env vars (see `.env.example`): `AUTH0_CLIENT_ID`, `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_ORGANIZATION_ID`, `NODE_ENV`, `SESSION_SECRET`, `HOST_URL`, `API_URL`, `IDENTIES_API_URL`.

## Architecture

### Server & routing
- Custom Express server (`server.mjs`) wraps React Router's request handler, with `helmet` (CSP with a per-request nonce in `res.locals.cspNonce`), `compression`, `morgan`, and `express-rate-limit`. In dev it mounts Vite in middleware mode for HMR; `build.mjs` handles the production build.
- Routes are declared centrally in `app/routes.ts` (React Router v7 config API — `route`/`layout`/`index`), not file-system routing. When adding a route, register it there.
- `app/layouts/private.layout.tsx` wraps every authenticated route group (`workflows`, `sources`, `events`) with the app chrome (`tessera-ui`'s `Layout.Main`/`Layout.Header`, sidebar nav, theme switch). The two routes outside this layout — `/` (`routes/index.tsx`) and `/logout` — are the public routes.
- Route `loader`s read server-only env vars (`process.env.API_URL`, `process.env.NODE_ENV`, etc.) and hand them to the client component via `useLoaderData`; components then pass them into the `resources/hooks` query hooks. This repeats per-route rather than being centralized — follow the existing pattern in a sibling route file rather than introducing a new mechanism.

### Auth
- Authentication is Auth0 via `tessera-ui`'s `AuthProvider` (wraps `@auth0/auth0-react`'s `Auth0Provider`, resolves the access token, and feeds it into `tessera-ui`'s Identies API connection), mounted once in `app/root.tsx`. `requireAuth={false}` + `onUnauthenticated` (redirects to `/`) is used because the app has a public landing/login route — it is **not** a fully-gated app.
- `useApp()` from `tessera-ui` (not a local context) exposes `{ user, token, isLoadingIdenties, applications, isLoadingApps, error, updateUser }` to any component inside the tree. `isLoadingIdenties` is the loading flag (not `isLoading`).
- `routes/index.tsx` and `routes/logout.tsx` use `useAuth0` from `@auth0/auth0-react` directly (they sit outside `AuthProvider`'s convenience wrapper needs — e.g. `index.tsx` needs Auth0's `error` field, which `tessera-ui`'s `useAuth()` doesn't expose).
- `vite.config.ts` sets `resolve.dedupe: ['react', 'react-dom', '@auth0/auth0-react']` — required because `tessera-ui` bundles its own copy of `@auth0/auth0-react`; without deduping, a second module instance creates a second `Auth0Provider` context and breaks `useAuth0()` calls made outside `tessera-ui`.

### Data fetching layer (`app/resources/`)
Three-tier pattern per domain (`workflows`, `sources`, `events`, `nodes`), consistent across all of them:
1. `resources/queries/<domain>/<domain>.queries.ts` — raw async functions calling `fetchApi` (`app/libraries/fetch.ts`) against the backend `API_URL`.
2. `resources/queries/<domain>/<domain>.type.ts` / `.schema.ts` — response types and Zod input schemas.
3. `resources/hooks/<domain>/use-<domain>.ts` — React Query hooks (`useQuery`/`useMutation`) wrapping the query functions, with a `<domain>QueryKeys` key factory for cache invalidation, toast notifications on mutation success/error (`sonner`), and a `QueryError` wrapper that requires `config.token` to be present before firing.

All of these take an `IQueryConfig` (`{ apiUrl, token, nodeEnv }`, defined in `resources/queries/index.ts`) — pull it from the route's loader data + `useApp()`'s `token`, don't fetch env vars ad hoc inside a hook.

`app/libraries/fetch.ts`'s `fetchApi` is the single HTTP client: attaches the bearer token, translates HTTP 401/403 into typed `TokenExpiredError`/`UnauthorizedError` (caught by `app/hooks/useHandleApiError.ts`, which redirects to `/logout` or `/`), and in `development` logs a curl-equivalent of every request via `curl-generator`.

### UI layer
- `tessera-ui` (git dependency on `github:tesserahq/tessera-ui`, pinned via `bun.lock`) is a shared, sibling-maintained component/pattern library used across tesserahq portals (this app, custos-portal, etc.). It's imported from several subpaths: root `tessera-ui` (providers/hooks like `useApp`, `AuthProvider`, `TesseraProvider`), `tessera-ui/components`, `tessera-ui/components/delete-confirmation`, `tessera-ui/layouts`. When something looks like it should be shared UI, check there before building locally — and when bumping it, remember its git ref isn't SemVer-pinned, so `bun update tessera-ui` can pull in breaking API changes silently.
- `app/modules/shadcn/` holds copy-and-own shadcn/Radix primitives (imported as `@shadcn/*`, aliased in `tsconfig.json`/`vite.config.ts`), separate from `tessera-ui`'s components — shadcn primitives are local/low-level, `tessera-ui` is the shared higher-level pattern layer.
- The workflow builder (`app/components/react-flow/`) is built on `@xyflow/react`; `canvas.tsx` is the main canvas, with node/edge drawers under `react-flow/drawer/`.
- Path aliases: `@/*` → `app/*`, `@shadcn/*` → `app/modules/shadcn/*`.

### i18n
`app/modules/i18n/` (client `i18n.ts` + server `i18n.server.ts`, via `remix-i18next`) with locale files under `app/modules/i18n/locales/` — excluded from `format`/`format:check` globs.

## Code conventions (from `.cursor/rules/global.mdc`)
- Tailwind classes only for styling — avoid raw CSS/inline styles.
- Event handlers are named with a `handle` prefix (`handleClick`, `handleKeyDown`).
- Prefer `const fn = () => {}` arrow functions with an explicit type over `function` declarations.
- Prefer early returns over nested conditionals.
