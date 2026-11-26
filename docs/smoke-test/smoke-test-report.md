# End-to-end smoke test: checklist and results

Run on 16 November 2026 against `main` at commit `ea1b276`, from a fresh clone, with the backend, the Next.js frontend, and the `CredentialRegistry` contract deployed on Polygon Amoy. All credential data is synthetic ("Sample Graduate"). Nothing in this run is mocked: every issue, verify, and revoke went through the real UI, the real API, and the real Amoy contract.

## Follow-up check - 17 November 2026

Victor reports that the backend and frontend passed Peterson's smoke-test checklist in a follow-up run. This records the later team check; the detailed run conditions and evidence below describe the original 16 November run.

## Retest on updated `main` - 26 November 2026

Run from `main` at commit `0643353`, which includes the fixes for issues #11 to #14, against the same Amoy contract. Checks run from the repository with the real UI, API, and contract.

| Check | Result |
|---|---|
| Backend tests | 3/3 pass |
| Frontend tests | 4/4 pass, production build passes |
| Amoy config check | Passes, chain ID 80002 |
| Issue, verify `valid`, unknown ID `not_found` | Pass |
| Altered stored document | `tampered`: signature and integrity fail, the other three pass |
| Restored document | `valid` again |
| Revoke | "Credential revoked", now with a Polygonscan link to the revoke transaction ([`0xc1f558ab…bfaa7b`](https://amoy.polygonscan.com/tx/0xc1f558ab6a69665c993c22f2ec8198a18ff16d36d1cb8068b3419887d0bfaa7b)) |
| Revoke a second time | Red message "Credential is already revoked." (no generic error, no new transaction) |
| Verify after revoking | `revoked`: only revocation status fails |
| `git status` with the old `CREDENTIAL_STORE_PATH=./data/credentials.json` | `data/` is not listed, so it is ignored |

Not retested in the browser: the malformed-store handling from finding 4. It was checked by reading the code, and the backend has no automated test for it yet.

New observations from this run:
- After issuing a second credential, the previous verification result and the "already revoked" message stay on screen until the next action, so they can be mistaken for the new credential's state.
- The backend has no automated test for the `409 ALREADY_REVOKED` response or for store validation.

Screenshots for the retest are `09` to `11` in the evidence table.

## Result summary (16 November run)

| # | Check | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Issue a credential | "Credential registered", ID and transaction hash | As expected | Pass |
| 2 | Verify the new ID | `valid`, all five checks pass | As expected | Pass |
| 3 | Verify an unknown ID | `not_found`, all five checks fail | As expected | Pass |
| 4 | Verify after altering the stored document | `tampered`: signature and integrity fail | As expected | Pass |
| 5 | Revoke | "Credential revoked" | As expected | Pass |
| 6 | Verify after revoking | `revoked`: only revocation check fails | As expected | Pass |
| 7 | Extras (API): wrong token, invalid input, double revoke | 401, 400, clear error | 401, 400, **generic 500** (fixed later: now `409`, see the retest above) | Pass with finding |

The restored credential also verified as `valid` again before step 5, which confirms the tamper result came from the edit and not from a fault.

## Findings

These were not blockers; the full flow worked. They were found in the 16 November run, each has a GitHub issue, and all four have since been fixed on `main`. The descriptions below are what was found; each line ends with its status.

1. **Revoking twice returned HTTP 500 `INTERNAL_ERROR`.** The contract correctly rejected the second revoke, but the API reported a generic server error. *Fixed (#11, #17): a second revoke returns `409 ALREADY_REVOKED` and sends no transaction. Verified in the 26 November retest.*
2. **The shared `.env` used `CREDENTIAL_STORE_PATH=./data/credentials.json`, but `.env.example` and the docs say `./backend/data/credentials.json`.** The path resolves from the repository root, so the store landed in `<repo>/data/`, which `.gitignore` did not cover. *Fixed (#12): `.gitignore` now ignores `/data/` as well as `backend/data/`. Verified in the retest.*
3. **The UI did not show the revocation transaction hash.** *Fixed (#13): the UI shows the revoke transaction as a Polygonscan link. Verified in the retest.*
4. **A store file that was not a plain JSON array made the API fail with a generic 500.** A Windows tool saved the file with a byte-order mark and as a single object. *Fixed (#14): a BOM is tolerated, and invalid JSON, a non-array, or a record without an `id` returns `500 INVALID_CREDENTIAL_STORE` with a specific message. Checked by reading the code; not retested in the browser. Still edit the store with Node, as in the "Tamper step" below.*

## Beginner checklist

You need Node.js 20.6 or newer, npm, and a `.env` in the repository root with the Amoy settings from your team coordinator. Never paste `.env` contents, keys, or the issuer token into chat, screenshots, or Git.

### Setup

1. Clone the repository and `cd` into it.
2. Copy `.env.example` to `.env` and fill in the values. Keep `CREDENTIAL_STORE_PATH=./backend/data/credentials.json`.
3. Check the settings. From the repository root run:

   ```sh
   node --env-file=.env scripts/check-amoy-config.mjs --check-rpc --require-contract --require-issuer
   ```

   Expected: "Amoy configuration values passed the format check." and "RPC connection passed: endpoint reports Polygon Amoy (chain ID 80002)."
4. Run the automated tests. Expected: `backend` 3 pass, `frontend` 4 pass (contracts has its own Hardhat tests).

   ```sh
   cd backend && npm install && npm test
   cd ../frontend && npm install && npm test && npm run build
   ```

5. Start both apps in two terminals: `npm start` in `backend/` (waits for "Credential API listening"), and `npm run dev` or `npm start` in `frontend/`. Open <http://localhost:3000>.

### Steps and expected results

| Step | What to do | Expected result |
|---|---|---|
| 1. Issue | Enter the issuer token, keep the sample details, click **Issue credential**. Wait up to about 10 seconds. | Green "Credential registered" with a `urn:uuid:…` ID and a transaction hash. The ID is copied into the verify form. |
| 2. Valid | Click **Verify credential**. | "Credential is valid". Issuer signature, Credential integrity, Registered issuer, On-chain registration, Revocation status: all **Passed**. |
| 3. Unknown ID | Replace the ID with `urn:uuid:00000000-0000-4000-8000-000000000000` and verify. | "Credential not found". All five checks **Failed**. |
| 4. Tampered | See "Tamper step" below. Verify the original ID again. | "Credential is invalid" (API status `tampered`). Issuer signature and Credential integrity **Failed**; Registered issuer, On-chain registration, Revocation status **Passed**. |
| 5. Restore | Undo the edit, restart the backend, verify the original ID. | "Credential is valid" again, all five **Passed**. |
| 6. Revoke | Click **Revoke this credential**. Wait about 10 seconds. | "Credential revoked. Verify it again to see the updated status." plus a Polygonscan link to the revoke transaction. Clicking **Revoke this credential** again shows "Credential is already revoked." |
| 7. Revoked | Verify the original ID. | "Credential has been revoked". Revocation status **Failed**; the other four **Passed**. |

### Tamper step

The backend reads the credential store once and keeps it in memory, so edit the file while it is stopped.

1. Stop the backend (Ctrl+C).
2. Keep a copy of `backend/data/credentials.json`, then change the stored degree with Node, which keeps the file as valid UTF-8 JSON without a BOM:

   ```sh
   node -e "const fs=require('fs');const f='backend/data/credentials.json';const j=JSON.parse(fs.readFileSync(f,'utf8'));j[0].credentialSubject.degree='PhD Forged Studies';fs.writeFileSync(f,JSON.stringify(j,null,2)+'\n')"
   ```

   Do not use Windows PowerShell's `ConvertTo-Json | Set-Content` or Notepad for this: they can turn the one-item array into a single object, and the API will answer `500 INVALID_CREDENTIAL_STORE` (a BOM alone is now tolerated; finding 4).
3. Start the backend again and verify the original ID.
4. To restore, stop the backend, copy your backup over `credentials.json`, and start it again.

## Evidence

Screenshots contain only synthetic data, the masked token field, a credential ID, and a transaction hash. The issuer token is shown as dots and no keys appear.

| File | Shows |
|---|---|
| [01-landing.jpg](screenshots/01-landing.jpg) | The app on first load |
| [02-issued.jpg](screenshots/02-issued.jpg) | Issuance complete, ID in the verify form |
| [03-valid.jpg](screenshots/03-valid.jpg) | `valid`, five checks passed |
| [04-not-found.jpg](screenshots/04-not-found.jpg) | `not_found`, five checks failed |
| [05-tampered.jpg](screenshots/05-tampered.jpg) | `tampered`: signature and integrity failed |
| [06-valid-after-restore.jpg](screenshots/06-valid-after-restore.jpg) | `valid` again after restoring the document |
| [07-revoked-confirmation.jpg](screenshots/07-revoked-confirmation.jpg) | Revocation confirmed |
| [08-revoked-verification.jpg](screenshots/08-revoked-verification.jpg) | `revoked`: revocation check failed |
| [09-retest-revoked-verification.jpg](screenshots/09-retest-revoked-verification.jpg) | Retest: `revoked` on updated `main`, with "Credential is already revoked." under the revoke link |
| [10-retest-revoke-transaction-link.jpg](screenshots/10-retest-revoke-transaction-link.jpg) | Retest: the revoke transaction link shown after revoking |
| [11-retest-already-revoked.jpg](screenshots/11-retest-already-revoked.jpg) | Retest: a second revoke shows "Credential is already revoked." |

- Contract: [`0x1dC2404b371BAfbf4ed3f641596dA2FE40267063`](https://amoy.polygonscan.com/address/0x1dC2404b371BAfbf4ed3f641596dA2FE40267063)
- Issue transaction for the test credential: [`0x4c8d8983…65d0b6`](https://amoy.polygonscan.com/tx/0x4c8d898389495cd5613601e6d3ab29ac31c878d4ff3046d80bf9b4d02a65d0b6)
- Revocation transaction, 16 November run: not captured. The UI did not display it then (finding 3, now fixed). Find it on the contract's page above, under the issuer wallet's transactions.
- Revocation transaction, 26 November retest: [`0xc1f558ab…bfaa7b`](https://amoy.polygonscan.com/tx/0xc1f558ab6a69665c993c22f2ec8198a18ff16d36d1cb8068b3419887d0bfaa7b)

## Limits of this run

- One credential was issued, tampered with, restored, and revoked. It remains registered and revoked on Amoy, as testnet data.
- Tests ran in Chrome on Windows 11 with Node.js 22. Other browsers and Node versions were not tried.
- The issuer token was entered into the issuer form for the session only.
