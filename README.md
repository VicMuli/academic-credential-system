# Academic Credential Verification MVP

A beginner-friendly group project that demonstrates how an academic credential can be signed, stored off-chain, registered by hash on Polygon Amoy, revoked, and checked by an employer.

**Deadline:** 15 November 2026  
**Team:** Victor Nzioki (coordinator and integration), Jose (Solidity), Serah (Next.js), Sunflower (Node.js, testing and documentation).

## What the MVP does

1. A university demo user submits a credential in the agreed JSON shape.
2. The Node.js API signs a W3C-style credential using a private key kept on the server and stores the signed JSON document off-chain.
3. The backend calculates a deterministic hash of the credential and registers the credential ID and hash in a Solidity contract on Polygon Amoy.
4. An employer enters a credential ID. The app checks the stored document's signature, recalculates its hash, compares it with the on-chain hash, and checks revocation status.
5. The university demo user can revoke a credential; later checks report it as revoked.

This is a classroom MVP, not production SSI or a standards-certified W3C VC implementation. Use synthetic student data only. Never put names, grades, documents, private keys, recovery phrases, RPC secrets, or other personal data on-chain or in Git.

## Beginner setup

Prerequisites: Git, Node.js LTS, npm, and a browser wallet such as MetaMask for testnet deployment. Do not fund a wallet with real money for this assignment.

1. Clone the repository and create a branch for your assigned task.
2. Copy each app's `.env.example` to `.env` and fill only local test values. `.env` files are ignored by Git.
3. Install each app's dependencies using the instructions in its folder.
4. Start the backend and frontend in separate terminals.
5. Follow the demo flow in `docs/demo-checklist.md`.

## Project structure

```text
academic-credential-mvp/
├── README.md
├── .gitignore
├── .env.example                 # Names of settings only; no secrets
├── docs/
│   ├── architecture.md
│   ├── integration-contract.md
│   ├── api-contract.md
│   ├── team-workflow.md
│   ├── codex-prompts.md
│   ├── testing-and-demo.md
│   └── presentation-outline.md
├── contracts/                   # Jose: Solidity contract and contract tests
│   ├── contracts/
│   ├── test/
│   └── README.md
├── backend/                     # Sunflower: Node.js API, signing and verification
│   ├── src/
│   ├── test/
│   └── README.md
└── frontend/                    # Serah: Next.js user interface
    ├── app/
    ├── components/
    └── README.md
```

Keep the API contract in `docs/api-contract.md` stable. Each folder owner may add the usual package files, tests, and setup instructions inside their folder. Agree on credential fields, endpoint behavior, contract method names, and error shapes before parallel implementation.

## MVP boundaries

- Use a signed JSON credential with a small, documented W3C-style shape; do not claim full JSON-LD proof-suite or Polygon ID compliance.
- Store credential documents off-chain in a simple local JSON store for the demo. Make clear that this is not encrypted production storage.
- Store only a bytes32 credential ID hash, credential content hash, issuer address, issue time, and revoked flag on-chain.
- Use Polygon Amoy testnet. No mainnet deployment, NFTs, real student records, decentralized identity wallet, or production authentication in this deadline.
- Verify signature, document hash, on-chain hash, and revoked status. Clearly distinguish `valid`, `revoked`, `not found`, and `tampered`.

## Scripts and run instructions

The contract, backend, and frontend READMEs will document exact commands once implementation choices are agreed. Keep scripts simple and add one command at a time. Never copy a real `.env` file into documentation or screenshots.

## How to contribute

Read `docs/team-workflow.md` and `docs/api-contract.md` before coding. Use one feature branch per task, open a pull request into `main`, and request Victor's review. Do not commit directly to `main`. See `docs/codex-prompts.md` for individual prompts.
