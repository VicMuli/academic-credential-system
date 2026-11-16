# Architecture (MVP)

```text
Browser (http://localhost:3000)
  ├── Issuer form ──────┐
  └── Employer form ────┤  same-origin /api/*
                        ▼
              Next.js app (frontend/)
                        │  rewrite to http://127.0.0.1:4000/api
                        ▼
              Node.js API (backend/)
                ├── signs the credential (Ed25519 key held on the server)
                ├── hashes the canonical credential (RFC 8785 JCS + SHA-256)
                ├── local JSON store ── full signed credentials, off-chain
                └── ethers ──> CredentialRegistry on Polygon Amoy
                               ID hash, content hash, issuer, issue time, revoked flag
```

## Flows

- **Issue** (issuer token required): the API builds and signs the credential, registers its ID hash and content hash on Amoy with the backend's issuer wallet, waits for the receipt, then saves the signed document to the local store.
- **Verify** (public): the API reads the on-chain record and the stored document, then checks the signature, the recomputed hash against the on-chain hash, the on-chain issuer against the backend's wallet, and the revoked flag. It returns a status and five boolean checks, without any claims.
- **Revoke** (issuer token required): the API calls the contract from the issuer wallet and waits for the receipt. The stored document is unchanged; later verification reports `revoked`.

## Keys and secrets

| Secret | Purpose | Lives in |
|---|---|---|
| Ed25519 signing key pair | Signs and verifies credentials | Root `.env`, backend only |
| EVM issuer private key | Pays for and sends Amoy transactions | Root `.env`, backend and deploy script only |
| Issuer API token | Guards issue, fetch, and revoke routes | Root `.env`; typed into the issuer form per session |

The browser never holds a private key. The issuer token stays in page memory and is cleared on refresh. The only frontend setting is the public API address.

## Boundaries

The full signed credential and personal claims stay off-chain. The chain stores only hashes and issuer/status metadata. Amoy is a public test network: demo data and transaction metadata are still publicly observable. Use fictional identities and claims. The MVP is a centralized demo issuer with an on-chain integrity/revocation registry; it is not a complete self-sovereign identity network or production W3C VC deployment.
