// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CredentialRegistry
/// @notice Stores ONLY hashes and status for academic credentials.
///         No names, grades or documents are ever stored on-chain.
contract CredentialRegistry {
    struct Credential {
        bytes32 contentHash; // SHA-256 of the canonical (JCS) unsigned credential
        address issuer;      // wallet that registered it (the only one who can revoke)
        uint64 issuedAt;     // block timestamp at registration
        bool revoked;
        bool exists;
    }

    // key = keccak256(credential id string)
    mapping(bytes32 => Credential) private credentials;

    event CredentialRegistered(
        bytes32 indexed credentialIdHash,
        bytes32 contentHash,
        address indexed issuer,
        uint64 issuedAt
    );
    event CredentialRevoked(
        bytes32 indexed credentialIdHash,
        address indexed issuer,
        uint64 revokedAt
    );

    error AlreadyRegistered(bytes32 credentialIdHash);
    error NotRegistered(bytes32 credentialIdHash);
    error NotIssuer(address caller, address issuer);
    error AlreadyRevoked(bytes32 credentialIdHash);
    error EmptyHash();

    /// @notice Register a credential. Caller becomes its issuer.
    function registerCredential(bytes32 credentialIdHash, bytes32 contentHash) external {
        if (credentialIdHash == bytes32(0) || contentHash == bytes32(0)) revert EmptyHash();
        if (credentials[credentialIdHash].exists) revert AlreadyRegistered(credentialIdHash);

        uint64 nowTs = uint64(block.timestamp);
        credentials[credentialIdHash] = Credential({
            contentHash: contentHash,
            issuer: msg.sender,
            issuedAt: nowTs,
            revoked: false,
            exists: true
        });

        emit CredentialRegistered(credentialIdHash, contentHash, msg.sender, nowTs);
    }

    /// @notice Revoke a credential. Only the registering issuer may do this.
    function revokeCredential(bytes32 credentialIdHash) external {
        Credential storage c = credentials[credentialIdHash];
        if (!c.exists) revert NotRegistered(credentialIdHash);
        if (c.issuer != msg.sender) revert NotIssuer(msg.sender, c.issuer);
        if (c.revoked) revert AlreadyRevoked(credentialIdHash);

        c.revoked = true;
        emit CredentialRevoked(credentialIdHash, msg.sender, uint64(block.timestamp));
    }

    /// @notice Read a credential record. exists=false means "not found".
    function getCredential(bytes32 credentialIdHash)
        external
        view
        returns (
            bool exists,
            bytes32 contentHash,
            address issuer,
            uint64 issuedAt,
            bool revoked
        )
    {
        Credential storage c = credentials[credentialIdHash];
        return (c.exists, c.contentHash, c.issuer, c.issuedAt, c.revoked);
    }
}
