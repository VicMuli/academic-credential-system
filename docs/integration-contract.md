# Integration Contract for the Amoy MVP

This document defines the shared boundary between the contract, backend, frontend, and demo: the values and results that must match across components. It started as Victor's integration proposal and now records what the merged contract, backend, and frontend implement. Change it in the same pull request as any change to that boundary.

## Agreed system boundary

- Network: Polygon Amoy testnet, chain ID `80002`.
- The backend is the only component that signs credentials and submits registry transactions.
- The frontend calls the backend API; it never receives the issuer private key or submits trusted verification results itself.
- The full signed credential stays in off-chain storage. On-chain data is limited to credential ID/content hashes and issuer/time/revocation metadata.
- Use fictional student information only. Amoy is public, so test transactions and hashes are visible.

## Credential and hash handshake

The unsigned credential payload is the stored credential shown in `docs/api-contract.md` without its `proof`. It includes `@context`, `type`, `id`, `issuer`, `issuanceDate`, and `credentialSubject`. The signed document adds a `proof` object. For hashing and signature verification, remove `proof` and use the same remaining payload.

1. Canonicalize the unsigned credential using RFC 8785 JSON Canonicalization Scheme (JCS). Do not rely on object insertion order or ordinary `JSON.stringify` output for the shared hash.
2. Set `contentHash` to SHA-256 of the UTF-8 bytes of that canonical JSON. It is exactly 32 bytes and can be passed to Solidity as `bytes32`.
3. Set `credentialIdHash` to Keccak-256 of the UTF-8 bytes of the credential's `id`. Represent both bytes32 values as 0x-prefixed, 64-hex-character strings at the API/ethers boundary.
4. The backend signs the same canonical unsigned payload with the Ed25519 credential signing key and stores the base64url signature in the signed document's `proof` (type `Ed25519Signature2020`), alongside the base64 SPKI public key. Verification requires the proof's public key to equal the backend's configured public key. This signing key is separate from the EVM issuer wallet key that sends transactions. The backend uses the `canonicalize` package for JCS; key formats are in `backend/README.md`. This project uses a W3C-style shape but does not claim standards-certified W3C proof-suite compliance.
5. Use the same canonicalization and hashing routine in issue and verify paths. A one-character change to an unsigned credential field must produce a verification failure.

The RFC defines JCS as a deterministic JSON representation suitable for repeatable hashing and signatures. The Amoy chain ID is 80002. References are listed at the end.

## Contract interface

Jose owns the contract. The deployed `CredentialRegistry` is recorded in `contracts/README.md` and its ABI is exported to `contracts/abi/CredentialRegistry.abi.json`:

- `registerCredential(bytes32 credentialIdHash, bytes32 contentHash)` makes the caller the issuer; duplicate IDs and zero hashes are rejected.
- `getCredential(bytes32 credentialIdHash)` returns `(bool exists, bytes32 contentHash, address issuer, uint64 issuedAt, bool revoked)`.
- `revokeCredential(bytes32 credentialIdHash)` is restricted to the registering issuer and cannot be repeated.

Events are `CredentialRegistered(credentialIdHash, contentHash, issuer, issuedAt)` and `CredentialRevoked(credentialIdHash, issuer, revokedAt)`. Custom errors are `AlreadyRegistered`, `NotRegistered`, `NotIssuer`, `AlreadyRevoked`, and `EmptyHash`.

The contract stores no credential fields or student information. Any wallet can register, so the backend compares the returned `issuer` with its own issuer wallet address and treats a mismatch as `tampered`. The backend keeps its own copy of these three function signatures in `backend/src/registry.js`; update it together with the contract.

## Backend and frontend handshake

Base URL for local development: `http://127.0.0.1:4000/api`. The browser calls same-origin `/api/*` on the Next.js app, which forwards to this address.

| Action | Request | Expected result |
|---|---|---|
| Issue | `POST /credentials` with `{ credentialSubject }` and the issuer bearer token | `201` with `{ id, status: "registered", transactionHash }` after confirmed registration and storage |
| Fetch for issuer/demo | `GET /credentials/:id` with the issuer bearer token | Signed off-chain document; never expose private keys |
| Verify for employer | `GET /verify/:id` | `{ id, status, checks }`; statuses are `valid`, `revoked`, `tampered`, or `not_found` |
| Revoke | `POST /credentials/:id/revoke` with the issuer bearer token | `{ id, status: "revoked", transactionHash }` after the contract accepts the issuer's request; `404 NOT_FOUND` if unregistered, `409 ALREADY_REVOKED` if already revoked |

Issuer-only routes require `Authorization: Bearer <ISSUER_API_TOKEN>`. Keep the token server-side; for the local classroom UI, the issuer enters it for the session. Verification checks are `signatureValid`, `hashMatches`, `issuerMatches`, `registeredOnChain`, and `notRevoked`. The employer view shows the credential ID and status/checks only; it should not display the graduate's claims. The backend remains authoritative for verification.

Status rules:

- `not_found`: there is no on-chain registration for the requested credential ID.
- `tampered`: the registered ID exists but the off-chain document is absent, the signature or content hash does not verify, or the on-chain issuer is not the backend's issuer wallet.
- `revoked`: signature, hash, and issuer checks pass but the issuer has revoked the record.
- `valid`: signature, hash, and issuer checks pass, the on-chain record exists, and the record is not revoked.

Error codes and HTTP statuses are listed in `docs/api-contract.md`.

## Configuration ownership

Use `.env.example` for variable names and descriptions only. Each developer creates an ignored local `.env` at the repository root for values. The backend and the contract workspace both read that root file. The frontend does not: its one setting goes in `frontend/.env.local`.

| Setting | Used by | Rule |
|---|---|---|
| `PORT` | Backend | API port; defaults to `4000` |
| `POLYGON_AMOY_RPC_URL` | Backend/contract deployment | RPC endpoint; never expose a provider secret in frontend code |
| `POLYGON_AMOY_CHAIN_ID` | Backend/deployment | Must be `80002` for Amoy |
| `CONTRACT_ADDRESS` | Backend | The deployed registry address from `contracts/README.md` |
| `ISSUER_PRIVATE_KEY` | Backend and deploy script only | Local test key only; never commit or paste into Codex |
| `CREDENTIAL_SIGNING_PRIVATE_KEY` | Backend only | Base64 PKCS#8 Ed25519 key; keep local and secret |
| `CREDENTIAL_SIGNING_PUBLIC_KEY` | Backend | Base64 SPKI Ed25519 key matching the signing key |
| `ISSUER_API_TOKEN` | Issuer routes only | Random local bearer token; never place in `NEXT_PUBLIC_*` values |
| `CREDENTIAL_STORE_PATH` | Backend | Local off-chain demo JSON store; resolved from the repository root, defaults to `backend/data/credentials.json` |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend (`frontend/.env.local`) | Public API URL only; defaults to `http://127.0.0.1:4000/api`; no private configuration |

The private key should be a disposable testnet issuer key with no real funds. Do not publish RPC secrets or environment files. If a secret is committed, stop using it and rotate it.

## Acceptance checks

Steps 1–4 are merged into `main`; each is covered by the listed tests.

1. Contract (Jose): `contracts/` tests cover register, lookup, duplicate rejection, empty hashes, unknown IDs, authorized revocation, unauthorized revocation, and double revocation.
2. Backend (Fatuma): `backend/` tests cover stable hash output regardless of property order, modified-claim rejection, a proof signed by a different key, and the issue/verify/revoke routes against a mock registry.
3. Frontend (Serah): the UI renders the four statuses from the API response without re-verifying in browser code; `frontend/` tests cover status mapping, unknown statuses failing closed, the bearer header, and error messages.
4. Amoy connection (Victor): the backend refuses to start unless the chain ID is `80002` and the contract address is valid, and reports issue or revocation only after a successful receipt.
5. Rehearsal (everyone): issue → valid verification → tamper check → revoke → revoked verification with synthetic data, following `docs/testing-and-demo.md`. A mock is labeled as a mock; a testnet transaction is not represented as successful until its receipt is confirmed.

## Sources

- [RFC 8785: JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785.html)
- [Polygon Support: Add Amoy to a wallet](https://support.polygon.technology/support/solutions/articles/82000907114-how-to-add-amoy-network-in-your-wallet-)
