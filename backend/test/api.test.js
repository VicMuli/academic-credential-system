const test = require('node:test');
const assert = require('node:assert/strict');
const { generateKeyPairSync } = require('node:crypto');
const { createApp } = require('../src/app');
const { contentHash, credentialIdHash, signCredential, verifyCredential } = require('../src/credentials');

function testKeys() { return generateKeyPairSync('ed25519'); }

test('JCS hash ignores property insertion order and signatures detect changed claims', () => {
  const keys = testKeys();
  const unsigned = { id: 'urn:uuid:test', credentialSubject: { name: 'Fictional Graduate', degree: 'BSc' } };
  const signed = signCredential(unsigned, keys.privateKey, keys.publicKey);
  assert.equal(contentHash(signed), contentHash({ credentialSubject: unsigned.credentialSubject, id: unsigned.id, proof: signed.proof }));
  assert.equal(verifyCredential(signed, keys.publicKey), true);
  const altered = { ...signed, credentialSubject: { ...signed.credentialSubject, degree: 'Changed degree' } };
  assert.equal(verifyCredential(altered, keys.publicKey), false);
});

test('API issues, verifies, hides claims, and revokes through the registry boundary', async (t) => {
  const keys = testKeys();
  const records = new Map();
  const chain = new Map();
  const issuerAddress = '0x00000000000000000000000000000000000000a1';
  const issuerApiToken = 'test-only-issuer-token';
  let tx = 0;
  const store = { async get(id) { return records.get(id) || null; }, async put(value) { records.set(value.id, value); } };
  const registry = {
    issuerAddress,
    async register(idHash, hash) { chain.set(idHash, { exists: true, contentHash: hash, issuer: issuerAddress, revoked: false }); return `0xtx${++tx}`; },
    async get(idHash) { return chain.get(idHash) || { exists: false, contentHash: null, revoked: false }; },
    async revoke(idHash) { chain.get(idHash).revoked = true; return `0xtx${++tx}`; }
  };
  const server = createApp({ store, registry, signingPrivateKey: keys.privateKey, signingPublicKey: keys.publicKey, issuerApiToken }).listen(0, '127.0.0.1');
  t.after(() => server.close());
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;

  const unauthorizedIssue = await fetch(`${base}/credentials`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ credentialSubject: { name: 'Fictional Graduate' } }) });
  assert.equal(unauthorizedIssue.status, 401);
  const issuerHeaders = { 'content-type': 'application/json', authorization: `Bearer ${issuerApiToken}` };
  const issue = await fetch(`${base}/credentials`, { method: 'POST', headers: issuerHeaders, body: JSON.stringify({ credentialSubject: { name: 'Fictional Graduate', degree: 'BSc Example Studies' } }) });
  assert.equal(issue.status, 201);
  const issued = await issue.json();
  assert.equal(issued.status, 'registered');
  assert.match(issued.transactionHash, /^0xtx/);

  const valid = await fetch(`${base}/verify/${encodeURIComponent(issued.id)}`);
  const validBody = await valid.json();
  assert.equal(validBody.status, 'valid');
  assert.equal(validBody.checks.signatureValid, true);
  assert.equal(validBody.checks.issuerMatches, true);
  assert.equal('credentialSubject' in validBody, false);

  const record = chain.get(credentialIdHash(issued.id));
  record.issuer = '0x00000000000000000000000000000000000000b2';
  const wrongIssuer = await fetch(`${base}/verify/${encodeURIComponent(issued.id)}`);
  const wrongIssuerBody = await wrongIssuer.json();
  assert.equal(wrongIssuerBody.status, 'tampered');
  assert.equal(wrongIssuerBody.checks.issuerMatches, false);
  record.issuer = issuerAddress;

  const issuerRead = await fetch(`${base}/credentials/${encodeURIComponent(issued.id)}`, { headers: { authorization: `Bearer ${issuerApiToken}` } });
  assert.equal(issuerRead.status, 200);
  assert.equal((await issuerRead.json()).credentialSubject.name, 'Fictional Graduate');
  const unauthorizedRead = await fetch(`${base}/credentials/${encodeURIComponent(issued.id)}`);
  assert.equal(unauthorizedRead.status, 401);

  const unauthorizedRevoke = await fetch(`${base}/credentials/${encodeURIComponent(issued.id)}/revoke`, { method: 'POST' });
  assert.equal(unauthorizedRevoke.status, 401);
  const revoke = await fetch(`${base}/credentials/${encodeURIComponent(issued.id)}/revoke`, { method: 'POST', headers: { authorization: `Bearer ${issuerApiToken}` } });
  assert.equal((await revoke.json()).status, 'revoked');
  const revoked = await fetch(`${base}/verify/${encodeURIComponent(issued.id)}`);
  assert.equal((await revoked.json()).status, 'revoked');

  const missingId = 'urn:uuid:not-found';
  assert.equal(credentialIdHash(missingId).length, 66);
  const missing = await fetch(`${base}/verify/${encodeURIComponent(missingId)}`);
  assert.equal((await missing.json()).status, 'not_found');
});

test('credential verification rejects a proof signed by a different key', () => {
  const trusted = testKeys();
  const attacker = testKeys();
  const signedByAttacker = signCredential({ id: 'urn:uuid:test' }, attacker.privateKey, attacker.publicKey);
  assert.equal(verifyCredential(signedByAttacker, trusted.publicKey), false);
});
