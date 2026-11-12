# Integration Contract for the Amoy MVP

This document is Victor's integration proposal for the shared boundary between the contract, backend, frontend, and demo. It keeps each member's implementation independent while defining the values and results that must match. Jose should confirm the contract ABI, and Fatuma should confirm the canonicalization and signature library before those components are merged.

## Agreed system boundary

- Network: Polygon Amoy testnet, chain ID `80002`.
- The backend is the only component that signs credentials and submits registry transactions.
- The frontend calls the backend API; it never receives the issuer private key or submits trusted verification results itself.
- The full signed credential stays in off-chain storage. On-chain data is limited to credential ID/content hashes and issuer/time/revocation metadata.
- Use fictional student information only. Amoy is public, so test transactions and hashes are visible.

## Credential and hash handshake

The API contract's sample credential is the unsigned credential payload. It includes `@context`, `type`, `id`, `issuer`, `issuanceDate`, and `credentialSubject`. The signed document adds a `proof` object. For hashing and signature verification, remove `proof` and use the same remaining payload.

1. Canonicalize the unsigned credential using RFC 8785 JSON Canonicalization Scheme (JCS). Do not rely on object insertion order or ordinary `JSON.stringify` output for the shared hash.
2. Set `contentHash` to SHA-256 of the UTF-8 bytes of that canonical JSON. It is exactly 32 bytes and can be passed to Solidity as `bytes32`.
3. Set `credentialIdHash` to Keccak-256 of the UTF-8 bytes of the credential's `id`. Represent both bytes32 values as 0x-prefixed, 64-hex-character strings at the API/ethers boundary.
4. The backend signs the same canonical unsigned payload with the demo issuer key and stores the signature in the signed document's `proof`. Fatuma records the selected signature algorithm and key format in the backend README. This project uses a W3C-style shape but does not claim standards-certified W3C proof-suite compliance.
5. Use the same canonicalization and hashing routine in issue and verify paths. A one-character change to an unsigned credential field must produce a verification failure.

The RFC defines JCS as a deterministic JSON representation suitable for repeatable hashing and signatures. The Amoy chain ID is 80002. References are listed at the end.

## Proposed contract interface

This matches the current sketch in `docs/api-contract.md`; Jose owns the final ABI and should confirm or propose a compatible change before implementation is merged:

- `registerCredential(bytes32 credentialIdHash, bytes32 contentHash)`
- `getCredential(bytes32 credentialIdHash)` returns registration existence, content hash, issuer, issue time, and revoked state.
- `revokeCredential(bytes32 credentialIdHash)` is restricted to the registering issuer.

The contract stores no credential fields or student information. The backend converts the returned content hash to the same bytes32 representation used when registering it. The exact Solidity return tuple and event names should be recorded here after Jose confirms the ABI.

## Backend and frontend handshake

Base URL for local development: `http://localhost:4000/api`.

| Action | Request | Expected result |
|---|---|---|
| Issue | `POST /credentials` with the agreed credential input and issuer bearer token | `{ id, status, transactionHash }` after storage and successful registration |
| Fetch for issuer/demo | `GET /credentials/:id` with the issuer bearer token | Signed off-chain document; never expose private keys |
| Verify for employer | `GET /verify/:id` | `{ id, status, checks }`; statuses are `valid`, `revoked`, `tampered`, or `not_found` |
| Revoke | `POST /credentials/:id/revoke` with the issuer bearer token | `{ id, status: "revoked", transactionHash }` after the contract accepts the issuer's request |

Issuer-only routes require `Authorization: Bearer <ISSUER_API_TOKEN>`. Keep the token server-side; for the local classroom UI, the issuer enters it for the session. Verification checks are `signatureValid`, `hashMatches`, `issuerMatches`, `registeredOnChain`, and `notRevoked`. The employer view shows the credential ID and status/checks only; it should not display the graduate's claims. The backend remains authoritative for verification.

Suggested status rules:

- `not_found`: there is no registration for the requested credential ID.
- `tampered`: the registered ID exists but the off-chain document is absent or the signature/content hash does not verify.
- `revoked`: the document and hash are valid but the issuer has revoked the record.
- `valid`: signature and hashes match, the on-chain record exists, and the record is not revoked.

## Configuration ownership

Use `.env.example` for variable names and descriptions only. Each developer creates an ignored local `.env` for values.

| Setting | Used by | Rule |
|---|---|---|
| `POLYGON_AMOY_RPC_URL` | Backend/contract deployment | RPC endpoint; never expose a provider secret in frontend code |
| `POLYGON_AMOY_CHAIN_ID` | Backend/deployment | Must be `80002` for Amoy |
| `CONTRACT_ADDRESS` | Backend | Set after Jose/Victor deploy the contract |
| `ISSUER_PRIVATE_KEY` | Backend only | Local test key only; never commit or paste into Codex |
| `CREDENTIAL_SIGNING_PRIVATE_KEY` | Backend only | Base64 PKCS#8 Ed25519 key; keep local and secret |
| `CREDENTIAL_SIGNING_PUBLIC_KEY` | Backend | Base64 SPKI Ed25519 key matching the signing key |
| `ISSUER_API_TOKEN` | Issuer routes only | Random local bearer token; never place in `NEXT_PUBLIC_*` values |
| `CREDENTIAL_STORE_PATH` | Backend | Local off-chain demo JSON store |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | Public API URL only; no private configuration |

The private key should be a disposable testnet issuer key with no real funds. Do not publish RPC secrets or environment files. If a secret is committed, stop using it and rotate it.

## Integration order and acceptance checks

1. Jose confirms the ABI and demonstrates contract tests for register, lookup, duplicate rejection, authorized revocation, and unauthorized revocation.
2. Fatuma confirms the JCS library, signature algorithm/key format, and backend route/response shapes. Unit tests cover stable hash output and modified-document rejection.
3. Serah uses the response shape above and renders the four statuses without re-verifying in browser code.
4. Victor connects the backend to the Amoy contract and checks chain ID/address before any write.
5. The team rehearses issue → valid verification → tamper check → revoke → revoked verification with synthetic data. A mock is labeled as a mock; a testnet transaction is not represented as successful until its receipt is confirmed.

## Sources

- [RFC 8785: JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785.html)
- [Polygon Support: Add Amoy to a wallet](https://support.polygon.technology/support/solutions/articles/82000907114-how-to-add-amoy-network-in-your-wallet-)
