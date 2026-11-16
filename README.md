# Academic Credential Verification MVP

A beginner-friendly group project that demonstrates how an academic credential can be signed, stored off-chain, registered by hash on Polygon Amoy, revoked, and checked by an employer.

**Deadline:** 15 November 2026
**Team:** Victor Nzioki (coordinator and integration), Jose (Solidity), Serah (Next.js), Fatuma (Node.js, testing and documentation).

## What the MVP does

1. A university demo user submits a credential in the agreed JSON shape.
2. The Node.js API signs a W3C-style credential with an Ed25519 private key kept on the server.
3. The backend calculates a deterministic hash of the credential, registers the credential ID hash and content hash in a Solidity contract on Polygon Amoy, and, once the transaction is confirmed, stores the signed JSON document off-chain.
4. An employer enters a credential ID. The API checks the stored document's signature, recalculates its hash, compares it with the on-chain hash, confirms the on-chain issuer is the expected backend wallet, and checks revocation status.
5. The university demo user can revoke a credential; later checks report it as revoked.

Issuing, fetching, and revoking require a local issuer bearer token. Verification is public and returns a status and checks only, never the student's claims.

This is a classroom MVP, not production SSI or a standards-certified W3C VC implementation. Use synthetic student data only. Never put names, grades, documents, private keys, recovery phrases, RPC secrets, or other personal data on-chain or in Git.

## Beginner setup

Prerequisites: Git, Node.js 20.6 or newer, npm, and a browser wallet such as MetaMask for testnet deployment. Do not fund a wallet with real money for this assignment.

1. Clone the repository and create a branch for your assigned task.
2. Copy the root `.env.example` to `.env` and fill local test values only. The populated `.env` file is ignored by Git. `backend/README.md` explains how to generate the signing keys and the issuer token.
3. Set `CONTRACT_ADDRESS` to the deployed registry recorded in `contracts/README.md`, or deploy your own.
4. Install and start the backend, then the frontend, in separate terminals:

   ```sh
   cd backend
   npm install
   npm start        # API on http://127.0.0.1:4000/api
   ```

   ```sh
   cd frontend
   npm install
   npm run dev      # UI on http://localhost:3000
   ```

5. Follow the demo flow in `docs/testing-and-demo.md`.

The contract workspace is only needed to run contract tests or redeploy; see `contracts/README.md`.

## Project structure

```text
academic-credential-system/
├── README.md
├── .gitignore
├── .env.example                 # Setting names only; no secrets
├── scripts/
│   └── check-amoy-config.mjs    # Static Polygon Amoy settings check
├── docs/
│   ├── architecture.md
│   ├── integration-contract.md
│   ├── api-contract.md
│   ├── team-workflow.md
│   ├── codex-prompts.md
│   ├── testing-and-demo.md
│   └── presentation-outline.md
├── contracts/                   # Jose: Solidity contract and contract tests
│   ├── contracts/               # CredentialRegistry.sol
│   ├── abi/                     # Exported ABI for the backend
│   ├── scripts/                 # Deploy and ABI export
│   ├── test/
│   ├── hardhat.config.js
│   └── README.md
├── backend/                     # Fatuma: Node.js API, signing and verification
│   ├── src/                     # app, credentials, registry, store, server
│   ├── test/
│   ├── data/                    # Local credential store; created at runtime, ignored by Git
│   └── README.md
└── frontend/                    # Serah: Next.js user interface
    ├── app/                     # Page, layout, styles
    ├── lib/                     # API client and its tests
    ├── .env.example             # Public API address only
    ├── next.config.mjs          # Proxies /api to the backend
    └── README.md
```

`docs/api-contract.md` and `docs/integration-contract.md` describe the implemented API and contract boundary. Change them in the same pull request as any change to credential fields, endpoint behavior, contract method names, or error shapes.

## MVP boundaries

- Use a signed JSON credential with a small, documented W3C-style shape; do not claim full JSON-LD proof-suite or Polygon ID compliance.
- Store credential documents off-chain in a simple local JSON store for the demo. Make clear that this is not encrypted production storage.
- Store only a bytes32 credential ID hash, credential content hash, issuer address, issue time, and revoked flag on-chain.
- Use Polygon Amoy testnet. No mainnet deployment, NFTs, real student records, decentralized identity wallet, or production authentication in this deadline. The issuer bearer token is a single shared local secret, not user accounts.
- Verify signature, document hash against the on-chain hash, on-chain issuer, and revoked status. Clearly distinguish `valid`, `revoked`, `not_found`, and `tampered`.

## Scripts and run instructions

Each workspace has its own tests:

| Folder | Command | What it covers |
|---|---|---|
| `contracts/` | `npm test` | Registry contract on Hardhat's in-memory network |
| `backend/` | `npm test` | Hashing, signing, and the API routes against a mock registry |
| `frontend/` | `npm test`, `npm run build` | API client behavior and a production build |

To check the Amoy settings, copy `.env.example` to `.env`, then run `node --env-file=.env scripts/check-amoy-config.mjs` for a local format check. Add `--check-rpc` to make a read-only request and confirm the endpoint reports Polygon Amoy (chain ID 80002). After deployment, add `--require-contract`; add `--require-issuer` when checking issuer operations. The checks do not confirm that a contract is deployed. Use Node.js 20.6 or newer for `--env-file`. Keep the populated `.env` local and never paste it into Codex or screenshots.

## How to contribute

Read `docs/team-workflow.md` and `docs/api-contract.md` before coding. Use one feature branch per task, open a pull request into `main`, and request Victor's review. Do not commit directly to `main`. See `docs/codex-prompts.md` for individual prompts.
