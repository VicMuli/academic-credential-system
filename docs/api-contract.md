# API contract (agree before parallel coding)

Base URL in local development: `http://localhost:4000/api`

Credential sample fields (synthetic data only):

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "AcademicCredential"],
  "id": "urn:uuid:replace-with-demo-id",
  "issuer": "did:example:demo-university",
  "issuanceDate": "2026-11-10T09:00:00Z",
  "credentialSubject": {
    "id": "did:example:demo-student",
    "name": "Sample Graduate",
    "degree": "BSc Example Studies",
    "graduationYear": 2026
  }
}
```

For the MVP, add a clearly explained server-side signature envelope (algorithm and signature) or a W3C-style `proof` object. Use `docs/integration-contract.md` for Victor's proposed integration rules: canonicalize the unsigned credential with RFC 8785 JCS, SHA-256 hash the canonical payload, and agree the signature algorithm with Sunflower before merging. Keep signing private key server-side. This demo is not a complete W3C JSON-LD Data Integrity proof implementation.

## Endpoints

- `POST /credentials`: validate demo input, create ID if needed, sign it, persist signed document off-chain, hash the agreed canonical payload, register ID/hash on-chain. Return `{ id, status, transactionHash }`. Do not return secrets.
- `GET /credentials/:id`: return the off-chain signed credential for the issuer/student demo view only. Keep employer verification response minimal.
- `GET /verify/:id`: retrieve document and on-chain record, check signature, recomputed hash, registered hash, and revocation. Return `{ id, status, checks }`, where status is `valid`, `revoked`, `tampered`, or `not_found`; checks contains booleans `signatureValid`, `hashMatches`, `registeredOnChain`, `notRevoked`.
- `POST /credentials/:id/revoke`: revoke on-chain (authorized issuer in demo configuration) and return `{ id, status: "revoked", transactionHash }`.

Use consistent JSON errors: `{ "error": { "code": "NOT_FOUND", "message": "Credential was not found." } }`. Do not expose stack traces or private student details in verify responses.

## Contract interface proposal

Agree with Jose before implementation; this sketch is the integration boundary:

- `registerCredential(bytes32 credentialIdHash, bytes32 contentHash)`
- `revokeCredential(bytes32 credentialIdHash)`
- `getCredential(bytes32 credentialIdHash)` returns registered content hash, issuer, issued timestamp, and revoked status.

The contract should reject duplicate registrations and restrict revocation to the registering issuer. Keep all personal information and full credential JSON off-chain. Victor records the final ABI names in this file after Jose confirms them.
