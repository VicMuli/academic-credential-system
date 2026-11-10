# Test and demo checklist

Use only fictional people and qualifications.

1. Start the backend and frontend using their READMEs.
2. Issue a credential for “Sample Graduate”. Confirm a signed JSON document is saved off-chain and a transaction registers its hash on Polygon Amoy.
3. Verify the ID as an employer. Expected: `valid`; all four checks pass.
4. Change a stored copy of the credential in a local test fixture. Expected: `tampered`; hash or signature check fails.
5. Verify an unknown ID. Expected: `not_found`.
6. Revoke the original ID as the issuer, then verify again. Expected: `revoked`.
7. Confirm no `.env`, private key, seed phrase, RPC secret, or real student information is tracked or shown.

Before presentation, rehearse a backup path using a previously deployed test contract and sample credential if the testnet faucet or network is unavailable. Label any mocked/fallback step clearly; do not present a mock transaction as an on-chain transaction.
