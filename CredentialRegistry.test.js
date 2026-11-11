const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialRegistry", () => {
  let registry, issuer, stranger;
  const idHash = ethers.keccak256(ethers.toUtf8Bytes("urn:uuid:demo-1"));
  const contentHash = ethers.sha256(ethers.toUtf8Bytes('{"demo":"canonical-json"}'));

  beforeEach(async () => {
    [issuer, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CredentialRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  it("registers a credential and emits an event", async () => {
    await expect(registry.registerCredential(idHash, contentHash))
      .to.emit(registry, "CredentialRegistered")
      .withArgs(idHash, contentHash, issuer.address, (v) => v > 0n);
  });

  it("returns the stored record", async () => {
    await registry.registerCredential(idHash, contentHash);
    const [exists, hash, recIssuer, issuedAt, revoked] = await registry.getCredential(idHash);
    expect(exists).to.equal(true);
    expect(hash).to.equal(contentHash);
    expect(recIssuer).to.equal(issuer.address);
    expect(issuedAt).to.be.gt(0n);
    expect(revoked).to.equal(false);
  });

  it("rejects duplicate registration", async () => {
    await registry.registerCredential(idHash, contentHash);
    await expect(registry.registerCredential(idHash, contentHash))
      .to.be.revertedWithCustomError(registry, "AlreadyRegistered");
  });

  it("rejects empty hashes", async () => {
    await expect(registry.registerCredential(ethers.ZeroHash, contentHash))
      .to.be.revertedWithCustomError(registry, "EmptyHash");
    await expect(registry.registerCredential(idHash, ethers.ZeroHash))
      .to.be.revertedWithCustomError(registry, "EmptyHash");
  });

  it("returns exists=false for an unknown ID", async () => {
    const [exists] = await registry.getCredential(idHash);
    expect(exists).to.equal(false);
  });

  it("lets the issuer revoke and emits an event", async () => {
    await registry.registerCredential(idHash, contentHash);
    await expect(registry.revokeCredential(idHash))
      .to.emit(registry, "CredentialRevoked");
    const rec = await registry.getCredential(idHash);
    expect(rec.revoked).to.equal(true);
  });

  it("blocks revocation by anyone but the registering issuer", async () => {
    await registry.registerCredential(idHash, contentHash);
    await expect(registry.connect(stranger).revokeCredential(idHash))
      .to.be.revertedWithCustomError(registry, "NotIssuer");
    expect((await registry.getCredential(idHash)).revoked).to.equal(false);
  });

  it("rejects revoking an unknown ID", async () => {
    await expect(registry.revokeCredential(idHash))
      .to.be.revertedWithCustomError(registry, "NotRegistered");
  });

  it("rejects revoking twice", async () => {
    await registry.registerCredential(idHash, contentHash);
    await registry.revokeCredential(idHash);
    await expect(registry.revokeCredential(idHash))
      .to.be.revertedWithCustomError(registry, "AlreadyRevoked");
  });
});
