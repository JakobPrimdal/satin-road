# Satin Road — client

React 19 + Bun frontend for Satin Road. Styling is Tailwind CSS v4 with
[Base UI](https://base-ui.com) for unstyled, accessible components.

## Getting started

```bash
bun install
bun dev        # http://localhost:3000, with hot reload
```

The API is expected at `http://localhost:5120`. To use a different backend,
create `client/.env`:

```
BUN_PUBLIC_API_URL=http://localhost:5120
```

## Scripts

| Command         | What it does                                  |
| --------------- | --------------------------------------------- |
| `bun dev`       | Dev server with hot reload                    |
| `bun run build` | Production build to `dist/`                   |
| `bun start`     | Serve the app in production mode              |
| `bun run generate-api` | Regenerate the typed API client (see below) |

## API client

`src/generated/api.ts` is generated from the backend's Swagger spec with
[swagger-typescript-api](https://github.com/acacode/swagger-typescript-api).
Don't edit it by hand. Whenever the backend's endpoints or DTOs change, start
the API and run:

```bash
bun run generate-api
```

`src/lib/api.ts` wraps the generated client and turns failed requests into
readable error messages for the UI.

## Structure

```
src/
  pages/AuthPage.tsx         Sign in / register on the front page (/)
  pages/MarketLayout.tsx     Signed-in shell for /market (navbar, data, auth guard)
  pages/MarketPage.tsx       Featured, all listings, categories and search results
  pages/ProductPage.tsx      Listing details and ordering (/market/product/:id)
  components/market/         Navbar, search, cards, photos and shared market data
  components/ui.tsx          Form fields and buttons
  components/icons.tsx       Small inline icons
  components/Logo.tsx        Logo mark and wordmark
  lib/api.ts                 API calls (wraps the generated client)
  lib/session.ts             Signed-in user and token (localStorage)
  lib/format.ts              Prices, sorting and the featured selection
  generated/api.ts           Generated from Swagger, don't edit
  index.css                  Theme tokens (colours, fonts, animations)
```

Theme colours live in the `@theme` block in `src/index.css`; use them as
Tailwind classes (`bg-canvas`, `text-muted`, `border-line`, `text-danger`, …).
