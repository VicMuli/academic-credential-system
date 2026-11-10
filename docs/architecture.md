# Architecture (MVP)

```text
University demo user ──> Next.js web app ──> Node.js API ──> Off-chain JSON demo store
                                      │             ├── signs credential with server-held demo key
                                      │             ├── hashes canonical credential payload
                                      │             └── calls registry contract
Employer ──────────────> Next.js verify form ──> Node.js API ──> Polygon Amoy registry
                                                        checks signature + document hash + chain record + revocation
```

The full signed credential and personal claims stay off-chain. The chain stores only hashes and issuer/status metadata. Amoy is a public test network: demo data and transaction metadata are still publicly observable. Use fictional identities and claims. The MVP is a centralized demo issuer with an on-chain integrity/revocation registry; it is not a complete self-sovereign identity network or production W3C VC deployment.
