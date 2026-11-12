const { createHash, sign, verify } = require('node:crypto');
const canonicalize = require('canonicalize');
const { keccak256, toUtf8Bytes } = require('ethers');

function canonicalPayload(credential) {
  const { proof, ...unsigned } = credential;
  const canonical = canonicalize(unsigned);
  if (!canonical) throw new TypeError('Credential could not be canonicalized.');
  return { unsigned, canonical };
}

function contentHash(credential) {
  const { canonical } = canonicalPayload(credential);
  return `0x${createHash('sha256').update(canonical, 'utf8').digest('hex')}`;
}

function credentialIdHash(id) {
  return keccak256(toUtf8Bytes(id));
}

function signCredential(unsigned, privateKey, publicKey) {
  const canonical = canonicalize(unsigned);
  const signatureValue = sign(null, Buffer.from(canonical, 'utf8'), privateKey).toString('base64url');
  return {
    ...unsigned,
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      verificationMethod: 'did:example:demo-university#issuer-key-1',
      publicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
      proofValue: signatureValue
    }
  };
}

function verifyCredential(credential, expectedPublicKey) {
  if (!credential || typeof credential !== 'object' || !credential.proof) return false;
  try {
    const { canonical } = canonicalPayload(credential);
    const proof = credential.proof;
    if (proof.type !== 'Ed25519Signature2020' || typeof proof.publicKey !== 'string' || typeof proof.proofValue !== 'string') return false;
    const proofPublicKey = require('node:crypto').createPublicKey({
      key: Buffer.from(proof.publicKey, 'base64'), type: 'spki', format: 'der'
    });
    const publicKey = expectedPublicKey || proofPublicKey;
    if (expectedPublicKey && !proofPublicKey.export({ type: 'spki', format: 'der' }).equals(expectedPublicKey.export({ type: 'spki', format: 'der' }))) return false;
    return verify(null, Buffer.from(canonical, 'utf8'), publicKey, Buffer.from(proof.proofValue, 'base64url'));
  } catch {
    return false;
  }
}

module.exports = { canonicalPayload, contentHash, credentialIdHash, signCredential, verifyCredential };
