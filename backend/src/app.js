const express = require('express');
const { randomUUID } = require('node:crypto');
const { contentHash, credentialIdHash, signCredential, verifyCredential } = require('./credentials');

function createApp({ store, registry, signingPrivateKey, signingPublicKey, issuer = 'did:example:demo-university' }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  const api = express.Router();

  api.post('/credentials', async (req, res, next) => {
    try {
      const body = req.body;
      if (!body || !body.credentialSubject || typeof body.credentialSubject !== 'object' || Array.isArray(body.credentialSubject)) {
        return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'credentialSubject must be a JSON object.' } });
      }
      const now = new Date().toISOString();
      const unsigned = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'AcademicCredential'],
        id: `urn:uuid:${randomUUID()}`,
        issuer,
        issuanceDate: now,
        credentialSubject: body.credentialSubject
      };
      const credential = signCredential(unsigned, signingPrivateKey, signingPublicKey);
      const hash = contentHash(credential);
      const idHash = credentialIdHash(credential.id);
      const transactionHash = await registry.register(idHash, hash);
      await store.put(credential);
      return res.status(201).json({ id: credential.id, status: 'registered', transactionHash });
    } catch (error) { return next(error); }
  });

  api.get('/credentials/:id', async (req, res, next) => {
    try {
      const credential = await store.get(req.params.id);
      if (!credential) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Credential was not found.' } });
      return res.json(credential);
    } catch (error) { return next(error); }
  });

  api.get('/verify/:id', async (req, res, next) => {
    try {
      const idHash = credentialIdHash(req.params.id);
      const chain = await registry.get(idHash);
      if (!chain.exists) return res.json({ id: req.params.id, status: 'not_found', checks: { signatureValid: false, hashMatches: false, registeredOnChain: false, notRevoked: false } });
      const credential = await store.get(req.params.id);
      const signatureValid = Boolean(credential && verifyCredential(credential, signingPublicKey));
      const hashMatches = Boolean(credential && contentHash(credential) === chain.contentHash);
      const registeredOnChain = true;
      const notRevoked = !chain.revoked;
      let status = 'tampered';
      if (signatureValid && hashMatches && chain.revoked) status = 'revoked';
      else if (signatureValid && hashMatches && notRevoked) status = 'valid';
      return res.json({ id: req.params.id, status, checks: { signatureValid, hashMatches, registeredOnChain, notRevoked } });
    } catch (error) { return next(error); }
  });

  api.post('/credentials/:id/revoke', async (req, res, next) => {
    try {
      const idHash = credentialIdHash(req.params.id);
      const chain = await registry.get(idHash);
      if (!chain.exists) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Credential was not found.' } });
      const transactionHash = await registry.revoke(idHash);
      return res.json({ id: req.params.id, status: 'revoked', transactionHash });
    } catch (error) { return next(error); }
  });

  app.use('/api', api);
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } });
    }
    console.error('API request failed:', error.message);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'The request could not be completed.' } });
  });
  return app;
}

module.exports = { createApp };
