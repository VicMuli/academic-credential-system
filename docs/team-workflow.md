# Team workflow and ownership

## Roles

| Member | Owns | Deliverable |
|---|---|---|
| Victor Nzioki | Coordinator, integration, architecture | Agreed interfaces, integration branch plan, deployment/config coordination, PR review, end-to-end demo readiness |
| Jose | Solidity smart contract | Minimal credential registry, hash registration, revocation, contract tests, Amoy deployment notes |
| Serah | Next.js frontend | Issuance form, employer verification form/result, simple responsive UI, frontend setup notes |
| Fatuma | Node.js backend, testing, documentation | Credential JSON shape and signing, off-chain demo store, API, chain adapter, integrated test plan, demo/presentation docs |

Victor coordinates integration; Jose remains the owner of the Solidity implementation. Fatuma owns integration tests and explains how verification crosses API and chain.

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

- **10 Nov:** create repository, agree interfaces, everyone gets the project running.
- **11–12 Nov:** parallel contract/API/UI work with mocks and focused commits.
- **13 Nov:** integrate API with contract on Amoy; fix cross-component issues.
- **14 Nov:** end-to-end rehearsal, documentation, slides/demo screenshots; freeze features.
- **15 Nov:** final clean run and presentation.

## Definition of done

- A sample signed credential can be issued and kept off-chain.
- Its deterministic content hash is registered on Amoy.
- Employer verification reports valid only if signature, content hash, on-chain hash, and revocation status all pass.
- Altered, unknown, and revoked credentials produce distinct understandable outcomes.
- Demo works from written instructions; no secrets or real personal records appear in Git or the presentation.
