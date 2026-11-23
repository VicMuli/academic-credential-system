# API contract

This describes the API as implemented in `backend/src/app.js`. Change this file in the same pull request as any change to routes, fields, or error shapes.

Base URL in local development: `http://127.0.0.1:4000/api`. The API binds to `127.0.0.1` only. The frontend calls same-origin `/api/*`, which Next.js forwards to this address.

## Credential shape

Use synthetic data only. The issuer sends just the claims:

```json
{
  "credentialSubject": {
    "name": "Sample Graduate",
    "degree": "BSc Example Studies",
    "graduationYear": 2026
  }
}
```

`credentialSubject` must be a JSON object; the API does not validate individual claim fields. The server sets `id`, `issuer`, and `issuanceDate` itself and ignores any other fields in the request. The stored signed credential looks like this:

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "AcademicCredential"],
  "id": "urn:uuid:3f0c2c0e-0000-4000-8000-000000000000",
  "issuer": "did:example:demo-university",
  "issuanceDate": "2026-11-10T09:00:00.000Z",
  "credentialSubject": {
    "name": "Sample Graduate",
    "degree": "BSc Example Studies",
    "graduationYear": 2026
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2026-11-10T09:00:00.000Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:example:demo-university#issuer-key-1",
    "publicKey": "<base64 SPKI DER public key>",
    "proofValue": "<base64url Ed25519 signature>"
  }
}
```

The signature and `contentHash` both cover the credential without `proof`, canonicalized with RFC 8785 JCS. `docs/integration-contract.md` has the full hash rules. The signing private key stays on the server. This is a W3C-style shape for an integrity demo, not a complete W3C JSON-LD Data Integrity proof implementation.

## Endpoints

Issuer routes require `Authorization: Bearer <ISSUER_API_TOKEN>`. A missing or wrong token returns `401 UNAUTHORIZED`.

| Route | Access | Success response |
|---|---|---|
| `POST /credentials` | Issuer | `201` with `{ id, status: "registered", transactionHash }` |
| `GET /credentials/:id` | Issuer | `200` with the signed credential |
| `GET /verify/:id` | Public | `200` with `{ id, status, checks }` |
| `POST /credentials/:id/revoke` | Issuer | `200` with `{ id, status: "revoked", transactionHash }` |

- `POST /credentials` builds and signs the credential, registers the ID hash and content hash on-chain, waits for a successful receipt, and only then saves the signed document off-chain.
- `GET /credentials/:id` is for the issuer/student demo view only. It returns `404 NOT_FOUND` if the document is not in the local store.
- `GET /verify/:id` always answers `200`; the outcome is in `status`, which is `valid`, `revoked`, `tampered`, or `not_found`. `checks` holds the booleans `signatureValid`, `hashMatches`, `issuerMatches`, `registeredOnChain`, and `notRevoked`. The response never includes credential claims.
- `POST /credentials/:id/revoke` returns `404 NOT_FOUND` if the ID is not registered on-chain. It waits for a successful receipt before answering.

URL-encode the credential ID in paths (`urn:uuid:...` contains colons).

### Verification status rules

| Status | When |
|---|---|
| `not_found` | No on-chain registration for the ID. All checks are `false`. |
| `valid` | Signature, hash, and issuer checks pass and the record is not revoked. |
| `revoked` | Signature, hash, and issuer checks pass and the record is revoked. |
| `tampered` | The ID is registered but the off-chain document is missing, its signature or hash fails, or the on-chain issuer is not the backend's issuer wallet. |

## Errors

All errors use `{ "error": { "code": "...", "message": "..." } }`. Stack traces and student details are never returned.

| HTTP | Code | When |
|---|---|---|
| 400 | `INVALID_INPUT` | `credentialSubject` is missing or not a JSON object |
| 400 | `INVALID_JSON` | The request body is not valid JSON |
| 401 | `UNAUTHORIZED` | Issuer route called without the correct bearer token |
| 404 | `NOT_FOUND` | Credential not in the store (fetch) or not registered (revoke) |
| 409 | `ALREADY_REVOKED` | Credential is already revoked; no new transaction is submitted |
| 500 | `INTERNAL_ERROR` | Unexpected failures, including rejected chain transactions for reasons other than an already-revoked credential |

The revoke route reads the registry first and returns `409 ALREADY_REVOKED` when the credential is already revoked.

## Contract interface

The deployed `CredentialRegistry` (address in `contracts/README.md`, ABI in `contracts/abi/CredentialRegistry.abi.json`):

- `registerCredential(bytes32 credentialIdHash, bytes32 contentHash)`
- `revokeCredential(bytes32 credentialIdHash)`
- `getCredential(bytes32 credentialIdHash)` returns `(bool exists, bytes32 contentHash, address issuer, uint64 issuedAt, bool revoked)`

Events: `CredentialRegistered(credentialIdHash, contentHash, issuer, issuedAt)` and `CredentialRevoked(credentialIdHash, issuer, revokedAt)`. Custom errors: `AlreadyRegistered`, `NotRegistered`, `NotIssuer`, `AlreadyRevoked`, `EmptyHash`.

The contract rejects duplicate registrations and zero hashes, and restricts revocation to the registering issuer. All personal information and the full credential JSON stay off-chain.
