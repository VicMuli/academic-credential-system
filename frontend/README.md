# Academic credential frontend

A responsive Next.js interface for the academic credential demo. University issuers can issue and revoke synthetic credentials; employers can verify an ID and see the API's `valid`, `revoked`, `tampered`, or `not_found` result with its individual checks.

## Requirements

- Node.js 20.6 or newer and npm
- The backend running locally at `http://127.0.0.1:4000`; follow [the backend setup notes](../backend/README.md)

## Start the frontend

From this folder:

```sh
npm install
npm run dev
```

Open <http://localhost:3000>. Next.js forwards same-origin `/api/*` requests to the backend, so the browser does not need direct cross-origin access. By default the API destination is `http://127.0.0.1:4000/api`.

To use another API address, copy `.env.example` to `.env.local` and change `NEXT_PUBLIC_API_BASE_URL`. This must be a public base URL; never put an API token, private key, RPC credential, or other secret in a `NEXT_PUBLIC_*` variable. Restart the development server after changing it.

## Use the demo

1. Enter the local `ISSUER_API_TOKEN` in the issuer form. It stays in page memory and clears on refresh.
2. Use fictional graduate and qualification details, then issue the credential. The returned ID is copied into the verification form.
3. Verify the ID as an employer. The employer view shows the status and checks, not the signed document or student claims.
4. To demonstrate revocation, use **Revoke this credential** with the issuer token, then verify the ID again.

The frontend has no mock mode. API and network errors appear in the relevant form; the UI does not claim success unless the backend confirms it. The token is not saved in browser storage or an environment file.

## Build and tests

```sh
npm test
npm run build
```

## Main files

- `app/page.jsx` contains the issuer and employer flows, pending states, and result messages.
- `app/globals.css` defines the responsive layout, form states, and reduced-motion behavior.
- `app/layout.jsx` sets shared page metadata and HTML.
- `lib/api.mjs` calls the backend and maps verification statuses to user-facing labels.
- `next.config.mjs` proxies `/api` requests to the configured backend.

This classroom prototype uses synthetic information and is not production identity infrastructure. Polygon Amoy is public, so submitted hashes and transaction metadata are visible.
