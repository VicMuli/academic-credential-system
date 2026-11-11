# Backend workspace

# Academic Credential Verification System

## Project Overview
The Academic Credential Verification System is designed to make it easier for employers and other authorised parties to verify academic credentials.

## Backend Development
The backend is being developed using Node.js and Express.js.

## Main Backend Responsibilities
- Issuing academic credentials.
- Generating digital signatures.
- Generating SHA-256 hashes.
- Storing credential information off-chain.
- Verifying credential authenticity.
- Supporting credential revocation.
- Integrating with the Polygon Amoy test network.

## Planned API Endpoints
- `POST /credentials/issue` – Issues a new credential.
- `GET /credentials/:id` – Retrieves a credential.
- `POST /credentials/verify` – Verifies a credential.
- `POST /credentials/:id/revoke` – Revokes a credential.

## Project Status
Backend development and integration are in progress.
