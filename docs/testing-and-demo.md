# Test and demo checklist

Use only fictional people and qualifications.

## Automated tests

Run these before a demo or a pull request. None of them needs an RPC URL, wallet, or test POL.

| Folder | Command | Covers |
|---|---|---|
| `contracts/` | `npm test` | Register, read, duplicate and empty-hash rejection, revocation rules |
| `backend/` | `npm test` | Hashing, signing, and the API routes against a mock registry |
| `frontend/` | `npm test`, then `npm run build` | Status mapping, bearer header, error messages, production build |

## Before the live demo

1. The root `.env` is filled in, including `CONTRACT_ADDRESS` and `ISSUER_API_TOKEN`.
2. `node --env-file=.env scripts/check-amoy-config.mjs --check-rpc --require-contract --require-issuer` passes from the repository root.
3. The issuer wallet has Amoy test POL for at least two transactions (issue and revoke).
4. Keep the issuer token ready to paste, but out of slides, screenshots, and screen shares.

## Live demo

1. Start the backend (`npm start` in `backend/`) and the frontend (`npm run dev` in `frontend/`), then open <http://localhost:3000>.
2. Enter the issuer token and issue a credential for “Sample Graduate”. Expected: “Credential registered” with a credential ID and a transaction hash. Each chain transaction waits for confirmation, so allow several seconds. Optionally open the transaction on <https://amoy.polygonscan.com> and point out that it holds hashes only.
3. Verify the ID as an employer. Expected: `valid`; all five checks pass, and no student claims are shown.
4. Verify an unknown ID such as `urn:uuid:does-not-exist`. Expected: `not_found`.
5. Tamper check:
   1. Stop the backend. It reads the store file once and then keeps it in memory, so edits made while it is running are ignored.
   2. In `backend/data/credentials.json`, change one claim of the issued credential, for example the degree. Keep the file a UTF-8 JSON array without a byte-order mark: Notepad and Windows PowerShell's `Set-Content` can break it, and the API then answers with a generic error. The one-line Node command in [the smoke-test report](smoke-test/smoke-test-report.md#tamper-step) is safe.
   3. Start the backend again and verify the same ID. Expected: `tampered`; the signature and integrity checks fail.
   4. Stop the backend, undo the edit exactly, and start it again. Verification returns to `valid`.
6. Revoke the original ID with **Revoke this credential**, then verify again. Expected: `revoked`; only the revocation check fails.
7. Optional: clear the token field and show that issuing is disabled; a wrong token returns “Issuer authorization is required.”
8. Confirm no `.env`, private key, seed phrase, RPC secret, issuer token, or real student information is tracked or shown.

## Backup path

Before the presentation, issue one credential and note its ID, then issue and revoke a second one and note that ID too.

- If the faucet is empty or transactions are slow on the day, verify those two IDs to show `valid` and `revoked`. Verification only reads the chain, so it needs no test POL.
- If the RPC endpoint itself is unreachable, verification fails too. Fall back to screenshots or a recording of a rehearsal.

Label any mocked or recorded step clearly; do not present a mock transaction as an on-chain transaction.
