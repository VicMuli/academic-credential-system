# Credential registry contract (Jose)

This workspace contains the Solidity contract and its tests for the academic credential verification MVP. The contract stores only credential hashes and status on Polygon Amoy; it does not store student names, grades, or credential documents.

## Interface

- `registerCredential(bytes32 credentialIdHash, bytes32 contentHash)`: registers a credential; the caller becomes its issuer. Duplicate IDs and zero hashes are rejected.
- `getCredential(bytes32 credentialIdHash)`: returns `(bool exists, bytes32 contentHash, address issuer, uint64 issuedAt, bool revoked)`.
- `revokeCredential(bytes32 credentialIdHash)`: only the registering issuer can revoke, and a credential cannot be revoked twice.

Events are `CredentialRegistered` and `CredentialRevoked`. Custom errors are `AlreadyRegistered`, `NotRegistered`, `NotIssuer`, `AlreadyRevoked`, and `EmptyHash`.

Hash formats must match `../docs/integration-contract.md`: `credentialIdHash` is Keccak-256 of the credential ID's UTF-8 bytes; `contentHash` is SHA-256 of the RFC 8785 JCS canonical unsigned credential. Each is passed as a 32-byte value. Fatuma and Victor should use the exact same routines in the backend.

## Install and test

Use Node.js 20 or newer. From the repository root, run:

```powershell
Set-Location contracts
npm install
npm test
npm run compile
```

The tests use Hardhat's local in-memory network; they do not need an RPC URL, wallet, or test POL.

## Prepare ABI for the backend

After compilation, run:

```powershell
npm run export:abi
```

The generated ABI is saved at `contracts/abi/CredentialRegistry.abi.json`. It contains no secrets and can be committed for Fatuma's backend integration.

## Deploy locally for rehearsal

Open one terminal at `contracts/` and run:

```powershell
npm run node
```

In a second terminal, from `contracts/`, run:

```powershell
npm run deploy:local
```

## Deploy to Polygon Amoy

1. Confirm the root `.env` contains a working `POLYGON_AMOY_RPC_URL`, `POLYGON_AMOY_CHAIN_ID=80002`, and a disposable `ISSUER_PRIVATE_KEY` for a test-only wallet with Amoy POL. Never commit or share `.env`, recovery phrases, or private keys.
2. From the repository root, run `node --env-file=.env scripts/check-amoy-config.mjs --check-rpc`.
3. From `contracts/`, run `npm run deploy:amoy`.
4. Confirm the deployment transaction receipt and record the address and transaction link below. Do not claim deployment succeeded without a confirmed receipt.
5. Set `CONTRACT_ADDRESS` in the local root `.env`; never put private configuration in frontend files.

Victor coordinates the Amoy deployment and backend connection. Do not deploy from a wallet holding real funds or deploy to mainnet.

## Deployment record

- Network: Polygon Amoy, chain ID 80002
- Contract address: `0x1dC2404b371BAfbf4ed3f641596dA2FE40267063`
- Deployment transaction: [0x71ab820b176e082f22618ea78aa428ba708323bf2c47f6ae71f440cd6ca79b47](https://amoy.polygonscan.com/tx/0x71ab820b176e082f22618ea78aa428ba708323bf2c47f6ae71f440cd6ca79b47)
- Deployer address: `0xF492b459573120d45937537E50877abEf07e58D7`

## MVP limitation

Any wallet can register a credential and becomes its issuer. The backend must confirm the on-chain issuer is the expected backend issuer. This is a classroom testnet MVP, not a production multi-university registry.