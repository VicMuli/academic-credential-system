# Presentation outline (5–7 minutes)

1. Problem: fake academic credentials and slow manual checking.
2. Actors and design: issuer, graduate, employer, Next.js web app, Node.js API, off-chain JSON store, `CredentialRegistry` contract on Polygon Amoy. Use the diagram in `docs/architecture.md`.
3. Live flow, following `docs/testing-and-demo.md`: issue a synthetic credential and show the transaction hash, verify as employer (`valid`, five checks), verify an unknown ID (`not_found`), edit the stored document (`tampered`), revoke, verify again (`revoked`).
4. Security choices:
   - An Ed25519 signature detects any change to the credential.
   - The chain stores hashes, issuer, and status only; personal claims stay off-chain.
   - Verification also confirms the on-chain issuer is the university's wallet, because anyone can register a hash.
   - Issuer actions need a bearer token; employers get a status and checks, never the claims.
   - Private keys and the token stay on the server or in page memory, never in Git or frontend settings.
5. Limits and next steps: testnet, demo issuer key, one shared issuer token instead of accounts, local unencrypted JSON storage, W3C-style shape rather than complete standards compliance; production needs institutional identity, secure storage, access controls, key rotation, privacy review, and standards-compliant proof tooling.
6. Each member explains their component and one challenge learned: Jose (contract), Fatuma (API, signing, backend tests), Serah (frontend), Victor (integration and Amoy deployment), and Peterson (end-to-end smoke testing and demo evidence).
