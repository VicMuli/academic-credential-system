# Smart contract workspace (Jose)

`CredentialRegistry` stores only hashes and status on Polygon Amoy. No names, grades or documents go on-chain.

## Interface (matches docs/api-contract.md and docs/integration-contract.md)

| Function | Who | Does |
|---|---|---|
| `registerCredential(bytes32 credentialIdHash, bytes32 contentHash)` | Issuer wallet (backend) | Registers the record. Caller becomes the issuer. Reverts on duplicates or zero hashes. |
| `revokeCredential(bytes32 credentialIdHash)` | Registering issuer only | Marks the record revoked. |
| `getCredential(bytes32 credentialIdHash)` | Anyone (read) | Returns `(bool exists, bytes32 contentHash, address issuer, uint64 issuedAt, bool revoked)`. |

Events: `CredentialRegistered(credentialIdHash, contentHash, issuer, issuedAt)` and `CredentialRevoked(credentialIdHash, issuer, revokedAt)`.

Custom errors: `AlreadyRegistered`, `NotRegistered`, `NotIssuer`, `AlreadyRevoked`, `EmptyHash`.

Hash rules (from the integration contract): `credentialIdHash = keccak256(utf8(id))`, `contentHash = sha256(JCS(unsigned credential))`, both passed as 0x + 64 hex characters.

Status mapping for the backend: `exists == false` -> `not_found`; `revoked == true` -> `revoked`.

## Setup

```bash
cd contracts
npm install
npm test
```

## Deploy

1. In the root `.env`, set `POLYGON_AMOY_RPC_URL` and `ISSUER_PRIVATE_KEY` (a throwaway testnet key with test POL only).
2. Deploy:
   - Local rehearsal: `npm run node` in one terminal, then `npm run deploy:local` in another.
   - Amoy: `npm run deploy:amoy`
3. Copy the printed address into `CONTRACT_ADDRESS` in `.env`, and record it below.
4. The ABI is written to `contracts/abi/CredentialRegistry.abi.json` for the backend.

## Deployment notes (fill in after deploying)

- Network: Polygon Amoy, chain ID 80002
- Contract address:
- Deployment transaction link:
- Deployed by (public address only):

## Limitations (for the demo)

- Any wallet can register a record and becomes its issuer; the backend must check that `issuer` equals its own wallet address when verifying.
- One central demo issuer, so there is no multi-issuer governance.
- Testnet only; Amoy data is public.
