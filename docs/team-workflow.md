# Team workflow and ownership

**Updated completion and presentation target: Friday, 20 November 2026.**

## Roles

| Member | Owns | Deliverable |
|---|---|---|
| Victor Nzioki | Coordinator, integration, architecture | Agreed interfaces, integration branch plan, deployment/config coordination, PR review, end-to-end demo readiness |
| Jose | Solidity smart contract | Minimal credential registry, hash registration, revocation, contract tests, Amoy deployment notes |
| Serah | Next.js frontend | Issuance form, employer verification form/result, simple responsive UI, frontend setup notes |
| Fatuma | Node.js backend, API tests, backend documentation | Credential JSON shape and signing, off-chain demo store, API, chain adapter, unit/integration tests, API setup notes |
| Peterson | End-to-end smoke testing and demo evidence | Maintain the end-to-end checklist, record results, and prepare redacted screenshots and demo notes |

Victor coordinates integration; Jose owns the Solidity implementation. Fatuma owns backend/API tests and backend setup documentation. Peterson owns end-to-end smoke testing, the smoke-test report, and demo evidence.

## Integration sequence

1. **Victor creates shared agreements:** settle the credential example, API routes and response types, hash rules, contract function signatures, Amoy chain ID, folder ownership, and minimal run instructions. Commit these agreements before feature work.
2. **Jose builds contract independently:** write and test register, verify/read, and revoke behavior using synthetic IDs/hashes. Publish ABI, deployment instructions, and test contract address only after deployment. Never share a deployer private key.
3. **Fatuma builds API against agreed interfaces:** initially use a clearly labeled mock chain adapter if Jose's contract is not ready. Add issue, verify, and revoke endpoints; signing and hash verification tests; then swap in the Amoy adapter.
4. **Serah builds UI against the API contract:** use mock responses until backend endpoints are available. Implement loading, success, invalid/tampered, revoked, and error states.
5. **Victor integrates in short steps:** merge reviewed PRs into `main` in dependency order: contract interface, backend API, frontend, deployment/config and final docs. Keep each PR small and runnable.
6. **All members rehearse:** each member explains their part and one security/design limitation. Run the demo checklist from a clean clone before submission.

## Branch and pull request rules

- `main` is the shared working branch. No direct pushes.
- Branch names: `contract/registry`, `backend/credentials-api`, `frontend/verification-ui`, `docs/demo-guide` (or similarly clear names).
- Sync your branch with `main` before requesting review. Do not force-push shared branches.
- PRs explain what changed, how it was checked, screenshots or sample requests where useful, and any unfinished work.
- The owner reviews their own implementation locally; another teammate checks the integration-facing interface. Victor approves merge after at least one teammate review.
- Never add credentials, `.env`, wallet seed phrases, real student data, or private keys. If a secret is exposed, stop using it and rotate it immediately.

## Suggested short schedule

- **17 Nov:** smoke-test the backend and frontend using Peterson's checklist -- completed by Victor, with no blocking failure reported.
- **18 Nov:** review remaining follow-ups, confirm team records, and prepare the final demo.
- **19 Nov:** run the system from a clean clone, rehearse the presentation, and check that no secrets or real student data appear in the repository.
- **Friday, 20 Nov:** final demo and submission.

## Definition of done

- A sample signed credential can be issued and kept off-chain.
- Its deterministic content hash is registered on Amoy.
- Employer verification reports valid only if signature, content hash against the on-chain hash, on-chain issuer, and revocation status all pass.
- Altered, unknown, and revoked credentials produce distinct understandable outcomes.
- Demo works from written instructions; no secrets or real personal records appear in Git or the presentation.
