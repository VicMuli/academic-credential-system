# Fatuma's backend workspace

This Express API issues, stores, verifies, and revokes fictional academic credentials. Full signed credentials stay in the local JSON store; Polygon Amoy receives only the credential ID hash and content hash.

## Setup

Use Node.js LTS, then from this folder run:

```bash
npm install
npm test
```

Copy the root `.env.example` to `.env` and set the Amoy RPC URL, deployed contract address, a disposable testnet issuer private key, and `POLYGON_AMOY_CHAIN_ID=80002`. Keep `.env` out of Git. The contract ABI in `src/registry.js` matches `CredentialRegistry.sol`. The backend checks the chain ID and waits for successful transaction receipts before reporting issue or revocation as complete.

Generate an Ed25519 signing key pair once and keep its keys stable for the life of the demo store. Save the private key as base64 PKCS#8 DER in `CREDENTIAL_SIGNING_PRIVATE_KEY`, and the public key as base64 SPKI DER in `CREDENTIAL_SIGNING_PUBLIC_KEY`. For example, Node's `generateKeyPairSync('ed25519')` can export with `{format:'der',type:'pkcs8'}` and `{format:'der',type:'spki'}`. These keys are separate from the EVM issuer wallet key. Never commit or share either private key. Set `CREDENTIAL_STORE_PATH` to an ignored local path such as `./data/credentials.json`.

Start the API with `npm start`. It listens on port 4000 by default, with base URL `http://localhost:4000/api`.

## API

- `POST /credentials` accepts `{ "credentialSubject": { ...fictional claims... } }`; returns `{ id, status, transactionHash }`.
- `GET /credentials/:id` returns the signed off-chain credential for the issuer demo view.
- `GET /verify/:id` returns `{ id, status, checks }` with `valid`, `revoked`, `tampered`, or `not_found`. The response excludes credential claims.
- `POST /credentials/:id/revoke` revokes the on-chain record and returns `{ id, status, transactionHash }`.

Errors use `{ "error": { "code", "message" } }`. Do not put real student records, names, grades, secrets, or private keys in code, requests, screenshots, or chain transactions. This local JSON store and testnet issuer are classroom demo components, not production identity infrastructure.

## Hash and signature rules

The API canonicalizes the credential without its `proof` using RFC 8785 JCS. `contentHash` is SHA-256 of that UTF-8 canonical JSON; `credentialIdHash` is Keccak-256 of the UTF-8 credential ID. Ed25519 signs the same canonical payload. The proof uses a W3C-style `Ed25519Signature2020` shape and carries the demo public key; it is an integrity demonstration, not a standards-certified W3C proof suite. Before merging, Fatuma and Victor should confirm this algorithm and key format with the team.
