# AGENTS

## Project Snapshot

- React 18 + Vite frontend for pharmacy inventory workflows.
- Main routes are declared in [src/App.jsx](src/App.jsx).
- Most screens are page components in [src/pages](src/pages) and many of them render inside [src/components/layout/Layout.jsx](src/components/layout/Layout.jsx).
- Shared UI primitives live in [src/components/ui](src/components/ui) and use Tailwind utility classes, `class-variance-authority`, and the `cn()` helper from [src/lib/utils.js](src/lib/utils.js).
- Backend access is centralized in [src/services/api.js](src/services/api.js). Prefer extending that module instead of adding `fetch()` calls inside pages.

## Commands

- Install deps: `npm install`
- Start dev server: `npm run dev`
- Lint: `npm run lint`
- Build production bundle: `npm run build`
- Preview production build: `npm run preview`

There is no test script in [package.json](package.json). For most changes, validate with `npm run lint` and `npm run build`.

## Working Conventions

- Use the `@` alias for imports from `src`; it is defined in [vite.config.js](vite.config.js).
- Keep components functional and follow the existing hook-based style used across pages.
- Reuse the shared UI components before adding one-off buttons, inputs, cards, or modals.
- If a form already uses helpers from [src/lib/validators.js](src/lib/validators.js), keep validation there instead of duplicating inline rules.
- Preserve the existing Tailwind-heavy styling approach; avoid introducing a second styling system.

## Edit Routing

- For navigation or screen-level changes, inspect [src/App.jsx](src/App.jsx) first.
- For layout or sidebar behavior, inspect [src/components/layout/Layout.jsx](src/components/layout/Layout.jsx) and [src/components/layout/Sidebar.jsx](src/components/layout/Sidebar.jsx).
- For data-loading or CRUD work, inspect the relevant page and the matching API group in [src/services/api.js](src/services/api.js) together.
- If you add a new domain action, prefer adding it to the existing exported API group (`productsAPI`, `clientsAPI`, `suppliersAPI`, `salesAPI`, `purchasesAPI`) instead of creating a separate request pattern.

## Known Pitfalls

- Environment configuration matters. [.env](.env) sets `VITE_API_BASE_URL`, but [src/services/api.js](src/services/api.js) falls back to `http://localhost:3000/api2` when that variable is missing. Confirm which backend base path is intended before changing API behavior.
- The login page exists, but routes in [src/App.jsx](src/App.jsx) are declared directly with no visible auth guard. Do not assume protected-route infrastructure already exists.
- Many pages combine data fetching, modal state, and table rendering in one file. Keep changes local and incremental unless the task explicitly calls for refactoring.

## Good First Reads

- [package.json](package.json)
- [src/App.jsx](src/App.jsx)
- [src/services/api.js](src/services/api.js)
- [src/pages/Inventory.jsx](src/pages/Inventory.jsx)
- [src/components/layout/Layout.jsx](src/components/layout/Layout.jsx)