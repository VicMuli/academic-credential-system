# Individual copy-paste Codex prompts

Use these prompts after cloning the shared repository. Replace no real secrets into chat. Each person should ask Codex to explain edits in beginner-friendly language and keep changes inside their owned files.

## Victor Nzioki — coordinator and blockchain integration

```text
You are helping a beginner student coordinate the academic credential verification MVP. Read README.md, docs/team-workflow.md, docs/api-contract.md, and docs/architecture.md first. My role is coordinator and integration; Jose owns the Solidity contract, Serah owns the Next.js frontend, and Sunflower owns the Node.js API, tests, and documentation. Do not invent member GitHub usernames.

Help me maintain the agreed interfaces and integrate small pull requests. Review the current repository state, identify the smallest next integration task, and explain it simply before editing. Keep the MVP limited to a signed W3C-style JSON credential stored off-chain, on-chain credential ID/content hash registration and revocation, and employer verification on Polygon Amoy. Never put personal data or secrets on-chain or in Git. Do not deploy or use a real wallet without my explicit request. Respect file ownership; propose changes to another member's area instead of editing it without coordination. After changes, summarize files changed, how I can run/check the work, remaining blockers, and a concise pull request description.
```

## Jose — Solidity contract

```text
You are helping a beginner implement only the Solidity contract for our academic credential verification MVP. First read README.md, docs/team-workflow.md, docs/api-contract.md, and docs/architecture.md. Work only in contracts/ unless a small interface agreement update is necessary; ask before changing shared interfaces.

Implement a minimal, understandable registry on Solidity compatible with Polygon Amoy: register a bytes32 credential ID hash and bytes32 credential content hash; expose a read function for registered hash, issuer, issue time, and revoked state; allow only the registering issuer to revoke; reject duplicate/unknown operations safely; emit useful events. Store no student name, grades, credential JSON, or other personal data on-chain. Add focused automated contract tests for registration, duplicate rejection, reads, unauthorized revocation, authorized revocation, and unknown IDs. Use the repository's existing tooling if present; if absent, recommend the simplest beginner setup and explain before adding dependencies. Never place a private key, seed phrase, or RPC secret in code. Do not deploy without explicit authorization. Report the ABI/function names Victor and Sunflower must integrate, commands to run tests, files changed, and any limitations in simple language.
```

## Serah — Next.js frontend

```text
You are helping a beginner build only the Next.js frontend for our academic credential verification MVP. First read README.md, docs/team-workflow.md, docs/api-contract.md, and docs/architecture.md. Work only in frontend/ unless you find an API mismatch; report mismatches instead of silently changing the shared contract.

Create a simple accessible interface with two clear flows: a university demo form to issue a synthetic academic credential, and an employer form to verify a credential ID. Show loading and friendly success/error states for valid, revoked, tampered, and not-found results using the response shape in docs/api-contract.md. Keep API base URL in a public, non-secret frontend environment setting. Never collect real student data, put secrets in client code, or claim a credential is valid based only on frontend logic. Use backend verification results. Include a small README with beginner setup instructions and a clearly labeled mock mode only if the backend is not yet ready. Explain each important file and how to run the app. Summarize files changed and draft a PR description.
```

## Sunflower — Node.js backend, testing, documentation

```text
You are helping a beginner implement the Node.js backend, focused tests, and documentation for our academic credential verification MVP. First read README.md, docs/team-workflow.md, docs/api-contract.md, docs/architecture.md, and docs/testing-and-demo.md. Work mainly in backend/ and your documentation files; coordinate contract function mismatches with Jose and Victor instead of silently changing shared interfaces.

Implement the agreed issue, fetch, verify, and revoke API routes. Create a synthetic W3C-style credential shape, sign it server-side, store the signed document in a simple local off-chain JSON demo store, calculate a documented deterministic content hash, and connect through a small contract adapter configured for Polygon Amoy. Verification must check signature, recomputed hash against the stored/registered on-chain hash, registration existence, and revocation. Return distinct valid, revoked, tampered, and not_found statuses; avoid exposing credential details in employer verification responses. Add focused tests, using a mock chain adapter for repeatability and a clear manual Amoy integration checklist. Validate environment settings; keep private keys and RPC URLs only in ignored local .env files and use .env.example with names/placeholders only. Do not claim complete W3C JSON-LD proof-suite compliance. Do not deploy or use real credentials. Explain setup and tests in plain language, summarize changed files, and draft a PR description.
```
