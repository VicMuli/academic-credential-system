# End-to-end smoke test: checklist and results

Run on 16 November 2026 against `main` at commit `ea1b276`, from a fresh clone, with the backend, the Next.js frontend, and the `CredentialRegistry` contract deployed on Polygon Amoy. All credential data is synthetic ("Sample Graduate"). Nothing in this run is mocked: every issue, verify, and revoke went through the real UI, the real API, and the real Amoy contract.

## Result summary

| # | Check | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Issue a credential | "Credential registered", ID and transaction hash | As expected | Pass |
| 2 | Verify the new ID | `valid`, all five checks pass | As expected | Pass |
| 3 | Verify an unknown ID | `not_found`, all five checks fail | As expected | Pass |
| 4 | Verify after altering the stored document | `tampered`: signature and integrity fail | As expected | Pass |
| 5 | Revoke | "Credential revoked" | As expected | Pass |
| 6 | Verify after revoking | `revoked`: only revocation check fails | As expected | Pass |
| 7 | Extras (API): wrong token, invalid input, double revoke | 401, 400, clear error | 401, 400, **generic 500** | Pass with finding |

The restored credential also verified as `valid` again before step 5, which confirms the tamper result came from the edit and not from a fault.

## Findings

These are not blockers; the full flow works. Each has a GitHub issue.

1. **Revoking twice returns HTTP 500 `INTERNAL_ERROR`.** The contract correctly rejects the second revoke, but the API reports a generic server error instead of a clear message.
2. **The shared `.env` used `CREDENTIAL_STORE_PATH=./data/credentials.json`, but `.env.example` and the docs say `./backend/data/credentials.json`.** The path resolves from the repository root, so the credential store would land in `<repo>/data/`, which `.gitignore` does not cover (it only ignores `backend/data/`). Anyone using that value could commit `credentials.json` by accident.
3. **The UI does not show the revocation transaction hash.** Issuing shows a hash, revoking does not, so there is no link to show on the presentation for the revoke step.
4. **A store file that is not a plain JSON array makes the API fail with a generic 500.** This was triggered during testing: a Windows tool saved the file with a byte-order mark and as a single object, and `GET /verify/:id` for a registered credential returned `INTERNAL_ERROR` with no hint about the cause. Edit the store with Node or a UTF-8 editor without BOM, as in step 4 below.

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
| 6. Revoke | Click **Revoke this credential**. Wait about 10 seconds. | "Credential revoked. Verify it again to see the updated status." |
| 7. Revoked | Verify the original ID. | "Credential has been revoked". Revocation status **Failed**; the other four **Passed**. |

### Tamper step

The backend reads the credential store once and keeps it in memory, so edit the file while it is stopped.

1. Stop the backend (Ctrl+C).
2. Keep a copy of `backend/data/credentials.json`, then change the stored degree with Node, which keeps the file as valid UTF-8 JSON without a BOM:

   ```sh
   node -e "const fs=require('fs');const f='backend/data/credentials.json';const j=JSON.parse(fs.readFileSync(f,'utf8'));j[0].credentialSubject.degree='PhD Forged Studies';fs.writeFileSync(f,JSON.stringify(j,null,2)+'\n')"
   ```

   Do not use Windows PowerShell's `ConvertTo-Json | Set-Content` or Notepad for this: they can add a BOM or turn the one-item array into a single object, and the API will answer with a generic error (finding 4).
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

- Contract: [`0x1dC2404b371BAfbf4ed3f641596dA2FE40267063`](https://amoy.polygonscan.com/address/0x1dC2404b371BAfbf4ed3f641596dA2FE40267063)
- Issue transaction for the test credential: [`0x4c8d8983…65d0b6`](https://amoy.polygonscan.com/tx/0x4c8d898389495cd5613601e6d3ab29ac31c878d4ff3046d80bf9b4d02a65d0b6)
- Revocation transaction: not captured. The UI does not display it (finding 3) and an RPC log lookup failed. Find it on the contract's page above, under the issuer wallet's transactions.

## Limits of this run

- One credential was issued, tampered with, restored, and revoked. It remains registered and revoked on Amoy, as testnet data.
- Tests ran in Chrome on Windows 11 with Node.js 22. Other browsers and Node versions were not tried.
- The issuer token was entered into the issuer form for the session only.
